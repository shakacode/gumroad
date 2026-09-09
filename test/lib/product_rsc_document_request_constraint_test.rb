# frozen_string_literal: true

require "test_helper"

class ProductRscDocumentRequestConstraintTest < ActiveSupport::TestCase
  test "matches full HTML product document requests" do
    assert_matches "/l/product"
    assert_matches "/l/product?layout=discover"
    assert_matches "/l/product?layout=profile"
    assert_matches "/l/product", "HTTP_X_INERTIA" => "true"
  end

  test "matches root only on product custom domains" do
    request = build_request("/")
    ProductCustomDomainConstraint.stubs(:matches?).with(request).returns(true)

    assert ProductRscDocumentRequestConstraint.matches?(request)

    ProductCustomDomainConstraint.stubs(:matches?).with(request).returns(false)
    assert_not ProductRscDocumentRequestConstraint.matches?(request)
  end

  test "rejects partial, embedded, overlaid, and non-HTML requests" do
    assert_not_matches "/l/product", "HTTP_X_INERTIA_PARTIAL_DATA" => "product"
    assert_not_matches "/l/product?embed=1"
    assert_not_matches "/l/product?overlay=1"
    assert_not_matches "/l/product.json"
  end

  private
    def assert_matches(path, headers = {})
      assert ProductRscDocumentRequestConstraint.matches?(build_request(path, headers))
    end

    def assert_not_matches(path, headers = {})
      assert_not ProductRscDocumentRequestConstraint.matches?(build_request(path, headers))
    end

    def build_request(path, headers = {})
      ActionDispatch::Request.new(Rack::MockRequest.env_for(path, headers))
    end
end
