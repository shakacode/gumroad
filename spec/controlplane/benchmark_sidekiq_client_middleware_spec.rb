# frozen_string_literal: true

require "pathname"
require "json"
require "sidekiq/testing"

root = Pathname.new(__dir__).join("../..").expand_path
require root.join("lib/extras/control_plane_benchmark_sidekiq_client_middleware")

RSpec.describe ControlPlaneBenchmarkSidekiqClientMiddleware do
  def worker(name)
    stub_const(name, Class.new do
      include Sidekiq::Job

      def perform(*)
      end
    end)
  end

  def active_job_payload(job_class, wrapped: nil)
    {
      "class" => "ActiveJob::QueueAdapters::SidekiqAdapter::JobWrapper",
      "wrapped" => wrapped,
      "queue" => "default",
      "args" => [
        {
          "job_class" => job_class,
          "arguments" => ["sensitive-job-argument"],
        },
      ],
    }.compact
  end

  before do
    @original_benchmark = ENV["CONTROL_PLANE_BENCHMARK"]
    ENV["CONTROL_PLANE_BENCHMARK"] = "true"
    Sidekiq::Testing.fake!
    Sidekiq::Worker.clear_all
    Sidekiq.default_configuration.client_middleware do |chain|
      chain.clear
      chain.add(described_class)
    end
  end

  after do
    Sidekiq::Worker.clear_all
    Sidekiq.default_configuration.client_middleware(&:clear)
    ENV["CONTROL_PLANE_BENCHMARK"] = @original_benchmark
  end

  it "allows only allowlisted direct jobs" do
    allowed = worker("ElasticsearchIndexerWorker")
    blocked = worker("CreateStripeApplePayDomainWorker")

    expect(allowed.perform_async("allowed-argument")).to be_a(String)
    expect(blocked.perform_async("sensitive-blocked-argument")).to be_nil
    expect(allowed.jobs.size).to eq(1)
    expect(blocked.jobs).to be_empty
  end

  it "unwraps allowlisted and blocked Active Job payloads" do
    expect(Sidekiq::Client.push(active_job_payload("SendToElasticsearchWorker", wrapped: "SendToElasticsearchWorker"))).to be_a(String)
    expect(Sidekiq::Client.push(active_job_payload("GenerateVideoPosterWorker"))).to be_a(String)
    expect(Sidekiq::Client.push(active_job_payload("CreateStripeApplePayDomainWorker", wrapped: "CreateStripeApplePayDomainWorker"))).to be_nil
    expect(Sidekiq::Client.push(active_job_payload("ComputeProductRecommendationsJob"))).to be_nil
    expect(Sidekiq::Worker.jobs.size).to eq(2)
  end

  it "allows Active Storage purge jobs through the Active Job wrapper" do
    purge_result = Sidekiq::Client.push(active_job_payload("ActiveStorage::PurgeJob", wrapped: "ActiveStorage::PurgeJob"))
    analyze_result = Sidekiq::Client.push(active_job_payload("ActiveStorage::AnalyzeJob", wrapped: "ActiveStorage::AnalyzeJob"))
    direct_result = described_class.new.call("ActiveStorage::PurgeJob", { "args" => [] }, "default", nil) { "allowed" }

    expect(purge_result).to be_a(String)
    expect(analyze_result).to be_nil
    expect(direct_result).to be_nil
    expect(Sidekiq::Worker.jobs.size).to eq(1)
  end

  it "filters every entry in push_bulk" do
    allowed = Sidekiq::Client.push_bulk(
      "class" => "ProcessAssetPreviewRetinaWorker",
      "args" => [[1], [2]],
    )
    blocked = Sidekiq::Client.push_bulk(
      "class" => "CreateStripeApplePayDomainWorker",
      "args" => [[1], [2]],
    )

    expect(allowed).to all(be_a(String))
    expect(blocked).to eq([nil, nil])
    expect(Sidekiq::Worker.jobs.size).to eq(2)
  end

  it "filters scheduled jobs before they enter Redis" do
    allowed = worker("ResizeOversizedAssetPreviewWorker")
    blocked = worker("CreateStripeApplePayDomainWorker")

    expect(allowed.perform_in(60, "allowed-argument")).to be_a(String)
    expect(blocked.perform_in(60, "sensitive-blocked-argument")).to be_nil
    expect(allowed.jobs.fetch(0).fetch("at")).to be_a(Numeric)
    expect(blocked.jobs).to be_empty
  end

  it "passes blocked classes through outside the Control Plane benchmark" do
    ENV.delete("CONTROL_PLANE_BENCHMARK")
    worker_class = worker("CreateStripeApplePayDomainWorker")

    expect(worker_class.perform_async("production-argument")).to be_a(String)
    expect(worker_class.jobs.size).to eq(1)
  end

  it "logs drop metadata without job arguments" do
    blocked = worker("CreateStripeApplePayDomainWorker")
    allow(Sidekiq.logger).to receive(:warn)

    blocked.perform_async("sensitive-blocked-argument")

    expect(Sidekiq.logger).to have_received(:warn) do |message|
      expect(JSON.parse(message)).to eq(
        "event" => "control_plane_benchmark_sidekiq_job_dropped",
        "job_class" => "CreateStripeApplePayDomainWorker",
        "queue" => "default",
      )
      expect(message).not_to include("sensitive-blocked-argument", "args")
    end
  end

  it "keeps the allowlist explicit" do
    expect(described_class::ALLOWED_JOB_CLASSES).to contain_exactly(
      "ElasticsearchIndexerWorker",
      "SendToElasticsearchWorker",
      "ProcessAssetPreviewRetinaWorker",
      "ResizeOversizedAssetPreviewWorker",
      "GenerateVideoPosterWorker",
      "InvalidateProductCacheWorker",
    )
    expect(described_class::ALLOWED_JOB_CLASSES).not_to include(described_class::ACTIVE_JOB_WRAPPER)
    expect(described_class::ALLOWED_ACTIVE_JOB_CLASSES).to contain_exactly("ActiveStorage::PurgeJob")
  end

  it "runs before unique-job locking in both client chains" do
    initializer = root.join("config/initializers/sidekiq.rb").read
    client_chains = initializer.scan(/config\.client_middleware do \|chain\|(.*?)^  end/m)

    expect(client_chains.size).to eq(2)
    client_chains.each do |(chain)|
      expect(chain.index("chain.add ControlPlaneBenchmarkSidekiqClientMiddleware")).to be <
        chain.index("chain.add SidekiqUniqueJobs::Middleware::Client")
    end
  end
end
