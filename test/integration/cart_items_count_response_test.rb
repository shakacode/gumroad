# frozen_string_literal: true

require "test_helper"

class CartItemsCountResponseTest < ActionDispatch::IntegrationTest
  test "cart count script is permitted by the response CSP and can be framed privately" do
    host! DOMAIN
    https!
    get "/cart_items_count"

    assert_response :success
    assert_equal "text/html", response.media_type
    document = Nokogiri::HTML.parse(response.body)
    assert_empty document.css("script[src], link, style, [data-page]")
    assert_equal 1, document.css("script").length
    nonce = document.at_css("script")["nonce"]
    assert nonce.present?

    # SecureHeaders adds the policy in Rack middleware, outside controller tests.
    policy = response.headers.fetch("Content-Security-Policy")
    script_policy = policy.split(";").find { |directive| directive.strip.start_with?("script-src ") }
    assert script_policy.present?
    assert_includes script_policy.split, "'nonce-#{nonce}'"
    assert_nil response.headers["X-Frame-Options"]
    assert_no_match(/(?:\A|;)\s*frame-ancestors\b/, policy)
    assert_includes response.headers.fetch("Cache-Control"), "private"
    assert_includes response.headers.fetch("Cache-Control"), "no-store"
  end
end
