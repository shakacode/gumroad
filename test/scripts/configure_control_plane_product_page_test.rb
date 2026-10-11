# frozen_string_literal: true

require "minitest/autorun"
require "open3"
require "json"

class ConfigureControlPlaneProductPageTest < Minitest::Test
  SCRIPT = File.expand_path("../../scripts/configure_control_plane_product_page.rb", __dir__)
  HARNESS = <<~'CODE'
    require "json"
    require "ostruct"
    require "flipper"
    Flipper.configure { |config| config.default { Flipper.new(Flipper::Adapters::Memory.new) } }
    require_relative "lib/utilities/feature"
    Seller = Struct.new(:username, :flipper_id)
    SELLER = Seller.new(ENV.fetch("TEST_SELLER", "luisfurushio"), "User:1")
    OTHER = Seller.new("other", "User:2")
    module Rails
      def self.env = OpenStruct.new(benchmark?: ENV["TEST_BENCHMARK"] == "true")
    end
    module Link
      def self.find_by!(unique_permalink:)
        raise "Missing fixture" if ENV["TEST_MISSING_PRODUCT"] == "true"
        OpenStruct.new(unique_permalink:, user: SELLER)
      end
    end
    flag = :product_page_react_on_rails
    Feature.activate_user(:unrelated, OTHER)
    case ENV["TEST_GATE"]
    when "global" then Feature.activate(flag)
    when "other" then Feature.activate_user(flag, OTHER)
    when "percentage" then Feature.activate_percentage(flag, 50)
    when "seller" then Feature.activate_user(flag, SELLER)
    end
    begin
      load ARGV.fetch(0)
    ensure
      values = Flipper[flag].gate_values
      puts JSON.generate(global: values.boolean, actors: values.actors.to_a.sort,
        percentage: values.percentage_of_actors, seller: Feature.active?(flag, SELLER),
        other: Feature.active?(flag, OTHER), unrelated: Feature.active?(:unrelated, OTHER))
    end
  CODE

  def run_script(overrides = {})
    env = {
      "TEST_BENCHMARK" => "true", "CONTROL_PLANE_BENCHMARK" => "true",
      "CPLN_GVC" => "gumroad-rorp", "GUMROAD_RENDERING_SURFACE" => "rorp",
      "TEST_MISSING_PRODUCT" => "false", "TEST_GATE" => "", "TEST_SELLER" => "luisfurushio",
    }.merge(overrides)
    output, error, status = Open3.capture3(env, RbConfig.ruby, "-e", HARNESS, SCRIPT)
    [JSON.parse(output.lines.last), error, status]
  end

  def test_enables_only_the_expected_seller_and_preserves_unrelated_features
    state, error, status = run_script
    assert status.success?, error
    assert_equal ["User:1"], state.fetch("actors")
    assert_equal false, state.fetch("global")
    assert state.fetch("seller")
    assert_equal false, state.fetch("other")
    assert state.fetch("unrelated")
  end

  def test_inertia_removes_only_the_test_seller_gate
    state, error, status = run_script("CPLN_GVC" => "gumroad-inertia", "GUMROAD_RENDERING_SURFACE" => "inertia", "TEST_GATE" => "seller")
    assert status.success?, error
    assert_empty state.fetch("actors")
    assert_equal false, state.fetch("seller")
    assert state.fetch("unrelated")
  end

  def test_rejects_broad_or_other_seller_gates_without_clearing_them
    %w[global other percentage].each do |gate|
      state, error, status = run_script("TEST_GATE" => gate)
      assert_equal false, status.success?, gate
      assert_includes error, "Existing product-page gates"
      assert state.fetch("unrelated")
      assert state.fetch("global") if gate == "global"
      assert_equal ["User:2"], state.fetch("actors") if gate == "other"
      assert_equal 50, state.fetch("percentage") if gate == "percentage"
    end
  end

  def test_rejects_a_product_owned_by_the_wrong_seller
    state, error, status = run_script("TEST_SELLER" => "unexpected")
    assert_equal false, status.success?
    assert_includes error, "Expected seller luisfurushio"
    assert_empty state.fetch("actors")
    assert state.fetch("unrelated")
  end

  def test_rejects_invalid_environment_or_missing_fixture_before_mutation
    [{ "TEST_BENCHMARK" => "false" }, { "CPLN_GVC" => "gumroad-inertia" },
     { "CONTROL_PLANE_BENCHMARK" => "false" }, { "TEST_MISSING_PRODUCT" => "true" }].each do |overrides|
      state, _error, status = run_script(overrides)
      assert_equal false, status.success?
      assert_empty state.fetch("actors")
      assert state.fetch("unrelated")
    end
  end
end
