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
    expect_public_rsc_assets(component_name)
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
    seller.update!(hide_follow_form: true)
    product = create(:product, user: seller, name: "RSC profile smoke product")
    about = create(
      :seller_profile_rich_text_section,
      seller:,
      header: "About this RSC profile",
      text: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Profile RSC content" }] }] }
    )
    subscribe = create(:seller_profile_subscribe_section, seller:, header: "Authored profile subscription")
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
      json_data: {
        tabs: [
          { name: "About", sections: [about.id] },
          { name: "Subscribe", sections: [subscribe.id] },
          { name: "Catalog", sections: [catalog.id] },
        ],
      }
    )
    Link.import(force: true, refresh: true)

    page.visit seller.subdomain_with_protocol

    expect_rsc_document(root_id: "profile-rsc-root", component_name: "ProfileRscCompatibilityPage")
    expect(page).to have_text("Profile RSC content")
    expect(page).to have_no_css("header form")
    click_on "Subscribe"
    expect(page).to have_text("Authored profile subscription")
    click_on "Catalog"
    expect(page).to have_selector("a[href*='/l/#{product.unique_permalink}']", text: product.name)
  end

  it "server-renders and hydrates Discover results" do
    product = create(:product, :recommendable, name: "RSC Discover smoke product")
    Link.import(force: true, refresh: true)

    page.visit discover_path(sort: "hot_and_new")

    expect_rsc_document(root_id: "discover-rsc-root", component_name: "DiscoverPage")
    expect(page).to have_css("header.hero")
    expect(page).to have_field("Search products")
    expect(page).to have_link("Gumroad")
    expect(page).to have_link(product.name)
    click_on "Trending"
    expect(page).to have_current_path(discover_path)

    offer_code = SearchProducts::BLACK_FRIDAY_CODE
    page.visit discover_path(offer_code:)
    fill_in "Search products", with: "beats"
    find_field("Search products").send_keys(:enter)
    expect(page).to have_current_path(discover_path(offer_code:, query: "beats"), ignore_query: false)
  end

  it "server-renders and hydrates an unflagged Discover category" do
    taxonomy = create(:taxonomy, slug: "music-and-sound-design")
    product = create(:product, :recommendable, taxonomy:, name: "RSC category smoke product")
    Link.import(force: true, refresh: true)
    DiscoverTaxonomyConstraint.instance_variable_set(:@valid_taxonomy_paths, nil)

    page.visit "#{UrlService.discover_domain_with_protocol}/#{taxonomy.slug}"

    expect_rsc_document(root_id: "discover-rsc-root", component_name: "DiscoverPage")
    expect(page).to have_current_path("/#{taxonomy.slug}")
    expect(page).to have_link(product.name)
    expect(page.title).to include("Music & Sound Design")
    click_on "All"
    expect(page).to have_current_path(discover_path)

    offer_code = SearchProducts::BLACK_FRIDAY_CODE
    child_taxonomy = create(:taxonomy, parent: taxonomy, slug: "sound-design")
    Rails.cache.delete("taxonomies_for_nav")
    DiscoverTaxonomyConstraint.instance_variable_set(:@valid_taxonomy_paths, nil)
    page.visit "#{UrlService.discover_domain_with_protocol}/#{taxonomy.slug}?offer_code=#{offer_code}"
    expect_rsc_document(root_id: "discover-rsc-root", component_name: "DiscoverPage")
    expect(page).to have_link(
      "Sound Design",
      href: discover_taxonomy_path("#{taxonomy.slug}/#{child_taxonomy.slug}", offer_code:),
      visible: :all
    )
    category_links = page.all("a", text: "Sound Design", visible: :all)
    expect(category_links.size).to be >= 2
    expect(category_links.map { _1[:href] }).to all(include("offer_code=#{offer_code}"))
    fill_in "Search products", with: "beats"
    find_field("Search products").send_keys(:enter)
    expect(page).to have_current_path(
      discover_taxonomy_path(taxonomy.slug, offer_code:, query: "beats"),
      ignore_query: false
    )
    click_on "Remove offer code filter"
    expect(page).to have_current_path(discover_taxonomy_path(taxonomy.slug, query: "beats"), ignore_query: false)
    expect(page).to have_link(
      "Sound Design",
      href: discover_taxonomy_path("#{taxonomy.slug}/#{child_taxonomy.slug}"),
      visible: :all
    )
  ensure
    DiscoverTaxonomyConstraint.instance_variable_set(:@valid_taxonomy_paths, nil)
  end
end

describe ProductRscRenderer do
  it "passes the configured password to the spawned renderer" do
    allow(ReactOnRailsPro.configuration).to receive(:renderer_password).and_return("custom-renderer-password")
    allow(described_class).to receive(:healthy?).and_return(false, true)
    allow(Process).to receive(:waitpid).with(123, Process::WNOHANG).and_return(nil)
    allow(Process).to receive(:kill).with("TERM", 123)
    allow(Process).to receive(:wait).with(123)
    expect(Process).to receive(:spawn) do |environment, *_arguments|
      expect(environment.fetch("RENDERER_PASSWORD")).to eq("custom-renderer-password")
      123
    end

    described_class.with_running_renderer { }
  end

  it "rejects a healthy renderer that was already using the configured port" do
    allow(described_class).to receive(:healthy?).and_return(true)
    expect(Process).not_to receive(:spawn)

    expect { described_class.with_running_renderer }.to raise_error(/already running/)
  end

  it "rejects a spawned renderer that exited before a healthy response" do
    allow(described_class).to receive(:healthy?).and_return(true)
    allow(Process).to receive(:waitpid).with(123, Process::WNOHANG).and_return(123)

    expect { described_class.wait_until_healthy(123) }.to raise_error(/exited before it became healthy/)
  end
end
