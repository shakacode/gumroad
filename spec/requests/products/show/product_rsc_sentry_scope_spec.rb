# frozen_string_literal: true

require "spec_helper"

describe "Product Live Sentry scope", type: :request do
  around do |example|
    live = ActionController::Live
    test_thread_method = live.instance_method(:new_controller_thread)
    test_cleanup_method = live.instance_method(:clean_up_thread_locals)
    original_hub = Sentry.get_current_hub
    @executor = Concurrent::FixedThreadPool.new(1)

    # Restore Rails' real worker below the controller's scope-transfer override.
    live.send(:alias_method, :new_controller_thread, :original_new_controller_thread)
    live.send(:alias_method, :clean_up_thread_locals, :original_clean_up_thread_locals)
    example.run
  ensure
    @executor&.shutdown
    @executor&.wait_for_termination(10)
    live.send(:define_method, :new_controller_thread, test_thread_method)
    live.send(:define_method, :clean_up_thread_locals, test_cleanup_method)
    Thread.current.thread_variable_set(Sentry::THREAD_LOCAL, original_hub)
  end

  before do
    allow(ActionController::Live).to receive(:live_thread_pool_executor).and_return(@executor)
    configuration = Sentry::Configuration.new
    configuration.dsn = "http://public@sentry.invalid/1"
    configuration.transport.transport_class = Sentry::DummyTransport
    configuration.background_worker_threads = 0
    configuration.send_default_pii = true
    @sentry_client = Sentry::Client.new(configuration)
    allow(Sentry).to receive(:get_main_hub).and_return(Sentry::Hub.new(@sentry_client, Sentry::Scope.new))
    Sentry.clone_hub_to_current_thread
  end

  it "isolates request context and restores the pooled worker's scope even after a committed-response error" do
    product = create(:product)
    Feature.activate_user(:product_page_react_on_rails, product.user)
    allow(ReactOnRailsPro.configuration).to receive(:server_renderer).and_return("NodeRenderer")
    allow(ReactOnRailsPro.configuration).to receive(:renderer_password).and_return("test-only-stub")
    allow_any_instance_of(ProductRscLinksController).to receive(:stream_view_containing_react_components) do |controller, **|
      controller.response.stream.write("<main>scope probe</main>")
    end
    completed_workers = Queue.new
    parent_scopes = []
    worker_ids = []

    allow_any_instance_of(ProductRscLinksController).to receive(:process).and_wrap_original do |original, *args|
      marker = original.receiver.request.headers["X-Sentry-Probe"]
      scope = Sentry.get_current_scope
      scope.set_user(id: marker)
      scope.set_tags(request_probe: marker)
      scope.set_level(:warning)
      scope.add_breadcrumb(Sentry::Breadcrumb.new(message: "parent-#{marker}"))
      scope.add_event_processor do |event, _hint|
        event.extra[:request_processor] = marker
        event
      end
      parent_scopes << scope
      original.call(*args)
    end

    allow_any_instance_of(ProductRscLinksController).to receive(:show).and_wrap_original do |original, *args|
      scope = Sentry.get_current_scope
      worker_ids << Thread.current.object_id
      Sentry.capture_message("scope probe")
      scope.set_tags(worker_only: true)
      scope.add_breadcrumb(Sentry::Breadcrumb.new(message: "worker-only"))
      result = original.call(*args)
      raise "post-commit scope probe" if original.receiver.request.headers["X-Sentry-Probe"] == "second"
      result
    end

    allow(ActionController::Live.live_thread_pool_executor).to receive(:post).and_wrap_original do |original, &block|
      original.call do
        block.call
      ensure
        scope = Sentry.get_current_scope
        completed_workers << { user: scope.user.dup, tags: scope.tags.dup, rack_env: scope.rack_env.dup,
                               breadcrumbs: scope.breadcrumbs.members.map(&:message) }
      end
    end

    restored_scopes = %w[first second].map do |marker|
      get product.long_url(layout: "profile"),
          headers: { "X-Sentry-Probe" => marker }

      expect(response).to be_successful
      expect(response.body).to eq("<main>scope probe</main>")
      Timeout.timeout(10) { completed_workers.pop }
    end

    events = @sentry_client.transport.events.select { _1.message == "scope probe" }
    expect(events.map { _1.user[:id] }).to eq(%w[first second])
    expect(events.map { _1.tags[:request_probe] }).to eq(%w[first second])
    expect(events.map { _1.extra[:request_processor] }).to eq(%w[first second])
    expect(events.map(&:level)).to eq(%i[warning warning])
    expect(events.map { _1.request.headers["X-Sentry-Probe"] }).to eq(%w[first second])
    expect(events.map { |event| event.breadcrumbs.members.map(&:message).grep(/^parent-/) })
      .to eq([["parent-first"], ["parent-second"]])
    expect(events.none? { _1.tags[:worker_only] || _1.breadcrumbs.members.any? { |crumb| crumb.message == "worker-only" } }).to eq(true)
    expect(worker_ids.uniq.size).to eq(1)
    expect(worker_ids).not_to include(Thread.current.object_id)
    expect(restored_scopes).to all(eq(user: {}, tags: {}, rack_env: {}, breadcrumbs: []))
    expect(parent_scopes.none? { _1.tags[:worker_only] || _1.breadcrumbs.members.any? { |crumb| crumb.message == "worker-only" } }).to eq(true)

    error_event = @sentry_client.transport.events.find { _1.exception&.values&.last&.value&.start_with?("post-commit scope probe") }
    expect(error_event).to be_present
    expect(error_event.user[:id]).to eq("second")
    expect(error_event.request.headers["X-Sentry-Probe"]).to eq("second")
    expect(error_event.extra[:request_processor]).to eq("second")
    expect(error_event.transaction).to eq("ProductRscLinksController#show")
    expect(error_event.transaction_info[:source]).to eq(:view)
    expect(error_event.exception.values.last.type).to eq("RuntimeError")
  end

  [false, true].each do |enabled|
    it "reports actual #{enabled ? 'Live' : 'ordinary'} precommit exceptions with controller identity and request context" do
      product = create(:product)
      allow_any_instance_of(LinksController).to receive(:show).and_raise(RuntimeError, "precommit scope probe")
      controller = enabled ? ProductRscLinksController : LinksController
      allow_any_instance_of(controller).to receive(:set_default_page_title).and_wrap_original do |original, *args|
        marker = original.receiver.request.headers["X-Sentry-Probe"]
        scope = Sentry.get_current_scope
        scope.set_user(id: marker)
        scope.set_tags(request_probe: marker)
        scope.add_event_processor do |event, _hint|
          event.extra[:request_processor] = marker
          event
        end
        original.call(*args)
      end
      enabled ? Feature.activate_user(:product_page_react_on_rails, product.user) : Feature.deactivate_user(:product_page_react_on_rails, product.user)
      marker = enabled ? "live" : "ordinary"
      expect do
        get product.long_url(layout: "profile"), headers: { "X-Sentry-Probe" => marker }
      end.to raise_error(RuntimeError, "precommit scope probe")

      event = @sentry_client.transport.events.last
      expect(event.exception.values.last.type).to eq("RuntimeError")
      expect(event.exception.values.last.value).to start_with("precommit scope probe")
      expect(event.transaction).to eq(enabled ? "ProductRscLinksController#show" : "LinksController#show")
      expect(event.transaction_info[:source]).to eq(:view)
      expect(event.request.headers["X-Sentry-Probe"]).to eq(marker)
      expect(event.user[:id]).to eq(marker)
      expect(event.tags[:request_probe]).to eq(marker)
      expect(event.extra[:request_processor]).to eq(marker)
      expect(@sentry_client.transport.events.count { _1.exception&.values&.last&.value&.start_with?("precommit scope probe") }).to eq(1)
      expect(Sentry.get_current_scope.tags).not_to have_key(:worker_only)
    end
  end

  it "retains controller identity and request metadata when routing lookup fails" do
    product = create(:product)
    allow(Link).to receive(:fetch_leniently).and_raise(ActiveRecord::ConnectionNotEstablished, "routing lookup probe")
    expect do
      get product.long_url(layout: "profile"), headers: { "X-Sentry-Probe" => "lookup" }
    end.to raise_error(ActiveRecord::ConnectionNotEstablished, "routing lookup probe")

    event = @sentry_client.transport.events.last
    expect(event.transaction).to eq("LinksController#show")
    expect(event.transaction_info[:source]).to eq(:view)
    expect(event.request.headers["X-Sentry-Probe"]).to eq("lookup")
    expect(event.exception.values.last.type).to eq("ActiveRecord::ConnectionNotEstablished")
    expect(event.exception.values.last.value).to start_with("routing lookup probe")
  end
end
