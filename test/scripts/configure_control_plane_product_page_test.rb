# frozen_string_literal: true

require "minitest/autorun"
require "open3"
require "json"

class ConfigureControlPlaneProductPageTest < Minitest::Test
  SCRIPT = File.expand_path("../../scripts/configure_control_plane_product_page.rb", __dir__)
  HARNESS = <<~'CODE'
    require "json"
    require "ostruct"
    module Rails
      def self.env = OpenStruct.new(benchmark?: ENV["TEST_BENCHMARK"] == "true")
    end
    module Link
      def self.find_by!(unique_permalink:)
        raise "Missing fixture" if ENV["TEST_MISSING_PRODUCT"] == "true"
        OpenStruct.new(unique_permalink:, user: Object.new)
      end
    end
    module Feature
      def self.deactivate(*)
        @enabled = false
        @actor_enabled = false
        puts "cleared existing gates"
      end
      def self.activate(*) = @enabled = true
      def self.active?(*)
        return false if ENV["TEST_VERIFY_FAILURE"] == "true"
        @enabled || @actor_enabled
      end
      @enabled = true
      @actor_enabled = true
    end
    load ARGV.fetch(0)
  CODE

  def run_script(overrides = {})
    env = {
      "TEST_BENCHMARK" => "true", "CONTROL_PLANE_BENCHMARK" => "true",
      "CPLN_GVC" => "gumroad-rorp", "GUMROAD_RENDERING_SURFACE" => "rorp",
      "TEST_MISSING_PRODUCT" => "false", "TEST_VERIFY_FAILURE" => "false",
    }.merge(overrides)
    Open3.capture3(env, RbConfig.ruby, "-e", HARNESS, SCRIPT)
  end

  def test_enables_rorp
    out, err, status = run_script
    assert status.success?, err
    assert_equal true, JSON.parse(out.lines.last).fetch("product_page_react_on_rails")
  end

  def test_inertia_clears_existing_global_and_actor_gates
    out, err, status = run_script("CPLN_GVC" => "gumroad-inertia", "GUMROAD_RENDERING_SURFACE" => "inertia")
    assert status.success?, err
    assert_includes out, "cleared existing gates"
    assert_equal false, JSON.parse(out.lines.last).fetch("product_page_react_on_rails")
  end

  def test_rejects_non_benchmark_environment_before_changing_flags
    out, _err, status = run_script("TEST_BENCHMARK" => "false")
    assert_equal false, status.success?
    assert_empty out
  end

  def test_rejects_mismatched_app_before_changing_flags
    out, _err, status = run_script("CPLN_GVC" => "gumroad-inertia")
    assert_equal false, status.success?
    assert_empty out
  end

  def test_rejects_missing_benchmark_guard_before_changing_flags
    out, _err, status = run_script("CONTROL_PLANE_BENCHMARK" => "false")
    assert_equal false, status.success?
    assert_empty out
  end

  def test_requires_fixture_before_changing_flags
    out, _err, status = run_script("TEST_MISSING_PRODUCT" => "true")
    assert_equal false, status.success?
    assert_empty out
  end

  def test_fails_release_when_flag_verification_fails
    _out, err, status = run_script("TEST_VERIFY_FAILURE" => "true")
    assert_equal false, status.success?
    assert_includes err, "Product-page flag mismatch"
  end
end
