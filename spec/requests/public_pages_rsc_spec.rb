# frozen_string_literal: true

require "spec_helper"

describe "Public page React on Rails rendering", :product_rsc_renderer, :elasticsearch_wait_for_refresh, type: :system, js: true do
  around do |example|
    JSErrorReporter.enabled = true
    example.run
  ensure
    JSErrorReporter.enabled = nil
  end

  def expect_rsc_document(root_id:, component_name:)
    expect(page).to have_css("##{root_id}")
    expect(page).to have_css(
      "script.js-react-on-rails-component[data-component-name='#{component_name}'][data-dom-id='#{root_id}']",
      visible: :all
    )
    expect(page).to have_no_css("#app[data-page]", visible: :all)
    expect(page).to have_css('script[data-react-on-rails-rsc-payload="true"]', visible: :all)
    expect(page.evaluate_script(<<~JS)).to be(true)
      [...document.querySelectorAll('script[data-react-on-rails-rsc-payload="true"]')]
        .every((script) => script.nonce.length > 0)
    JS
    expect(page.evaluate_script(<<~JS)).to be(false)
      performance.getEntriesByType("resource").some(({ name }) => name.includes("/rsc_payload/"))
    JS
  end

  it "server-renders and hydrates a seller profile" do
    seller = create(:named_user, username: "rscprofilesmoke")
    product = create(:product, user: seller, name: "RSC profile smoke product")
    about = create(
      :seller_profile_rich_text_section,
      seller:,
      header: "About this RSC profile",
      text: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Profile RSC content" }] }] }
    )
    catalog = create(
      :seller_profile_products_section,
      seller:,
      header: "RSC catalog",
      shown_products: [product.id],
      add_new_products: false
    )
    create(
      :seller_profile,
      seller:,
      json_data: { tabs: [{ name: "About", sections: [about.id] }, { name: "Catalog", sections: [catalog.id] }] }
    )
    Link.import(force: true, refresh: true)

    page.visit "#{seller.subdomain_with_protocol}?rsc=1"

    expect_rsc_document(root_id: "profile-rsc-root", component_name: "ProfileRscCompatibilityPage")
    expect(page).to have_text("Profile RSC content")
    click_on "Catalog"
    expect(page).to have_selector("a[href*='/l/#{product.unique_permalink}']", text: product.name)
  end

  it "server-renders and hydrates Discover results" do
    product = create(:product, :recommendable, name: "RSC Discover smoke product")
    Link.import(force: true, refresh: true)

    page.visit discover_path(sort: "hot_and_new", rsc: "1")

    expect_rsc_document(root_id: "discover-rsc-root", component_name: "DiscoverPage")
    expect(page).to have_link(product.name)
    click_on "Trending"
    expect(page).to have_current_path(discover_path(rsc: "1"))
  end

  it "server-renders and hydrates a Discover category through the experiment gate" do
    taxonomy = create(:taxonomy, slug: "music-and-sound-design")
    product = create(:product, :recommendable, taxonomy:, name: "RSC category smoke product")
    Link.import(force: true, refresh: true)
    DiscoverTaxonomyConstraint.instance_variable_set(:@valid_taxonomy_paths, nil)
    original_public_rsc = ENV["SHAKAPERF_PUBLIC_RSC"]
    ENV["SHAKAPERF_PUBLIC_RSC"] = "1"

    page.visit "#{UrlService.discover_domain_with_protocol}/#{taxonomy.slug}"

    expect_rsc_document(root_id: "discover-rsc-root", component_name: "DiscoverPage")
    expect(page).to have_current_path("/#{taxonomy.slug}")
    expect(page).to have_link(product.name)
    expect(page.title).to include("Music & Sound Design")
    click_on "All"
    expect(page).to have_current_path(discover_path)
  ensure
    ENV["SHAKAPERF_PUBLIC_RSC"] = original_public_rsc
    DiscoverTaxonomyConstraint.instance_variable_set(:@valid_taxonomy_paths, nil)
  end
end
