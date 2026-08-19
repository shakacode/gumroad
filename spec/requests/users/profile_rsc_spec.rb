# frozen_string_literal: true

require "spec_helper"

describe "Public seller profile RSC routing", type: :request do
  let(:seller) { create(:user, username: "rscseller", name: "RSC Seller") }
  let(:seller_host) { "#{seller.username}.test.gumroad.com" }

  before do
    create(:product, user: seller, name: "RSC profile product")
    stub_const("ROOT_DOMAIN", "test.gumroad.com")
    allow_any_instance_of(ActionView::Base).to receive(:vite_entrypoint_stylesheet_tag).and_return("")
    allow_any_instance_of(ActionView::Base).to receive(:vite_typescript_tag).and_return("")
  end

  it "uses the dedicated RSC controller for an opted-in full HTML request" do
    streamed_options = nil
    rsc_component_name = nil
    rsc_props = nil
    allow_any_instance_of(ProfileRscUsersController).to receive(:stream_view_containing_react_components) do |controller, **options|
      streamed_options = options
      rsc_component_name = controller.instance_variable_get(:@public_rsc_component_name)
      rsc_props = controller.instance_variable_get(:@public_rsc_props)
      controller.response_body = "server-rendered profile"
    end

    get "http://#{seller_host}/", params: { rsc: "1" }

    expect(response).to be_successful
    expect(response.body).to eq("server-rendered profile")
    expect(streamed_options).to include(template: "public_rsc/show", layout: "inertia")
    expect(rsc_component_name).to eq("NativeProfileRscPage")
    expect(rsc_props.dig(:creator_profile, :name)).to eq(seller.name)
    expect(rsc_props.dig(:global, :href)).to include("rsc=1")
    expect(rsc_props.dig(:global, :csp_nonce)).to be_nil
    expect(response.headers["Last-Modified"]).to be_present
  end

  it "keeps an ordinary full HTML request on Inertia" do
    get "http://#{seller_host}/"

    expect(response).to be_successful
    expect(response.body).to include('id="app" data-page=')
    expect(response.body).not_to include("native-profile-rsc-root")
  end

  it "keeps Inertia and partial requests on Inertia even when opted in" do
    headers = {
      "X-Inertia" => "true",
      "X-Inertia-Partial-Component" => "Users/Show",
      "X-Inertia-Partial-Data" => "creator_profile",
    }

    get "http://#{seller_host}/", params: { rsc: "1" }, headers: headers

    expect(response).to be_successful
    expect(response.parsed_body["component"]).to eq("Users/Show")
    expect(response.parsed_body.fetch("props")).to have_key("creator_profile")
  end

  it "leaves custom HTML profiles on the existing wrapper path" do
    seller.update!(custom_html: "<h1>Custom profile</h1>")
    Feature.activate_user(:custom_html_pages, seller)

    get "http://#{seller_host}/", params: { rsc: "1" }

    expect(response).to be_successful
    expect(response.body).to include(%(src="/landing/embed"))
    expect(response.body).not_to include("native-profile-rsc-root")
  ensure
    Feature.deactivate_user(:custom_html_pages, seller)
  end

  it "leaves JSON responses on the public profile API path" do
    get "http://test.gumroad.com/#{seller.username}.json", params: { rsc: "1" }

    expect(response).to be_successful
    expect(response.media_type).to eq("application/json")
    expect(response.parsed_body["username"]).to eq(seller.username)
  end

  it "preserves the root-domain redirect" do
    get "http://test.gumroad.com/#{seller.username}", params: { rsc: "1" }

    expect(response).to have_http_status(:moved_permanently)
    expect(response.location).to eq("http://#{seller_host}/?rsc=1")
  end

  it "resolves an opted-in request on a seller custom domain" do
    create(:custom_domain, domain: "profile-rsc.example.com", user: seller)
    allow_any_instance_of(ProfileRscUsersController).to receive(:stream_view_containing_react_components) do |controller, **|
      controller.response_body = "server-rendered custom-domain profile"
    end

    get "http://profile-rsc.example.com/", params: { rsc: "1" }

    expect(response).to be_successful
    expect(response.body).to eq("server-rendered custom-domain profile")
  end
end
