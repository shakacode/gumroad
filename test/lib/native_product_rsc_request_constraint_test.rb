# frozen_string_literal: true

require "test_helper"

class NativeProductRscRequestConstraintTest < ActiveSupport::TestCase
  test "matches every full HTML product page request" do
    assert NativeProductRscRequestConstraint.matches?(request_for("/"))
    assert NativeProductRscRequestConstraint.matches?(request_for("/?layout=discover"))
    assert NativeProductRscRequestConstraint.matches?(request_for("/?layout=profile"))
    assert NativeProductRscRequestConstraint.matches?(request_for("/?layout=discover&rsc=1"))
    assert NativeProductRscRequestConstraint.matches?(request_for("/", "HTTP_X_INERTIA" => "true"))
  end

  test "rejects partial, embedded, and non-HTML requests" do
    assert_not NativeProductRscRequestConstraint.matches?(request_for("/?layout=discover", "HTTP_X_INERTIA_PARTIAL_DATA" => "product"))
    assert_not NativeProductRscRequestConstraint.matches?(request_for("/?embed=true"))
    assert_not NativeProductRscRequestConstraint.matches?(request_for("/?overlay=true"))
    assert_not NativeProductRscRequestConstraint.matches?(request_for("/.json?layout=discover"))
  end

  private
    def request_for(path, headers = {})
      ActionDispatch::Request.new(Rack::MockRequest.env_for(path, headers))
    end
end
