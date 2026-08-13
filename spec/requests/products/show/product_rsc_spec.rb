# frozen_string_literal: true

require "spec_helper"

describe "Product RSC", :product_rsc_renderer, type: :system, js: true do
  let(:product) { create(:product, name: "Product RSC smoke product", price_cents: 1200) }
  let(:large_taxonomy_navigation) do
    Array.new(250) do |index|
      {
        key: index.to_s,
        slug: "taxonomy-#{index}",
        label: "Taxonomy #{index} with a realistically descriptive navigation label",
        parent_key: index.zero? ? nil : "0",
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
    product.user.seller_profile.update!(background_color: "#123456")
  end

  it "renders the Discover product through RSC without changing the ordinary page content" do
    expect(large_taxonomy_navigation.to_json.bytesize).to be > 10_000

    ordinary_url = short_link_path(id: product.unique_permalink, layout: "discover")
    rsc_url = short_link_path(id: product.unique_permalink, layout: "discover", rsc: "1")

    visit ordinary_url
    expect(page).to have_text(product.name)
    expect(page).to have_text("$12")
    expect(page).to have_link("Add to cart")

    visit rsc_url
    expect(page).to have_css("#native-product-rsc-root")
    expect(page).to have_text(product.name)
    expect(page).to have_text("$12")
    expect(page).to have_link("Add to cart")
    expect(page.evaluate_script("document.readyState")).to eq("complete")
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
end
