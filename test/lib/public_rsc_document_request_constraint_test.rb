# frozen_string_literal: true

require "test_helper"

class PublicRscDocumentRequestConstraintTest < ActiveSupport::TestCase
  test "matches full HTML document requests including Inertia visits" do
    assert_matches "/discover"
    assert_matches "/discover", "HTTP_X_INERTIA" => "true"
  end

  test "rejects partial and non-HTML requests" do
    assert_not_matches "/discover", "HTTP_X_INERTIA_PARTIAL_DATA" => "products"
    assert_not_matches "/discover.json"
  end

  test "mounts the hostless RSC payload route before public document routes" do
    routes = Rails.application.routes.routes.to_a
    payload_index = routes.index { |route| route.path.spec.to_s.start_with?("/rsc_payload/") }
    public_document_index = routes.index { |route| route.name == "short_link" }
    payload_route = routes.fetch(payload_index)

    assert_operator payload_index, :<, public_document_index
    assert_equal "rsc_payload", payload_route.requirements.fetch(:controller)
    assert_not payload_route.requirements.key?(:host)
  end

  private
    def assert_matches(path, headers = {})
      assert PublicRscDocumentRequestConstraint.matches?(build_request(path, headers))
    end

    def assert_not_matches(path, headers = {})
      assert_not PublicRscDocumentRequestConstraint.matches?(build_request(path, headers))
    end

    def build_request(path, headers = {})
      ActionDispatch::Request.new(Rack::MockRequest.env_for(path, headers))
    end
end
