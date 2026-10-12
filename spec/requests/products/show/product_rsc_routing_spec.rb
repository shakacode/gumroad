# frozen_string_literal: true

require "spec_helper"

describe "Product document controller selection", type: :request do
  include Devise::Test::IntegrationHelpers

  let(:seller) { create(:user, product_page_storefront_enabled: true) }
  let(:product) { create(:product, user: seller) }

  around do |example|
    live = ActionController::Live
    thread_method = live.instance_method(:new_controller_thread)
    cleanup_method = live.instance_method(:clean_up_thread_locals)
    live.send(:alias_method, :new_controller_thread, :original_new_controller_thread)
    live.send(:alias_method, :clean_up_thread_locals, :original_clean_up_thread_locals)
    example.run
  ensure
    live.send(:define_method, :new_controller_thread, thread_method)
    live.send(:define_method, :clean_up_thread_locals, cleanup_method)
  end

  before do
    @observed = []
    allow(ReactOnRailsPro.configuration).to receive(:server_renderer).and_return("ExecJS")
    allow_any_instance_of(LinksController).to receive(:process_action).and_wrap_original do |original, *args|
      @observed << [original.receiver.class.name, Thread.current.object_id]
      original.call(*args)
    end
  end

  def expect_controller(url, live: false, method: :get, **options)
    @observed.clear
    public_send(method, url, **options)
    expect(@observed.size).to eq(1)
    expect(@observed.last.first).to eq(live ? "ProductRscLinksController" : "LinksController")
    if live
      expect(@observed.last.last).not_to eq(Thread.current.object_id)
    else
      expect(@observed.last.last).to eq(Thread.current.object_id)
    end
  end

  it "keeps flag-off documents on the original controller across root and seller hosts" do
    ["#{PROTOCOL}://#{DOMAIN}/l/#{product.unique_permalink}", product.long_url,
     product.long_url(layout: "profile")].each { expect_controller(_1) }
  end

  it "selects Live only for the resolved flagged seller and permits immediate rollback" do
    Feature.activate_user(:product_page_react_on_rails, seller)
    expect_controller(product.long_url(layout: "profile"), live: true)
    expect(response).to have_http_status(:service_unavailable)
    expect_controller(create(:product).long_url(layout: "profile"))
    Feature.deactivate_user(:product_page_react_on_rails, seller)
    expect_controller(product.long_url(layout: "profile"))
  end

  it "keeps standalone owner and disabled-storefront documents on the original controller" do
    Feature.activate_user(:product_page_react_on_rails, seller)
    sign_in seller
    expect_controller(product.long_url)
    expect_controller(product.long_url(layout: "profile"), live: true)
    sign_out seller
    seller.update!(product_page_storefront_enabled: false)
    expect_controller(product.long_url)
    expect_controller(product.long_url(layout: "profile"), live: true)
  end

  it "keeps Inertia handoffs, partial requests, other layouts and checkout redirects out of Live" do
    Feature.activate_user(:product_page_react_on_rails, seller)
    expect_controller(product.long_url(layout: "profile"), headers: { "X-Inertia" => "true", "X-Requested-With" => "XMLHttpRequest" })
    expect(response).to have_http_status(:conflict)
    expect(response.headers["X-Inertia-Location"]).to eq(product.long_url(layout: "profile"))
    expect_controller(product.long_url(layout: "profile"), headers: { "X-Inertia-Partial-Data" => "product", "X-Inertia" => "true" })
    expect(response).to be_successful
    %w[discover embed overlay].each do |shape|
      params = shape == "discover" ? { layout: shape } : { shape => "true" }
      expect_controller(product.long_url, params:)
    end
    expect_controller(product.long_url(layout: "profile"), params: { wanted: true })
    expect(response).to be_redirect
    expect_controller(product.long_url(layout: "profile"), method: :head)
    expect_controller(product.long_url, headers: { "Accept" => "application/json" })
    expect_controller(product.long_url(layout: "profile"), live: true, headers: { "Accept" => "" })
  end

  it "uses the same lenient permalink lookup and custom-domain precedence as the original action" do
    product.update!(custom_permalink: "routing-alias")
    domain = create(:custom_domain, :verified_with_certificate, user: seller, domain: "routing.example.com")
    urls = ["#{seller.subdomain_with_protocol}/l/#{product.unique_permalink}",
            "#{seller.subdomain_with_protocol}/l/#{product.custom_permalink}",
            "http://#{domain.domain}/l/#{product.custom_permalink}"]
    urls.each { expect_controller(_1, params: { layout: "profile" }) }
    Feature.activate_user(:product_page_react_on_rails, seller)
    urls.each { expect_controller(_1, live: true, params: { layout: "profile" }) }
    other_product = create(:product)
    expect_controller("http://#{domain.domain}/l/#{other_product.unique_permalink}", params: { layout: "profile" })
    expect(response).to have_http_status(:not_found)
  end

  it "keeps flagged custom HTML on the original controller" do
    Feature.activate_user(:product_page_react_on_rails, seller)
    Feature.activate_user(:custom_html_pages, seller)
    product.update!(custom_html: "<main>Custom document</main>")
    expect_controller(product.long_url)
    expect(response).to be_successful
    expect(response.body).to include("gumroad-landing-frame")
  end

  it "keeps banned products and deleted sellers on the original controller" do
    Feature.activate_user(:product_page_react_on_rails, seller)
    product.update!(banned_at: Time.current)
    expect_controller(product.long_url(layout: "profile"))
    expect(response).to have_http_status(:not_found)
    product.update!(banned_at: nil)
    seller.update!(deleted_at: Time.current)
    expect_controller("#{PROTOCOL}://#{DOMAIN}/l/#{product.unique_permalink}", params: { layout: "profile" })
    expect(response).to have_http_status(:not_found)
  end

  it "honors legacy and numeric permalinks and product-domain lookup precedence" do
    LegacyPermalink.create!(product_id: product.id, permalink: "legacy-routing")
    product.update!(custom_permalink: "12345")
    domain = create(:custom_domain, :with_product, :verified_with_certificate, product:, domain: "product-routing.example.com")
    urls = ["#{seller.subdomain_with_protocol}/l/legacy-routing",
            "#{seller.subdomain_with_protocol}/l/12345",
            "http://#{domain.domain}/l/ignored-alias"]
    urls.each { expect_controller(_1, params: { layout: "profile" }) }
    Feature.activate_user(:product_page_react_on_rails, seller)
    urls.each { expect_controller(_1, live: true, params: { layout: "profile" }) }
  end

  it "keeps an impersonated seller's standalone view on the original controller" do
    Feature.activate_user(:product_page_react_on_rails, seller)
    admin = create(:admin_user)
    sign_in admin
    $redis.set(RedisKey.impersonated_user(admin.id), seller.id)
    expect_controller(product.long_url)
    expect_controller(product.long_url(layout: "profile"), live: true)
  ensure
    $redis.del(RedisKey.impersonated_user(admin.id)) if admin
  end

  it "uses valid switched seller membership and rejects a forged seller cookie" do
    Feature.activate_user(:product_page_react_on_rails, seller)
    buyer = create(:user)
    membership = create(:team_membership, user: buyer, seller:)
    sign_in buyer
    allow_any_instance_of(ActionDispatch::Cookies::CookieJar).to receive(:encrypted).and_return({ current_seller_id: seller.id })
    expect_controller(product.long_url)
    membership.destroy!
    sign_in User.find(buyer.id)
    expect_controller(product.long_url, live: true)
  end

  it "keeps invalidated sessions on the original controller before their redirect" do
    Feature.activate_user(:product_page_react_on_rails, seller)
    buyer = create(:user, last_active_sessions_invalidated_at: 1.hour.from_now)
    sign_in buyer
    expect_controller("#{PROTOCOL}://#{DOMAIN}/l/#{product.unique_permalink}", params: { layout: "profile" })
    expect(response).to be_redirect
    expect(response.location).to include("/login")
  end
end
