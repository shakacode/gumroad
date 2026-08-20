# frozen_string_literal: true

require "test_helper"

class ProductRscContentPropsTest < ActiveSupport::TestCase
  test "projects only server-rendered product content" do
    props = projected_props

    assert_equal "A guide", props[:name]
    assert_equal({ name: "Seller" }, props[:seller])
    assert_equal [{ name: "Format", value: "PDF" }], props[:attributes]
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
