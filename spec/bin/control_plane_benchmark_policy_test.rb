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

  def test_public_benchmark_enforces_tls_on_root_seller_api_and_instance_hosts
    result = probe(environment: "benchmark", public_benchmark: "true")
    result.fetch("tls").each do |row|
      assert_equal 301, row.fetch("http_status"), row.fetch("host")
      assert_equal "https://#{row.fetch('host')}/l/bgfjk?layout=profile", row.fetch("location")
      assert_equal 307, row.fetch("post_status")
      assert_equal 200, row.fetch("https_status")
      assert_equal "max-age=31536000", row.fetch("hsts")
      assert_includes row.fetch("cookie"), "; secure"
    end
  end

  def test_local_harness_remains_http_and_ordinary_tls_behavior_is_preserved
    [nil, "false"].each do |public_benchmark|
      probe(environment: "benchmark", public_benchmark:).fetch("tls").each do |row|
        assert_equal 200, row.fetch("http_status")
        assert_nil row.fetch("hsts")
      end
    end
    %w[production staging].each do |environment|
      rows = probe(environment:).fetch("tls")
      assert_equal 301, rows.first.fetch("http_status")
      assert_equal "max-age=31536000", rows.first.fetch("hsts")
      assert_equal 200, rows[1].fetch("http_status")
      assert_nil rows[1].fetch("hsts")
    end
    %w[development test].each do |environment|
      assert_equal 200, probe(environment:).fetch("tls").first.fetch("http_status")
    end
  end

  def test_template_health_probes_reach_the_handler_without_disabling_public_tls
    probe(environment: "benchmark", public_benchmark: "true").fetch("health_probes").each do |row|
      assert_equal 200, row.fetch("status"), row.fetch("probe")
      assert_equal "healthcheck", row.fetch("body")
      assert_equal 1, row.fetch("calls")
      assert_equal 503, row.fetch("unhealthy_status")
      assert_equal 1, row.fetch("unhealthy_calls")
      assert_equal 301, row.fetch("without_header_status")
      assert_equal 0, row.fetch("without_header_calls")
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
        require "yaml"
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
        options = nil
        recorder = Object.new
        recorder.define_singleton_method(:insert_before) do |anchor, middleware, *args|
          options = args.first if middleware == Rack::SSL
        end
        recorder.define_singleton_method(:method_missing) { |*| nil }
        Rails.application.config.middleware.merge_into(recorder)
        raise "Rack::SSL options missing" unless options
        ssl = Rack::SSL.new(->(_) { [200, { "Set-Cookie" => "session=fixture" }, ["ok"]] }, options)
        hosts = [DOMAIN, "luisfurushio.gumroad-rorp.reactonrails.com", "api.gumroad-rorp.reactonrails.com",
          "rails-qaxqqpc4ry8hw.cpln.app", "rails-gumroad-rorp.aws-us-east-2.cpln.app"]
        tls = hosts.map do |host|
          url = "http://\#{host}/l/bgfjk?layout=profile"
          http = ssl.call(Rack::MockRequest.env_for(url, "HTTP_HOST" => host))
          post = ssl.call(Rack::MockRequest.env_for(url, "HTTP_HOST" => host, method: "POST"))
          https = ssl.call(Rack::MockRequest.env_for(url, "HTTP_HOST" => host, "HTTP_X_FORWARDED_PROTO" => "https"))
          { host: host, http_status: http.first, location: http[1]["Location"], post_status: post.first,
            https_status: https.first, hsts: https[1]["Strict-Transport-Security"], cookie: https[1]["Set-Cookie"] }
        end
        container = YAML.load_file(".controlplane/templates/rails.yml").fetch("spec").fetch("containers").first
        health_probes = %w[livenessProbe readinessProbe].map do |name|
          request = container.fetch(name).fetch("httpGet")
          headers = request.fetch("httpHeaders", []).to_h do |header|
            ["HTTP_" + header.fetch("name").upcase.tr("-", "_"), header.fetch("value")]
          end
          url = "http://10.20.0.8:\#{request.fetch('port')}\#{request.fetch('path')}"
          run_health = lambda do |request_headers, status|
            calls = 0
            handler = ->(_) { calls += 1; [status, {}, ["healthcheck"]] }
            response = Rack::SSL.new(handler, options).call(Rack::MockRequest.env_for(url, request_headers))
            [response, calls]
          end
          healthy, calls = run_health.call(headers, 200)
          unhealthy, unhealthy_calls = run_health.call(headers, 503)
          without_header, without_header_calls = run_health.call({}, 200)
          { probe: name, status: healthy.first, body: healthy.last.join, calls: calls,
            unhealthy_status: unhealthy.first, unhealthy_calls: unhealthy_calls,
            without_header_status: without_header.first, without_header_calls: without_header_calls }
        end
        puts JSON.generate(types: Rails.application.config.active_storage.web_image_content_types,
          successes: statuses.count(200), last_status: statuses.last, tls: tls, health_probes: health_probes)
      RUBY
      output, error, status = Open3.capture3(
        { "RAILS_ENV" => environment, "RACK_ENV" => environment,
          "CONTROL_PLANE_BENCHMARK" => public_benchmark, "BASH_ENV" => nil, "ENV" => nil,
          "RAILS_MASTER_KEY" => nil, "DISABLE_TEST_REDIS_ISOLATION" => "true",
          "REDIS_HOST" => "127.0.0.1:1/0", "RACK_ATTACK_REDIS_HOST" => "127.0.0.1:1/0",
          "MEMCACHE_SERVERS" => "127.0.0.1:1", "REVISION" => "policy-test",
          "BRANCH_DEPLOYMENT" => nil,
          "CUSTOM_DOMAIN" => environment == "benchmark" && public_benchmark == "true" ? "gumroad-rorp.reactonrails.com" : nil,
          "CUSTOM_PROTOCOL" => nil },
        RbConfig.ruby, "-e", script, chdir: ROOT
      )
      assert status.success?, error
      JSON.parse(output.lines.last)
    end
end
