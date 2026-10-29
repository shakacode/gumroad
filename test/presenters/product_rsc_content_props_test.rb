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

    assert_equal "A guide", props[:name]
    assert_equal "Server description", props[:description_html]
    assert_not props.key?(:analytics)
    assert_not props.key?(:can_edit)
    assert_not props.key?(:public_files)
    assert_not props.key?(:sentinel)
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
