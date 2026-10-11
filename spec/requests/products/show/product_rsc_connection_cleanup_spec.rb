# frozen_string_literal: true

require "spec_helper"

describe "Product Live connection cleanup", type: :request do
  it "releases the worker's database leases after repeated flag-off Inertia visits" do
    product = create(:product)
    url = product.long_url(layout: "profile")
    completed_requests = Queue.new
    handler = ActiveRecord::Base.connection_handler
    baseline_busy_connections = handler.each_connection_pool(:all).sum { _1.stat[:busy] }
    request_thread_id = Thread.current.object_id

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
      get url, headers: { "X-Inertia" => "true", "X-Requested-With" => "XMLHttpRequest" }

      expect(response).to be_successful
      expect(response.headers["X-Inertia"]).to eq("true")
      Timeout.timeout(10) { completed_requests.pop }
    end

    expect(observations.map { _1[:worker_id] }).not_to include(request_thread_id)
    expect(observations.map { _1[:leases].size }).to eq([0, 0, 0, 0, 0])
    expect(handler.each_connection_pool(:all).sum { _1.stat[:busy] }).to be <= baseline_busy_connections
  end
end
