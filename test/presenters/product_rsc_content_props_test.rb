# frozen_string_literal: true

require "test_helper"

class ProductRscContentPropsTest < ActiveSupport::TestCase
  test "projects only server-rendered product content" do
    props = projected_props

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
    assert props[:show_price]
    assert_not props.key?(:description_html)
  end

  test "hides the static price cell when configuration controls the price" do
    props = projected_props(options: [{ id: "option" }])

    assert_not props[:show_price]
  end

  test "uses the standalone bundle total for static price visibility" do
    props = projected_props(price_cents: 0, bundle_products: [{ price: 1_000 }])

    assert props[:show_price]
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
        seller_reputation: { average: 4.8, count: 24, products_count: 3 },
        free_trial: { duration: { amount: 1, unit: "week" } },
        duration_in_months: 6,
        is_compliance_blocked: false,
        is_published: true,
        native_type: "digital",
        quantity_remaining: nil,
        price_cents: 1_000,
        bundle_products: [],
        recurrences: nil,
        options: [],
        rental: nil,
        pwyw: nil,
        description_html: "Not part of the server content",
        **overrides,
      }

      ProductPresenter::RscContentProps.new(product_props:).props
    end
end
