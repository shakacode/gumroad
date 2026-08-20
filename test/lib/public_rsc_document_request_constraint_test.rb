# frozen_string_literal: true

require "test_helper"

class PublicRscDocumentRequestConstraintTest < ActiveSupport::TestCase
  test "matches an unflagged full HTML document request" do
    assert PublicRscDocumentRequestConstraint.matches?(request_for("/"))
  end

  test "matches a full Inertia visit so the RSC controller can upgrade it" do
    assert PublicRscDocumentRequestConstraint.matches?(request_for("/", "HTTP_X_INERTIA" => "true"))
  end

  test "rejects partial and non-HTML requests" do
    assert_not PublicRscDocumentRequestConstraint.matches?(request_for("/", "HTTP_X_INERTIA_PARTIAL_DATA" => "search_results"))
    assert_not PublicRscDocumentRequestConstraint.matches?(request_for("/.json"))
  end

  private
    def request_for(path, headers = {})
      ActionDispatch::Request.new(Rack::MockRequest.env_for(path, headers))
    end
end
