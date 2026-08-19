# frozen_string_literal: true

require "test_helper"

class NativeProductRscRequestConstraintTest < ActiveSupport::TestCase
  setup do
    @original_shakaperf_native_public_rsc = ENV["SHAKAPERF_NATIVE_PUBLIC_RSC"]
    @original_shakaperf_native_product_rsc = ENV["SHAKAPERF_NATIVE_PRODUCT_RSC"]
    ENV.delete("SHAKAPERF_NATIVE_PUBLIC_RSC")
    ENV.delete("SHAKAPERF_NATIVE_PRODUCT_RSC")
  end

  teardown do
    ENV["SHAKAPERF_NATIVE_PUBLIC_RSC"] = @original_shakaperf_native_public_rsc
    ENV["SHAKAPERF_NATIVE_PRODUCT_RSC"] = @original_shakaperf_native_product_rsc
  end

  test "matches the explicit RSC query opt-in" do
    assert NativeProductRscRequestConstraint.matches?(request_for("/?layout=discover&rsc=1"))
  end

  test "matches an unflagged Discover request in the ShakaPerf experiment" do
    ENV["SHAKAPERF_NATIVE_PRODUCT_RSC"] = "1"

    assert NativeProductRscRequestConstraint.matches?(request_for("/?layout=discover"))
  end

  test "keeps ordinary unflagged requests on Inertia" do
    ENV.delete("SHAKAPERF_NATIVE_PRODUCT_RSC")

    assert_not NativeProductRscRequestConstraint.matches?(request_for("/?layout=discover"))
  end

  test "rejects non-Discover, Inertia, partial, and non-HTML benchmark requests" do
    ENV["SHAKAPERF_NATIVE_PRODUCT_RSC"] = "1"

    assert_not NativeProductRscRequestConstraint.matches?(request_for("/?layout=profile"))
    assert_not NativeProductRscRequestConstraint.matches?(request_for("/?layout=discover", "HTTP_X_INERTIA" => "true"))
    assert_not NativeProductRscRequestConstraint.matches?(request_for("/?layout=discover", "HTTP_X_INERTIA_PARTIAL_DATA" => "product"))
    assert_not NativeProductRscRequestConstraint.matches?(request_for("/?layout=discover.json"))
  end

  private
    def request_for(path, headers = {})
      ActionDispatch::Request.new(Rack::MockRequest.env_for(path, headers))
    end
end
