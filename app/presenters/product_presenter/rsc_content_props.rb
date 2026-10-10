# frozen_string_literal: true

class ProductPresenter::RscContentProps
  CONTENT_KEYS = %i[
    name seller collaborating_user ratings summary attributes description_html seller_reputation
    duration_in_months free_trial is_compliance_blocked is_published native_type quantity_remaining streamable
  ].freeze

  def initialize(product_props:)
    @product_props = product_props
  end

  def props
    product_props.slice(*CONTENT_KEYS).merge(show_price: show_price?, description_html: description_html)
  end

  private
    attr_reader :product_props

    def description_html
      html = product_props[:description_html]
      return html if html.blank?

      fragment = Nokogiri::HTML.fragment(html)
      # Interactive descriptions still use TipTap, which owns their image and link behavior.
      return html if fragment.at_css("pre, public-file-embed, review-card, upsell-card, a:not([href])")

      # Plain descriptions need no client enhancement once their links match TipTap's behavior.
      fragment.css("a[href]").each do |link|
        link["target"] = "_blank"
        link["rel"] = (link["rel"].to_s.split + %w[noopener noreferrer nofollow]).uniq(&:downcase).join(" ")
      end
      if product_props[:covers].present?
        # A short cover can leave the first description image in the initial viewport.
        fragment.css("img").drop(1).each { |image| image["loading"] ||= "lazy" }
      end
      fragment.to_html
    end

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
