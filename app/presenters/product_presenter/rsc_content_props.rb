# frozen_string_literal: true

class ProductPresenter::RscContentProps
  CONTENT_KEYS = %i[
    name seller collaborating_user ratings summary attributes seller_reputation
    is_compliance_blocked is_published native_type quantity_remaining
  ].freeze

  def initialize(product_props:)
    @product_props = product_props
  end

  def props
    product_props.slice(*CONTENT_KEYS).merge(show_price: show_price?)
  end

  private
    attr_reader :product_props

    def show_price?
      base_price_cents = if product_props[:bundle_products].present?
        product_props[:bundle_products].sum { _1[:price] }
      else
        product_props[:price_cents]
      end

      product_props[:recurrences].nil? &&
        product_props[:options].empty? &&
        !product_props.dig(:rental, :rent_only) &&
        (base_price_cents != 0 || product_props[:pwyw].present?)
    end
end
