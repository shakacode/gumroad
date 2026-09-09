# frozen_string_literal: true

require "test_helper"

class ProductRscContentPropsTest < ActiveSupport::TestCase
  test "projects only server-rendered product content" do
    props = projected_props(
      analytics: { enabled: true },
      can_edit: true,
      public_files: [{ id: "file" }],
      sentinel: "not public"
    )

    assert_equal(
      %i[
        name seller collaborating_user ratings summary attributes description_html seller_reputation
        duration_in_months free_trial is_compliance_blocked is_published native_type quantity_remaining streamable
        show_price
      ].to_set,
      props.keys.to_set
    )
    assert_equal "A guide", props[:name]
    assert_equal({ name: "Seller" }, props[:seller])
    assert_equal [{ name: "Format", value: "PDF" }], props[:attributes]
    assert_equal({ average: 4.8, count: 24, products_count: 3 }, props[:seller_reputation])
    assert_equal({ duration: { amount: 1, unit: "week" } }, props[:free_trial])
    assert_equal 6, props[:duration_in_months]
    assert_equal false, props[:is_compliance_blocked]
    assert props[:is_published]
    assert_equal "digital", props[:native_type]
    assert_nil props[:quantity_remaining]
    assert props[:streamable]
    assert props[:show_price]
    assert_equal "Server description", props[:description_html]
  end

  test "hides the static price when configuration controls it" do
    assert_not projected_props(options: [{ id: "option" }])[:show_price]
    assert_not projected_props(recurrences: { monthly: { price_cents: 1_000 } })[:show_price]
    assert_not projected_props(rental: { rent_only: true })[:show_price]
  end

  test "keeps pay-what-you-want and bundle price decisions in Rails" do
    assert projected_props(rental: { rent_only: false })[:show_price]
    assert_not projected_props(price_cents: 0)[:show_price]
    assert projected_props(price_cents: 0, pwyw: { suggested_price_cents: nil })[:show_price]
    assert projected_props(price_cents: 0, bundle_products: [{ price: 1_000 }])[:show_price]
    assert_not projected_props(price_cents: 1_000, bundle_products: [{ price: 0 }])[:show_price]
  end

  private
    def projected_props(**overrides)
      product_props = {
        name: "A guide",
        seller: { name: "Seller" },
        collaborating_user: nil,
        ratings: { average: 5, count: 1 },
        summary: "Summary",
        attributes: [{ name: "Format", value: "PDF" }],
        description_html: "Server description",
        seller_reputation: { average: 4.8, count: 24, products_count: 3 },
        duration_in_months: 6,
        free_trial: { duration: { amount: 1, unit: "week" } },
        is_compliance_blocked: false,
        is_published: true,
        native_type: "digital",
        quantity_remaining: nil,
        streamable: true,
        price_cents: 1_000,
        bundle_products: [],
        recurrences: nil,
        options: [],
        rental: nil,
        pwyw: nil,
        **overrides,
      }

      ProductPresenter::RscContentProps.new(product_props:).props
    end
end
