# frozen_string_literal: true

require "json"
require "minitest/autorun"
require "open3"
require "rbconfig"
require "yaml"

class ControlPlaneBenchmarkContractTest < Minitest::Test
  ROOT = File.expand_path("../..", __dir__)

  def test_benchmark_accepts_canonical_and_regional_instance_hosts
    %w[rails-example.cpln.app rails-example.aws-us-east-2.controlplane.us].each do |host|
      result = route(host:, environment: "benchmark", enabled: "true")
      assert result.fetch("root"), host
      assert result.fetch("discover"), host
      refute result.fetch("discover_home"), host
    end
  end

  def test_instance_hosts_require_the_benchmark_environment_and_guard
    refute route(host: "rails-example.cpln.app", environment: "production", enabled: "true").fetch("root")
    refute route(host: "rails-example.cpln.app", environment: "benchmark", enabled: "false").fetch("root")
    refute route(host: "rails-example.cpln.app.example.com", environment: "benchmark", enabled: "true").fetch("root")
  end

  def test_custom_root_keeps_https_and_ordinary_host_routing
    result = route(host: "gumroad-inertia.example.com", environment: "benchmark", enabled: "true")
    assert result.fetch("root")
    assert_equal "https", result.fetch("protocol")
    assert_equal "gumroad-inertia.example.com", result.fetch("domain")
    assert_equal result.fetch("domain"), result.fetch("api_domain")
  end

  def test_private_renderer_receives_the_same_auth_and_license_as_rails
    renderer = YAML.safe_load(File.read("#{ROOT}/.controlplane/templates/renderer.yml"))
      .fetch("spec").fetch("containers").first
    renderer_env = renderer.fetch("env").to_h { |item| [item.fetch("name"), item.fetch("value")] }
    %w[inertia rorp].each do |surface|
      app_env = YAML.safe_load(File.read("#{ROOT}/.controlplane/templates/app-#{surface}.yml"))
        .fetch("spec").fetch("env").to_h { |item| [item.fetch("name"), item.fetch("value")] }
      assert_equal app_env.fetch("RENDERER_PASSWORD"), renderer_env.fetch("RENDERER_PASSWORD")
      assert_equal app_env.fetch("REACT_ON_RAILS_PRO_LICENSE"), renderer_env.fetch("REACT_ON_RAILS_PRO_LICENSE")
    end
  end

  private
    def route(host:, environment:, enabled:)
      script = <<~RUBY
        require "json"
        require "active_support/core_ext/string/inquiry"
        require "active_support/core_ext/object/blank"
        module Rails
          def self.env = ENV.fetch("RAILS_ENV").inquiry
        end
        load "config/domain.rb"
        load "lib/gumroad_domain_constraint.rb"
        load "lib/discover_domain_constraint.rb"
        request = Struct.new(:host, :path).new(ARGV.fetch(0), "/discover")
        puts JSON.generate(root: GumroadDomainConstraint.matches?(request),
          discover: DiscoverDomainConstraint.matches?(request),
          discover_home: DiscoverDomainConstraint.matches?(request.class.new(request.host, "/")),
          protocol: PROTOCOL, domain: DOMAIN, api_domain: API_DOMAIN)
      RUBY
      output, error, status = Open3.capture3(
        { "RAILS_ENV" => environment, "CONTROL_PLANE_BENCHMARK" => enabled,
          "BRANCH_DEPLOYMENT" => "true", "CUSTOM_DOMAIN" => "gumroad-inertia.example.com",
          "CUSTOM_PROTOCOL" => nil, "BENCHMARK_PROTOCOL" => "https" },
        RbConfig.ruby, "-e", script, host, chdir: ROOT
      )
      assert status.success?, error
      JSON.parse(output)
    end
end
