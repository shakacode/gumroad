# frozen_string_literal: true

require "test_helper"

class NativePublicRscRequestConstraintTest < ActiveSupport::TestCase
  setup do
    @original_native_public_rsc = ENV["SHAKAPERF_NATIVE_PUBLIC_RSC"]
    @original_native_product_rsc = ENV["SHAKAPERF_NATIVE_PRODUCT_RSC"]
    ENV.delete("SHAKAPERF_NATIVE_PUBLIC_RSC")
    ENV.delete("SHAKAPERF_NATIVE_PRODUCT_RSC")
  end

  teardown do
    ENV["SHAKAPERF_NATIVE_PUBLIC_RSC"] = @original_native_public_rsc
    ENV["SHAKAPERF_NATIVE_PRODUCT_RSC"] = @original_native_product_rsc
  end

  test "matches the explicit RSC query opt-in" do
    assert NativePublicRscRequestConstraint.matches?(request_for("/?rsc=1"))
  end

  test "matches an unflagged request in the public RSC ShakaPerf experiment" do
    ENV["SHAKAPERF_NATIVE_PUBLIC_RSC"] = "1"

    assert NativePublicRscRequestConstraint.matches?(request_for("/"))
  end

  test "keeps the product-specific ShakaPerf switch compatible" do
    ENV["SHAKAPERF_NATIVE_PRODUCT_RSC"] = "1"

    assert NativePublicRscRequestConstraint.matches?(request_for("/"))
  end

  test "keeps ordinary unflagged requests on Inertia" do
    assert_not NativePublicRscRequestConstraint.matches?(request_for("/"))
  end

  test "rejects Inertia, partial, and non-HTML requests" do
    ENV["SHAKAPERF_NATIVE_PUBLIC_RSC"] = "1"

    assert_not NativePublicRscRequestConstraint.matches?(request_for("/", "HTTP_X_INERTIA" => "true"))
    assert_not NativePublicRscRequestConstraint.matches?(request_for("/", "HTTP_X_INERTIA_PARTIAL_DATA" => "search_results"))
    assert_not NativePublicRscRequestConstraint.matches?(request_for("/.json"))
  end

  private
    def request_for(path, headers = {})
      ActionDispatch::Request.new(Rack::MockRequest.env_for(path, headers))
    end
end
