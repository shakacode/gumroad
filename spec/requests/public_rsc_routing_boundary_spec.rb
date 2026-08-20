# frozen_string_literal: true

require "spec_helper"

describe "Public RSC routing boundary", type: :request do
  let(:seller) { create(:user, username: "rscboundary") }
  let(:product) do
    create(
      :product,
      user: seller,
      display_product_reviews: true,
      name: "Routing boundary product"
    )
  end

  before do
    allow_any_instance_of(ActionView::Base).to receive(:vite_entrypoint_stylesheet_tag).and_return("")
    allow_any_instance_of(ActionView::Base).to receive(:vite_typescript_tag).and_return("")
  end

  def dispatch
    yield
    "#{response.request.path_parameters[:controller]}##{response.request.path_parameters[:action]}"
  end

  shared_examples "a public route boundary" do
    it "sends full HTML documents to the RSC controller" do
      allow_any_instance_of(rsc_controller).to receive(:stream_view_containing_react_components) do |controller, **|
        controller.content_type = "text/html"
        controller.response_body = "server-rendered document"
      end

      action = dispatch { get document_url, headers: { "Accept" => "text/html" } }

      expect(action).to eq("#{rsc_route_controller}#show")
      expect(response).to have_http_status(document_status)
      expect(response.media_type).to eq("text/html")
    end

    it "keeps full Inertia visits on the RSC document route" do
      action = dispatch { get document_url, headers: { "Accept" => "text/html", "X-Inertia" => "true" } }

      expect(action).to eq("#{rsc_route_controller}#show")
      expect(response).to have_http_status(inertia_status)
      expect(response.media_type).to eq("text/html")
      expect(response.headers["X-Inertia-Location"]).to eq(document_url) if inertia_status == :conflict
    end

    it "keeps partial Inertia requests on the existing controller" do
      action = dispatch { get partial_url, params: partial_params, headers: partial_headers }

      expect(action).to eq("#{partial_route_controller}#show")
      expect(response).to have_http_status(partial_status)
      expect(response.media_type).to eq(partial_media_type)
    end

    it "keeps explicit JSON requests on the product reviews controller" do
      action = dispatch do
        get "http://#{host}/product_reviews",
            params: { product_id: product.external_id, page: 1 },
            headers: { "Accept" => "application/json" }
      end

      expect(action).to eq("product_reviews#index")
      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("application/json")
    end

    it "keeps product embeds on the specialized HTML endpoint" do
      Feature.activate_user(:custom_html_pages, seller)
      product.update!(custom_html: "<h1>Embedded product</h1>")

      action = dispatch { get "http://#{host}/l/#{product.unique_permalink}/landing/embed" }

      expect(action).to eq("links#landing_iframe_content")
      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("text/html")
      expect(response.body).to include("Embedded product")
    ensure
      Feature.deactivate_user(:custom_html_pages, seller)
    end

    it "keeps product view tracking on the existing JSON endpoint" do
      action = dispatch do
        post "http://#{host}/links/#{product.unique_permalink}/increment_views",
             headers: { "Accept" => "application/json", "User-Agent" => "Googlebot" }
      end

      expect(action).to eq("links#increment_views")
      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body).to eq("success" => true)
    end

    it "keeps cart item counts on the existing HTML endpoint" do
      action = dispatch { get "http://#{host}/cart_items_count", headers: { "Accept" => "text/html" } }

      expect(action).to eq("links#cart_items_count")
      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("text/html")
    end
  end

  context "on the Gumroad root domain" do
    let(:host) { URI.parse(UrlService.root_domain_with_protocol).host }
    let(:document_url) { "http://#{host}/#{seller.username}" }
    let(:partial_url) { document_url }
    let(:rsc_controller) { ProfileRscUsersController }
    let(:rsc_route_controller) { "profile_rsc_users" }
    let(:partial_route_controller) { "users" }
    let(:document_status) { :moved_permanently }
    let(:inertia_status) { :moved_permanently }
    let(:partial_status) { :moved_permanently }
    let(:partial_media_type) { "text/html" }
    let(:partial_params) { {} }
    let(:partial_headers) do
      {
        "Accept" => "text/html",
        "X-Inertia" => "true",
        "X-Inertia-Partial-Component" => "Users/Show",
        "X-Inertia-Partial-Data" => "creator_profile",
      }
    end

    include_examples "a public route boundary"
  end

  context "on a seller subdomain" do
    let(:host) { URI.parse(seller.subdomain_with_protocol).host }
    let(:document_url) { "http://#{host}/" }
    let(:partial_url) { document_url }
    let(:rsc_controller) { ProfileRscUsersController }
    let(:rsc_route_controller) { "profile_rsc_users" }
    let(:partial_route_controller) { "users" }
    let(:document_status) { :ok }
    let(:inertia_status) { :conflict }
    let(:partial_status) { :ok }
    let(:partial_media_type) { "application/json" }
    let(:partial_params) { {} }
    let(:partial_headers) do
      {
        "Accept" => "text/html",
        "X-Inertia" => "true",
        "X-Inertia-Partial-Component" => "Users/Show",
        "X-Inertia-Partial-Data" => "creator_profile",
      }
    end

    include_examples "a public route boundary"
  end

  context "on a user custom domain" do
    let(:host) { "seller-rsc.example.com" }
    let(:document_url) { "http://#{host}/" }
    let(:partial_url) { document_url }
    let(:rsc_controller) { ProfileRscUsersController }
    let(:rsc_route_controller) { "profile_rsc_users" }
    let(:partial_route_controller) { "users" }
    let(:document_status) { :ok }
    let(:inertia_status) { :conflict }
    let(:partial_status) { :ok }
    let(:partial_media_type) { "application/json" }
    let(:partial_params) { {} }
    let(:partial_headers) do
      {
        "Accept" => "text/html",
        "X-Inertia" => "true",
        "X-Inertia-Partial-Component" => "Users/Show",
        "X-Inertia-Partial-Data" => "creator_profile",
      }
    end

    before { create(:custom_domain, domain: host, user: seller) }

    include_examples "a public route boundary"
  end

  context "on a product custom domain" do
    let(:host) { "product-rsc.example.com" }
    let(:document_url) { "http://#{host}/" }
    let(:partial_url) { document_url }
    let(:rsc_controller) { ProductRscLinksController }
    let(:rsc_route_controller) { "product_rsc_links" }
    let(:partial_route_controller) { "links" }
    let(:document_status) { :ok }
    let(:inertia_status) { :conflict }
    let(:partial_status) { :ok }
    let(:partial_media_type) { "application/json" }
    let(:partial_params) { { layout: Product::Layout::DISCOVER, query: "routing" } }
    let(:partial_headers) do
      {
        "Accept" => "text/html",
        "X-Inertia" => "true",
        "X-Inertia-Partial-Component" => "Products/Discover/Show",
        "X-Inertia-Partial-Data" => "autocomplete_results",
      }
    end

    before { create(:custom_domain, :with_product, domain: host, product:) }

    include_examples "a public route boundary"
  end
end
