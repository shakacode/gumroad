# frozen_string_literal: true

require "test_helper"

class ProductRscDocumentRequestConstraintTest < ActiveSupport::TestCase
  test "matches every full HTML product page request" do
    assert ProductRscDocumentRequestConstraint.matches?(request_for("/l/product"))
    assert ProductRscDocumentRequestConstraint.matches?(request_for("/l/product?layout=discover"))
    assert ProductRscDocumentRequestConstraint.matches?(request_for("/l/product?layout=profile"))
    assert ProductRscDocumentRequestConstraint.matches?(request_for("/l/product?layout=discover&rsc=1"))
    assert ProductRscDocumentRequestConstraint.matches?(request_for("/l/product", "HTTP_X_INERTIA" => "true"))
  end

  test "matches the root path only on a product custom domain" do
    ProductCustomDomainConstraint.stubs(:matches?).returns(true)
    assert ProductRscDocumentRequestConstraint.matches?(request_for("/"))

    ProductCustomDomainConstraint.stubs(:matches?).returns(false)
    assert_not ProductRscDocumentRequestConstraint.matches?(request_for("/"))
  end

  test "rejects partial, embedded, and non-HTML requests" do
    assert_not ProductRscDocumentRequestConstraint.matches?(request_for("/?layout=discover", "HTTP_X_INERTIA_PARTIAL_DATA" => "product"))
    assert_not ProductRscDocumentRequestConstraint.matches?(request_for("/?embed=true"))
    assert_not ProductRscDocumentRequestConstraint.matches?(request_for("/?overlay=true"))
    assert_not ProductRscDocumentRequestConstraint.matches?(request_for("/.json?layout=discover"))
  end

  private
    def request_for(path, headers = {})
      ActionDispatch::Request.new(Rack::MockRequest.env_for(path, headers))
    end
end
