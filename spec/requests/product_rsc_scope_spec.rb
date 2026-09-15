# frozen_string_literal: true

require "spec_helper"

describe "Product RSC rollout scope", type: :request do
  include Devise::Test::IntegrationHelpers

  let(:seller) { create(:user, username: "scopeseller") }

  before do
    Feature.activate_user(:product_page_react_on_rails, seller)
    expect(Feature.active?(:product_page_react_on_rails, seller)).to be(true)
  end

  it "keeps the flagged seller's profile on Inertia" do
    get "#{seller.subdomain_with_protocol}/", headers: { "X-Inertia" => "true" }

    expect(response).to be_successful
    expect(response.parsed_body.fetch("component")).to eq("Users/Show")
  end

  it "keeps Discover on Inertia with the product rollout enabled" do
    sign_in seller
    get "#{UrlService.discover_domain_with_protocol}/discover", headers: { "X-Inertia" => "true" }

    expect(response).to be_successful
    expect(response.parsed_body.fetch("component")).to eq("Discover/Index")
  end
end
