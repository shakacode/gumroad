# frozen_string_literal: true

require "minitest/autorun"
require "tmpdir"
require "fileutils"
require "rbconfig"
require_relative "../../.controlplane/verify_rails_probes"

class ControlPlaneRailsProbesTest < Minitest::Test
  SCRIPT = File.expand_path("../../.controlplane/verify_rails_probes.rb", __dir__)

  def workload
    { "name" => "rails", "spec" => { "containers" => [{ "name" => "rails", "livenessProbe" => probe,
                                                        "readinessProbe" => probe }] } }
  end

  def probe
    { "httpGet" => { "path" => "/healthcheck", "port" => 3000,
                     "httpHeaders" => [{ "name" => "x-forwarded-proto", "value" => "https" }] } }
  end

  def test_read_only_validation_rejects_missing_ambiguous_or_wrong_probe_configuration
    data = workload
    before = JSON.generate(data)
    assert ControlPlaneRailsProbes.verify!(data)
    assert_equal before, JSON.generate(data)
    %w[livenessProbe readinessProbe].each do |name|
      [nil, {}, { "httpGet" => { "path" => "/healthcheck", "port" => 3000 } }].each do |probe|
        data = workload
        data["spec"]["containers"].first[name] = probe
        assert_raises(RuntimeError) { ControlPlaneRailsProbes.verify!(data) }
      end
      [{ "port" => 443 }, { "path" => "/" }, { "scheme" => "HTTPS" },
       { "httpHeaders" => [] }, { "httpHeaders" => [{ "name" => "X-Forwarded-Proto", "value" => "http" }] },
       { "httpHeaders" => [{ "name" => "x-forwarded-proto", "value" => "https" },
                           { "name" => "X-Forwarded-Proto", "value" => "https" }] },
       { "httpHeaders" => [{ "name" => "X_Forwarded_Proto", "value" => "https" }] },
       { "httpHeaders" => [{ "name" => "X-Forwarded-Proto", "value" => "https" },
                           { "name" => "X_Forwarded_Proto", "value" => "http" }] }].each do |change|
        data = workload
        data["spec"]["containers"].first[name]["httpGet"].merge!(change)
        assert_raises(RuntimeError) { ControlPlaneRailsProbes.verify!(data) }
      end
    end
    [nil, {}, workload.merge("name" => "renderer"), workload.merge("spec" => {})].each do |data|
      assert_raises(RuntimeError) { ControlPlaneRailsProbes.verify!(data) }
    end
    data = workload
    data["spec"]["containers"] *= 2
    assert_raises(RuntimeError) { ControlPlaneRailsProbes.verify!(data) }
  end

  def test_cli_reads_only_the_requested_benchmark_rails_workload_and_never_prints_raw_api_data
    Dir.mktmpdir do |directory|
      binary = "#{directory}/cpln"
      File.write(binary, <<~RUBY)
        #!#{RbConfig.ruby}
        require "json"
        File.write(ENV.fetch("PROBE_COMMAND_RECORD"), JSON.generate(ARGV))
        puts File.read(ENV.fetch("PROBE_RESPONSE"))
      RUBY
      FileUtils.chmod(0o755, binary)
      response = "#{directory}/response.json"
      record = "#{directory}/command.json"
      env = { "PATH" => "#{directory}:#{ENV.fetch('PATH')}", "PROBE_RESPONSE" => response,
              "PROBE_COMMAND_RECORD" => record, "BASH_ENV" => nil, "ENV" => nil }
      %w[gumroad-inertia gumroad-rorp].each do |app|
        File.write(response, JSON.generate(workload))
        output, status = Open3.capture2e(env, RbConfig.ruby, SCRIPT, "--app", app, "--org", ControlPlaneRailsProbes::ORG)
        assert status.success?, output
        assert_equal ["workload", "get", "rails", "--org", ControlPlaneRailsProbes::ORG,
                      "--gvc", app, "--output", "json"], JSON.parse(File.read(record))
      end
      File.write(response, "invalid private-value-do-not-print")
      output, status = Open3.capture2e(env, RbConfig.ruby, SCRIPT, "--app", "gumroad-inertia", "--org", ControlPlaneRailsProbes::ORG)
      refute status.success?
      assert_includes output, "did not return valid JSON"
      refute_includes output, "private-value-do-not-print"
      File.delete(record)
      output, status = Open3.capture2e(env, RbConfig.ruby, SCRIPT, "--app", "gumroad-inertia", "--org", "another-org")
      refute status.success?, output
      refute File.exist?(record)
    end
  end
end
