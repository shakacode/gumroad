# frozen_string_literal: true

require "fileutils"
require "json"
require "minitest/autorun"
require "open3"
require "rbconfig"
require "tmpdir"

class ControlPlaneReleaseTest < Minitest::Test
  RELEASE = File.expand_path("../../.controlplane/release_script.sh", __dir__)
  PREFLIGHT = ["runner", "scripts/verify_control_plane_product_page.rb"].freeze

  def test_conflicting_gates_stop_both_releases_before_any_write_command
    %w[inertia rorp].each do |surface|
      calls, status = run_release(surface, conflict: true)
      refute status.success?
      assert_equal [PREFLIGHT], calls
    end
  end

  def test_clean_preflight_precedes_writes_and_final_actor_verification
    %w[inertia rorp].each do |surface|
      calls, status = run_release(surface)
      assert status.success?
      assert_equal PREFLIGHT, calls.first
      assert_equal ["db:prepare"], calls[1]
      assert_includes calls, ["runner", "scripts/verify_control_plane_benchmark_storage.rb"]
      assert_equal ["runner", "scripts/configure_control_plane_product_page.rb"], calls.last
      assert_equal 10, calls.length
    end
  end

  private
    def run_release(surface, conflict: false)
      Dir.mktmpdir("gumroad-release-test") do |directory|
        FileUtils.mkdir_p("#{directory}/bin")
        File.write("#{directory}/bin/rails", <<~RUBY)
          #!#{RbConfig.ruby}
          require "json"
          File.open(ENV.fetch("TEST_RELEASE_CALLS"), "a") { |file| file.puts JSON.generate(ARGV) }
          exit(ENV["TEST_RELEASE_CONFLICT"] == "true" && ARGV.include?("scripts/verify_control_plane_product_page.rb") ? 1 : 0)
        RUBY
        FileUtils.chmod(0755, "#{directory}/bin/rails")
        path = "#{directory}/calls.jsonl"
        _output, _error, status = Open3.capture3(
          { "CPLN_GVC" => "gumroad-#{surface}", "GUMROAD_RENDERING_SURFACE" => surface,
            "SKIP_CONTROL_PLANE_SERVICE_WAIT" => "true", "ALLOW_BENCHMARK_SEED" => "true",
            "DATABASE_HOST" => "127.0.0.1", "TEST_RELEASE_CALLS" => path,
            "TEST_RELEASE_CONFLICT" => conflict.to_s, "BASH_ENV" => nil, "ENV" => nil },
          "sh", RELEASE, chdir: directory
        )
        [File.readlines(path).map { |line| JSON.parse(line) }, status]
      end
    end
end
