# frozen_string_literal: true

require "spec_helper"

describe "Product renderer coexistence", :product_rsc_renderer, type: :system, js: true do
  [false, true].each do |rsc_enabled|
    it "preserves variants, rich content and cart navigation with RSC #{rsc_enabled ? 'enabled' : 'disabled'}" do
      seller = create(:user)
      product = create(:product, user: seller, name: "Coexistence field guide", price_cents: 1200,
                                 description: "<h2>Make something useful</h2><p>A guide with <strong>worked examples</strong>.</p>")
      category = create(:variant_category, link: product)
      create(:variant, variant_category: category, name: "Standard", price_difference_cents: 0)
      create(:variant, variant_category: category, name: "Complete", price_difference_cents: 800)
      section = create(:seller_profile_rich_text_section, seller:, product:, header: "Included",
                                                          text: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Practical examples" }] }] })
      product.update!(sections: [section.id], main_section_index: 0)
      Feature.activate_user(:product_page_react_on_rails, seller) if rsc_enabled

      visit product.long_url(layout: "profile")
      expect(page).to have_css(rsc_enabled ? "#product-rsc-root" : "#app[data-page]", visible: :all)
      expect(page).to have_text("Make something useful")
      expect(page).to have_text("Practical examples")
      expect(page).to have_radio_button("Standard", checked: false)
      expect(page).to have_radio_button("Complete", checked: false)
      expect(page).to have_link("Choose an option")
      expect(page).to have_no_css("header a[href*='/checkout']")

      choose "Complete"
      within find(:article) do
        expect(page).to have_link("Add to cart")
        expect(page).to have_text("$20")
      end
      add_to_cart(product, cart: true, option: "Complete")
      expect(page).to have_current_path(%r{/checkout}, ignore_query: true)
      expect(page).to have_field("Email address")
      within_cart_item(product.name) { expect(page).to have_text("Complete") }

      visit product.long_url(layout: "profile")
      expect(page).to have_css("header a[href*='/checkout']", text: "1")
      Feature.deactivate_user(:product_page_react_on_rails, seller)
      page.refresh
      expect(page).to have_css("#app[data-page]", visible: :all)
      expect(page).to have_no_css("script[src*='/public-rsc/']", visible: :all)
      expect(page).to have_css("header a[href*='/checkout']", text: "1")
    end
  end
end
