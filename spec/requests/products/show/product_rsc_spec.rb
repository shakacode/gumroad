# frozen_string_literal: true

require "spec_helper"

describe "Product RSC shared globals", type: :request do
  it "projects flash and detected buyer currency without exposing the CSP nonce" do
    seller = create(:user)
    product = create(:product, user: seller)
    shared_data = {
      authenticity_token: "request-token",
      csp_nonce: "private-nonce",
      detected_buyer_currency: "eur",
      flash: { notice: "Saved" },
    }
    rendered_props = nil
    allow_any_instance_of(ProductRscLinksController).to receive(:inertia_shared_data).and_return(shared_data)
    allow_any_instance_of(ProductRscLinksController).to receive(:stream_view_containing_react_components) do |controller, **|
      rendered_props = controller.instance_variable_get(:@product_rsc_document_props)
      controller.response_body = "server-rendered product"
    end

    get product.long_url

    expect(response).to be_successful
    expect(rendered_props.fetch(:global)).to include(
      authenticity_token: "request-token",
      detected_buyer_currency: "eur",
      flash: { notice: "Saved" },
      href: product.long_url
    )
    expect(rendered_props.fetch(:global)).not_to include(:csp_nonce)
  end
end

describe "Product React on Rails rendering", :product_rsc_renderer, type: :system, js: true do
  let(:seller) { create(:named_user, name: "RSC product seller") }
  let(:product) { create(:product, user: seller, name: "Product React on Rails smoke product", price_cents: 1200) }
  let(:featured_product) { create(:product, user: seller, name: "Server-rendered featured product") }
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

  def create_local_image_cover(*links)
    links = [product] if links.empty?
    links.each { create(:asset_preview, link: _1) }
    cover_url = "/native-product-page-fixture/residential-guide-thumbnail.webp"
    allow_any_instance_of(AssetPreview).to receive(:as_json).and_wrap_original do |method, *args|
      method.call(*args).merge("url" => cover_url, "original_url" => cover_url)
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
    expect_public_rsc_assets("ProductPage")
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
    featured_article = page.find("article", text: featured_product.name)
    featured_checkout_url = URI.parse(featured_article.find_link("I want this!")[:href])
    expect(Rack::Utils.parse_query(featured_checkout_url.query)).to include(
      "product" => featured_product.unique_permalink,
      "quantity" => "1"
    )
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
          text: scripts.map((script) => script.textContent).join(''),
        };
      })()
    JS
    expect(payload_scripts.fetch("bytes")).to be > 10_000
    expect(payload_scripts.fetch("allNonced")).to be(true)
    expect(payload_scripts.fetch("text")).to include("PublicPages/ProductPageShell.client")
    expect(payload_scripts.fetch("text")).to include("PublicPages/ProductPageInertia.client")
    expect(payload_scripts.fetch("text")).not_to include("PublicPages/PageShell.client")
    expect(payload_scripts.fetch("text")).not_to include("ProfileFeaturedProduct.client")
    expect(payload_scripts.fetch("text")).not_to include("Profile/Layout")
    expect(payload_scripts.fetch("text")).not_to include("ProductInteractions.client")
    expect(payload_scripts.fetch("text")).to include("ProductStickyCta.client")
    expect(payload_scripts.fetch("text")).not_to include("Product/Interactive")
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

  it "keeps the standard footer for unrecognized layout values without client JavaScript" do
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: true)

    page.visit "#{product.long_url}?layout=unknown"

    expect(page).to have_text("Powered by")
  ensure
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: false)
  end

  it "server-renders the profile layout without client JavaScript" do
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: true)

    page.visit product.long_url(layout: Product::Layout::PROFILE)

    expect(page).to have_link(seller.name)
    expect(page).to have_button("Subscribe")
    expect(page).to have_link("Add to cart")
    expect(page).to have_no_field("Search products")
    payload = Nokogiri::HTML(page.html).css('script[data-react-on-rails-rsc-payload="true"]').map(&:text).join
    expect(payload).to include("PublicPages/ProductPageShell.client")
    expect(payload).not_to include("PublicPages/PageShell.client")
    expect(payload).not_to include("PoweredByFooter")
    expect(payload).to include("Product/ProductFooterCurrencySelector.client")
    expect(payload).to include("Profile/ProfileHeaderActions.client")
    expect(payload).to include("Profile/FollowForm")
  ensure
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: false)
  end

  it "hydrates the profile header without duplicating its server shell" do
    page.visit product.long_url(layout: Product::Layout::PROFILE)

    expect(page).to have_selector("header a", text: seller.name, count: 1)
    expect(page).to have_button("Subscribe", count: 1)
  end

  it "server-renders a featured product without client JavaScript" do
    create_local_image_cover(featured_product, product)
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: true)

    page.visit product.long_url

    expect(page).to have_section("Server-rendered featured product", section_element: :article)
    articles = page.all("article")
    expect(articles.first).to have_text(featured_product.name)
    expect(articles.last).to have_text(product.name)
    expect(articles.first.find("img", visible: :all)["loading"]).to eq("eager")
    expect(articles.first.find("img", visible: :all)["fetchpriority"]).to eq("high")
    expect(articles.last.find("img", visible: :all)["loading"]).to eq("lazy")
    expect(articles.last.find("img", visible: :all)["fetchpriority"]).to eq("low")
  ensure
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: false)
  end

  it "server-renders a refund policy without fine print" do
    refund_policy = create(:product_refund_policy, product:, seller:, fine_print: "")
    seller.update!(refund_policy_enabled: false)
    product.update!(product_refund_policy_enabled: true)
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: true)

    page.visit product.long_url

    expect(page).to have_text(refund_policy.title)
  ensure
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: false)
  end

  it "loads refund policy fine print on demand" do
    refund_policy = create(
      :product_refund_policy,
      product:,
      seller:,
      fine_print: "Refund requests are reviewed within two business days."
    )
    seller.update!(refund_policy_enabled: false)
    product.update!(product_refund_policy_enabled: true)

    page.visit product.long_url
    page.click_on(refund_policy.title)

    within_modal refund_policy.title do
      expect(page).to have_text("Refund requests are reviewed within two business days.")
    end
  end

  it "hydrates the server-rendered first image cover without duplication" do
    create_local_image_cover
    product.update!(sections: [], main_section_index: 0)

    page.visit product.long_url

    expect(page).to have_selector("[aria-label='Product preview'] img", count: 1)
    payload = page.evaluate_script(<<~JS)
      [...document.querySelectorAll('script[data-react-on-rails-rsc-payload="true"]')]
        .map((script) => script.textContent)
        .join('')
    JS
    expect(payload).not_to include("ProductMedia.client")
  end

  it "server-renders the first image cover without client JavaScript" do
    create_local_image_cover

    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: true)

    page.visit product.long_url

    expect(page).to have_selector("[aria-label='Product preview'] img", count: 1)
  ensure
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: false)
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

  it "server-renders profile posts without client JavaScript" do
    post = create(
      :audience_installment,
      seller:,
      name: "Server-visible product update",
      published_at: Time.utc(2026, 1, 2),
      shown_on_profile: true
    )
    posts_section = create(
      :seller_profile_posts_section,
      seller:,
      product:,
      header: "Product updates",
      shown_posts: [post.id]
    )
    product.update!(sections: [posts_section.id], main_section_index: 1)
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: true)

    page.visit product.long_url

    expect(page).to have_section("Product updates", section_element: :section)
    expect(page).to have_link("Server-visible product update", href: "/p/#{post.slug}")
    expect(page).to have_text("January 2, 2026")
  ensure
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: false)
  end

  it "server-renders profile product cards without client JavaScript", :elasticsearch_wait_for_refresh do
    related_product = create(:product, user: seller, name: "Server-visible related product")
    products_section = create(
      :seller_profile_products_section,
      seller:,
      product:,
      header: "More products",
      shown_products: [related_product.id],
      add_new_products: false
    )
    product.update!(sections: [products_section.id], main_section_index: 1)
    Link.import(force: true, refresh: true)
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: true)

    page.visit product.long_url

    expect(page).to have_section("More products", section_element: :section)
    expect(page).to have_selector(
      "a[href*='/l/#{related_product.unique_permalink}']",
      text: "Server-visible related product"
    )

    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: false)
    page.visit product.long_url
    expect(page).to have_selector("article", text: "Server-visible related product", count: 1)
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

  it "server-renders the receipt shell without client JavaScript" do
    buyer = create(:user)
    create(:purchase, link: product, purchaser: buyer, email: buyer.email)
    login_as buyer
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: true)

    page.visit product.long_url

    expect(page).to have_text("You've purchased this product")
  ensure
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: false)
  end
end
