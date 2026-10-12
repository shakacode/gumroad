# frozen_string_literal: true

require "json"
require "minitest/autorun"
require "open3"
require "rbconfig"

class ControlPlaneBenchmarkPolicyTest < Minitest::Test
  ROOT = File.expand_path("../..", __dir__)

  def test_ordinary_environments_preserve_thumbnail_formats
    %w[production staging development test].each do |environment|
      assert_equal %w[image/png image/jpeg image/gif], probe(environment:).fetch("types"), environment
    end
  end

  def test_benchmark_retains_webp_for_local_and_public_fixtures
    [nil, "false", "true"].each do |public_benchmark|
      assert_equal %w[image/png image/jpeg image/gif image/webp],
                   probe(environment: "benchmark", public_benchmark:).fetch("types")
    end
  end

  def test_only_the_local_benchmark_harness_bypasses_existing_throttles
    [nil, "false"].each do |public_benchmark|
      result = probe(environment: "benchmark", public_benchmark:)
      assert_equal 61, result.fetch("successes")
      assert_equal 200, result.fetch("last_status")
    end
    ["benchmark", "production"].each do |environment|
      result = probe(environment:, public_benchmark: "true")
      assert_equal 60, result.fetch("successes"), environment
      assert_equal 429, result.fetch("last_status"), environment
    end
  end

  private
    def probe(environment:, public_benchmark: nil)
      @probes ||= {}
      @probes[[environment, public_benchmark]] ||= run_probe(environment:, public_benchmark:)
    end

    def run_probe(environment:, public_benchmark:)
      script = <<~RUBY
        require "json"
        require "logger"
        require "stringio"
        require "rack/mock"
        require "rack/deflater"
        require "./config/application"
        load "config/environments/\#{Rails.env}.rb"
        load "config/initializers/rack_attack.rb"
        require "active_support/testing/time_helpers"
        include ActiveSupport::Testing::TimeHelpers
        travel_to(Time.utc(2026, 1, 1))
        Rails.logger = Logger.new(StringIO.new)
        Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
        app = Rack::Attack.new(->(_) { [200, {}, ["ok"]] })
        statuses = 61.times.map do
          app.call(Rack::MockRequest.env_for("https://benchmark.example.com/",
            "REMOTE_ADDR" => "198.51.100.1")).first
        end
        puts JSON.generate(types: Rails.application.config.active_storage.web_image_content_types,
          successes: statuses.count(200), last_status: statuses.last)
      RUBY
      output, error, status = Open3.capture3(
        { "RAILS_ENV" => environment, "RACK_ENV" => environment,
          "CONTROL_PLANE_BENCHMARK" => public_benchmark, "BASH_ENV" => nil, "ENV" => nil,
          "RAILS_MASTER_KEY" => nil, "DISABLE_TEST_REDIS_ISOLATION" => "true",
          "REDIS_HOST" => "127.0.0.1:1/0", "RACK_ATTACK_REDIS_HOST" => "127.0.0.1:1/0",
          "MEMCACHE_SERVERS" => "127.0.0.1:1", "REVISION" => "policy-test",
          "BRANCH_DEPLOYMENT" => nil, "CUSTOM_DOMAIN" => nil, "CUSTOM_PROTOCOL" => nil },
        RbConfig.ruby, "-e", script, chdir: ROOT
      )
      assert status.success?, error
      JSON.parse(output.lines.last)
    end
end
