# frozen_string_literal: true

require "spec_helper"

describe "Product React on Rails rendering", :product_rsc_renderer, type: :system, js: true do
  let(:seller) { create(:named_user, name: "RSC product seller") }
  let(:product) { create(:product, user: seller, name: "Product React on Rails smoke product", price_cents: 1200) }
  let(:large_taxonomy_navigation) do
    Array.new(250) do |index|
      {
        key: index.to_s,
        slug: "taxonomy-#{index}",
        label: "Taxonomy #{index} with a realistically descriptive navigation label",
        parent_key: index < 10 ? nil : "0",
      }
    end
  end

  around do |example|
    JSErrorReporter.enabled = true
    example.run
  ensure
    JSErrorReporter.enabled = nil
  end

  before do
    allow_any_instance_of(LinksController).to receive(:taxonomies_for_nav).and_return(large_taxonomy_navigation)
    featured_product = create(:product, user: seller, name: "Server-rendered featured product")
    featured_section = create(
      :seller_profile_featured_product_section,
      seller:,
      product:,
      featured_product_id: featured_product.id,
      header: "Featured"
    )
    product.update!(sections: [featured_section.id], main_section_index: 1)
    product.update!(description: "A product description enhanced on the client")
    product.save_custom_summary("A server-rendered product summary")
    product.save_custom_attributes([{ name: "Format", value: "PDF" }])
    create(:purchase, :with_review, link: product)
    product.reload
    product.user.seller_profile.update!(background_color: "#123456")
  end

  it "server-renders the Discover product without changing the ordinary page content" do
    expect(large_taxonomy_navigation.to_json.bytesize).to be > 10_000

    rsc_url = product.long_url(layout: Product::Layout::DISCOVER)

    page.visit rsc_url
    expect(page).to have_css("#product-rsc-root")
    expect(page).to have_css("header.hero")
    expect(page).to have_field("Search products")
    expect(page).to have_link("Gumroad")
    expect(page).to have_text("More Categories")
    expect(page.evaluate_script("document.documentElement.scrollWidth <= window.innerWidth")).to be(true)
    expect(page).to have_text(product.name)
    expect(page).to have_text("A product description enhanced on the client")
    expect(page).to have_link("RSC product seller")
    expect(page).to have_text("1 rating")
    expect(page).to have_text("A server-rendered product summary")
    expect(page).to have_text("Format")
    expect(page).to have_text("PDF")
    expect(page).to have_section("Server-rendered featured product", section_element: :article)
    expect(page).to have_text("$12")
    expect(page).to have_link("Add to cart")
    expect(page).to have_css(
      "script.js-react-on-rails-component[data-component-name='ProductPage']" \
      "[data-dom-id='product-rsc-root']",
      visible: :all
    )
    payload_scripts = page.evaluate_script(<<~JS)
      (() => {
        const scripts = [...document.querySelectorAll('script[data-react-on-rails-rsc-payload="true"]')];
        return {
          bytes: scripts.reduce((sum, script) => sum + new TextEncoder().encode(script.textContent).length, 0),
          allNonced: scripts.every((script) => script.nonce.length > 0),
        };
      })()
    JS
    expect(payload_scripts.fetch("bytes")).to be > 10_000
    expect(payload_scripts.fetch("allNonced")).to be(true)
    expect(page.evaluate_script(<<~JS)).to be(true)
      [...document.head.querySelectorAll("style")].some((style) => style.textContent.includes("--body-bg: #123456"))
    JS
    expect(page.evaluate_script(<<~JS)).to be(false)
      performance.getEntriesByType("resource").some(({ name }) => name.includes("/rsc_payload/"))
    JS
  end

  it "server-renders the standard product without an opt-in" do
    page.visit product.long_url

    expect(page).to have_css("#product-rsc-root")
    expect(page).to have_text(product.name)
    expect(page).to have_text("$12")
    expect(page).to have_link("I want this!")
    expect(page).to have_no_field("Search products")
    expect(page).to have_no_selector("[role=menubar]")
  end

  it "server-renders profile rich text without client JavaScript" do
    rich_text_section = create(
      :seller_profile_rich_text_section,
      seller:,
      product:,
      header: "About the creator",
      text: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Server-visible creator story" }] }],
      }
    )
    product.update!(sections: [rich_text_section.id], main_section_index: 1)
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: true)

    page.visit product.long_url

    expect(page).to have_text("Server-visible creator story")
  ensure
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: false)
  end

  it "server-renders bundle item text without client JavaScript" do
    bundle = create(:product, :bundle, user: seller, name: "Server-rendered bundle")
    bundled_product = create(:product, user: seller, name: "Server-visible bundled guide")
    create(:bundle_product, bundle:, product: bundled_product, quantity: 2)
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: true)

    page.visit bundle.long_url

    expect(page).to have_link("Server-visible bundled guide")
    expect(page).to have_css(".sr-only", text: "Qty: 2", visible: :all)
  ensure
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: false)
  end
end
