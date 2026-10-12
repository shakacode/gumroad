# frozen_string_literal: true

require "test_helper"

class ProductRscDocumentRequestConstraintTest < ActiveSupport::TestCase
  test "recognizes default and profile product document shapes" do
    assert_matches "/l/product"
    assert_matches "/l/product?layout=profile"
    assert_matches "/l/product?layout=profile", "HTTP_X_INERTIA" => "true"
    assert_matches "/l/product", "HTTP_ACCEPT" => "text/html"
    assert_matches "/l/product?format=html", "HTTP_ACCEPT" => "*/*"

    assert_not_matches "/l/product?layout=discover"
    assert_not_matches "/l/product?layout=unknown"
  end

  test "rejects alternate product URL shapes" do
    assert_not_matches "/?layout=profile"
    assert_not_matches "/product?layout=profile"
    assert_not_matches "/l/product/offer?layout=profile"
    assert_not_matches "/discover?layout=profile"
    assert_not_matches "/seller?layout=profile"
  end

  test "rejects partial, embedded, overlaid, and non-HTML requests" do
    assert_not_matches "/l/product?layout=profile", "HTTP_X_INERTIA_PARTIAL_DATA" => "product"
    assert_not_matches "/l/product?layout=profile&embed=1"
    assert_not_matches "/l/product?layout=profile&overlay=1"
    assert_not_matches "/l/product.json?layout=profile"
    assert_not_matches "/l/product", "HTTP_ACCEPT" => "application/json"
  end

  private
    def assert_matches(path, headers = {})
      assert ProductRscDocumentRequestConstraint.profile_request?(build_request(path, headers))
    end

    def assert_not_matches(path, headers = {})
      assert_not ProductRscDocumentRequestConstraint.profile_request?(build_request(path, headers))
    end

    def build_request(path, headers = {})
      ActionDispatch::Request.new(Rack::MockRequest.env_for(path, headers))
    end
end
