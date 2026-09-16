# frozen_string_literal: true

require "spec_helper"

describe "Product RORP shared globals", type: :request do
  it "leaves image preloads to React while retaining product metadata" do
    seller = create(:user)
    product = create(:product, user: seller)
    create(:asset_preview, link: product)
    Feature.activate_user(:product_page_react_on_rails, seller)
    rendered_props = nil
    rendered_meta = nil
    allow_any_instance_of(ProductRscLinksController).to receive(:stream_view_containing_react_components) do |controller, **|
      rendered_props = controller.instance_variable_get(:@product_rsc_document_props)
      rendered_meta = controller.send(:erb_meta_tags)
      controller.response_body = "server-rendered product"
    end

    get product.long_url(layout: Product::Layout::PROFILE)

    expect(response).to be_successful
    expect(rendered_meta).not_to include('rel="preload"')
    expect(rendered_meta).to include('rel="canonical"', 'property="og:image"')
    expect(rendered_props.fetch(:_inertia_meta).any? { |tag| tag[:rel] == "preload" && tag[:as] == "image" }).to be(false)
  end

  it "projects flash and detected buyer currency without exposing the CSP nonce" do
    seller = create(:user)
    product = create(:product, user: seller)
    Feature.activate_user(:product_page_react_on_rails, seller)
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

    get product.long_url(layout: Product::Layout::PROFILE)

    expect(response).to be_successful
    expect(rendered_props.fetch(:global)).to include(
      authenticity_token: "request-token",
      detected_buyer_currency: "eur",
      flash: { notice: "Saved" },
      href: product.long_url(layout: Product::Layout::PROFILE)
    )
    expect(rendered_props.fetch(:global)).not_to include(:csp_nonce)
  end
end

describe "Profile-layout product React on Rails rendering", :product_rsc_renderer, type: :system, js: true do
  let(:seller) { create(:named_user, name: "RORP product seller") }
  let(:product) { create(:product, user: seller, name: "React on Rails product", price_cents: 1200) }
  let(:featured_product) { create(:product, user: seller, name: "Server-rendered featured product") }

  around do |example|
    JSErrorReporter.enabled = true
    example.run
  ensure
    JSErrorReporter.enabled = nil
  end

  before do
    Feature.activate_user(:product_page_react_on_rails, seller)
    featured_section = create(
      :seller_profile_featured_product_section,
      seller:,
      product:,
      featured_product_id: featured_product.id,
      header: "Featured"
    )
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
    product.update!(
      description: "A product description enhanced on the client",
      sections: [featured_section.id, rich_text_section.id],
      main_section_index: 1
    )
    product.save_custom_summary("A server-rendered product summary")
    product.save_custom_attributes([{ name: "Format", value: "PDF" }])
    create(:purchase, :with_review, link: product)
    product.reload
    seller.seller_profile.update!(background_color: "#123456")
  end

  it "server-renders the full profile product without client JavaScript" do
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: true)

    page.visit product.long_url(layout: Product::Layout::PROFILE)

    expect(page).to have_css("#product-rsc-root")
    expect_public_rsc_assets("ProductPage")
    document = Nokogiri::HTML(page.html)
    %w[csrf-token csrf-param].each do |name|
      tags = document.css("meta[name='#{name}']")
      expect(tags.length).to eq(1)
      expect(tags.first["inertia"]).to be_nil
      expect(tags.first["data-inertia"]).to be_nil
    end
    %w[stripe:pk stripe:api_version].each do |property|
      tags = document.css("meta[property='#{property}']")
      expect(tags.length).to eq(1)
      expect(tags.first["inertia"]).to be_nil
      expect(tags.first["data-inertia"]).to be_nil
      expect(tags.first["value"]).to be_present
    end
    expect(page).to have_link(seller.name)
    expect(page).to have_button("Subscribe")
    expect(page).to have_text(product.name)
    expect(page).to have_text("A product description enhanced on the client")
    expect(page).to have_text("A server-rendered product summary")
    expect(page).to have_text("Format")
    expect(page).to have_text("PDF")
    expect(page).to have_link("Add to cart")
    expect(page).to have_section("Server-rendered featured product", section_element: :article)
    expect(page).to have_text("Server-visible creator story")
    expect(page).to have_no_field("Search products")
    payload = Nokogiri::HTML(page.html).css('script[data-react-on-rails-rsc-payload="true"]').map(&:text).join
    expect(payload).to include("PublicPages/ProductPageShell.client")
    expect(payload).not_to include("PublicPages/PageShell.client")
    expect(payload).to include("Product/ProductFooterCurrencySelector.client")
    expect(payload).to include("Profile/ProfileHeaderActions.client")
    expect(payload).to include("Profile/FollowForm")
  ensure
    page.driver.browser.execute_cdp("Emulation.setScriptExecutionDisabled", value: false)
  end

  it "hydrates without duplicating the profile or product shells" do
    page.visit product.long_url(layout: Product::Layout::PROFILE)

    expect(page.evaluate_script("getComputedStyle(document.body).fontFamily")).to include("ABC Favorit")
    expect(page).to have_selector("header a", text: seller.name, count: 1)
    expect(page).to have_button("Subscribe", count: 1)
    expect(page).to have_selector("article", text: product.name, count: 1)
    expect(page).to have_selector("article", text: featured_product.name, count: 1)
    expect(page.evaluate_script(<<~JS)).to eq(1)
      document.querySelectorAll('meta[name="csrf-token"]:not([inertia]):not([data-inertia])').length
    JS
    expect(page.evaluate_script(<<~JS)).to eq(1)
      document.querySelectorAll('meta[property="stripe:pk"]:not([inertia]):not([data-inertia])').length
    JS
    expect(page.evaluate_script(<<~JS)).to be(false)
      performance.getEntriesByType("resource").some(({ name }) => name.includes("/rsc_payload/"))
    JS
  end
end
