# frozen_string_literal: true

require "spec_helper"

describe "Product Live connection cleanup", type: :request do
  it "releases the worker's database leases after repeated eligible document visits" do
    product = create(:product)
    Feature.activate_user(:product_page_react_on_rails, product.user)
    allow(ReactOnRailsPro.configuration).to receive(:server_renderer).and_return("NodeRenderer")
    allow(ReactOnRailsPro.configuration).to receive(:renderer_password).and_return("test-only-stub")
    parent_leases = []
    prior_parent_leases = []
    handler = ActiveRecord::Base.connection_handler
    request_thread_id = Thread.current.object_id
    allow(ProductRscDocumentRequestConstraint).to receive(:matches?).and_wrap_original do |original, request|
      prior_parent_leases << handler.each_connection_pool(:all).filter_map do |pool|
        pool.db_config.name if pool.connections.any? { _1.owner&.object_id == request_thread_id }
      end
      original.call(request)
    end
    allow_any_instance_of(ProductRscLinksController).to receive(:stream_view_containing_react_components) do |controller, **|
      parent_leases << handler.each_connection_pool(:all).filter_map do |pool|
        pool.db_config.name if pool.connections.any? { _1.owner&.object_id == request_thread_id }
      end
      controller.response.stream.write("<main>connection cleanup</main>")
    end
    url = product.long_url(layout: "profile")
    completed_requests = Queue.new
    handler.clear_active_connections!(:all)
    baseline_busy_connections = handler.each_connection_pool(:all).sum { _1.stat[:busy] }

    # Rails' request-test shim runs Live inline; exercise its real pooled worker instead.
    allow_any_instance_of(ProductRscLinksController).to receive(:new_controller_thread) do |controller, &block|
      controller.send(:original_new_controller_thread, &block)
    end
    allow_any_instance_of(ProductRscLinksController).to receive(:clean_up_thread_locals) do |controller, *args|
      controller.send(:original_clean_up_thread_locals, *args)
    end

    allow_any_instance_of(ProductRscLinksController).to receive(:process_action).and_wrap_original do |original, *args|
      original.call(*args)
    ensure
      leases = handler.each_connection_pool(:all).filter_map { _1.db_config.name if _1.active_connection? }
      observation = { worker_id: Thread.current.object_id, leases: }
      # Observe first, then keep a failing implementation from poisoning later examples.
      handler.clear_active_connections!(:all) if leases.any?
      completed_requests << observation
    end

    observations = 5.times.map do
      get url

      expect(response).to be_successful
      expect(response.body).to eq("<main>connection cleanup</main>")
      Timeout.timeout(10) { completed_requests.pop }
    end

    expect(observations.map { _1[:worker_id] }).not_to include(request_thread_id)
    expect(observations.map { _1[:leases].size }).to eq([0, 0, 0, 0, 0])
    expect(parent_leases).to eq(prior_parent_leases)
    expect(handler.each_connection_pool(:all).sum { _1.stat[:busy] }).to be <= baseline_busy_connections
  end
end
