# frozen_string_literal: true

require "spec_helper"

describe "Public seller profile RSC routing", type: :request do
  let(:seller) { create(:user, username: "rscseller", name: "RSC Seller") }
  let(:seller_url) { seller.subdomain_with_protocol }

  before do
    create(:product, user: seller, name: "RSC profile product")
    allow_any_instance_of(ActionView::Base).to receive(:vite_entrypoint_stylesheet_tag).and_return("")
    allow_any_instance_of(ActionView::Base).to receive(:vite_typescript_tag).and_return("")
  end

  it "uses the dedicated RSC controller for a full HTML request" do
    streamed_options = nil
    rsc_component_name = nil
    rsc_props = nil
    allow_any_instance_of(ProfileRscUsersController).to receive(:stream_view_containing_react_components) do |controller, **options|
      streamed_options = options
      rsc_component_name = controller.instance_variable_get(:@public_rsc_component_name)
      rsc_props = controller.instance_variable_get(:@public_rsc_props)
      controller.response_body = "server-rendered profile"
    end

    get seller_url

    expect(response).to be_successful
    expect(response.body).to eq("server-rendered profile")
    expect(streamed_options).to include(template: "public_rsc/show", layout: "inertia")
    expect(rsc_component_name).to eq("ProfileRscCompatibilityPage")
    expect(rsc_props.dig(:creator_profile, :name)).to eq(seller.name)
    expect(rsc_props.dig(:global, :href)).to eq("#{seller_url}/")
    expect(rsc_props.dig(:global, :csp_nonce)).to be_nil
    expect(response.headers["Last-Modified"]).to be_present
  end

  it "upgrades a full Inertia visit to an RSC document request" do
    get seller_url, headers: { "X-Inertia" => "true" }

    expect(response).to have_http_status(:conflict)
    expect(response.headers["X-Inertia-Location"]).to eq("#{seller_url}/")
  end

  it "keeps Inertia partial requests on their specialized response" do
    headers = {
      "X-Inertia" => "true",
      "X-Inertia-Partial-Component" => "Users/Show",
      "X-Inertia-Partial-Data" => "creator_profile",
    }

    get seller_url, headers: headers

    expect(response).to be_successful
    expect(response.parsed_body["component"]).to eq("Users/Show")
    expect(response.parsed_body.fetch("props")).to have_key("creator_profile")
  end

  it "leaves custom HTML profiles on the existing wrapper path" do
    seller.update!(custom_html: "<h1>Custom profile</h1>")
    Feature.activate_user(:custom_html_pages, seller)

    get seller_url

    expect(response).to be_successful
    expect(response.body).to include(%(src="/landing/embed"))
    expect(response.body).not_to include("profile-rsc-root")
  ensure
    Feature.deactivate_user(:custom_html_pages, seller)
  end

  it "leaves JSON responses on the public profile API path" do
    get "#{UrlService.root_domain_with_protocol}/#{seller.username}.json"

    expect(response).to be_successful
    expect(response.media_type).to eq("application/json")
    expect(response.parsed_body["username"]).to eq(seller.username)
  end

  it "resolves a request on a seller custom domain" do
    create(:custom_domain, domain: "profile-rsc.example.com", user: seller)
    allow_any_instance_of(ProfileRscUsersController).to receive(:stream_view_containing_react_components) do |controller, **|
      controller.response_body = "server-rendered custom-domain profile"
    end

    get "http://profile-rsc.example.com/"

    expect(response).to be_successful
    expect(response.body).to eq("server-rendered custom-domain profile")
  end

  it "keeps seller page slugs on user pages while routing root-domain profiles to RSC" do
    create(:custom_domain, domain: "profile-page.example.com", user: seller)

    seller_page_route = Rails.application.routes.recognize_path("#{seller_url}/about", method: :get)
    custom_page_route = Rails.application.routes.recognize_path("http://profile-page.example.com/about", method: :get)
    profile_route = Rails.application.routes.recognize_path(
      "#{UrlService.root_domain_with_protocol}/#{seller.username}",
      method: :get
    )

    expect(seller_page_route).to include(controller: "user_pages", action: "show", slug: "about")
    expect(custom_page_route).to include(controller: "user_pages", action: "show", slug: "about")
    expect(profile_route).to include(controller: "profile_rsc_users", action: "show", username: seller.username)
  end
end
