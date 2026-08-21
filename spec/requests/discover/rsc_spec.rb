# frozen_string_literal: true

require "spec_helper"

describe "Discover RSC routing", type: :request do
  let(:discover_host) { VALID_DISCOVER_REQUEST_HOST }
  let(:empty_search_results) do
    {
      products: Link.none,
      total: 0,
      tags_data: [],
      filetypes_data: [],
      taxonomy_attributes_data: [],
    }
  end

  before do
    allow_any_instance_of(DiscoverController).to receive(:search_products).and_return(empty_search_results)
    allow_any_instance_of(DiscoverController).to receive(:curated_products).and_return([])
    allow_any_instance_of(DiscoverController).to receive(:recommended_wishlists_data).and_return([])
  end

  it "uses the dedicated RSC controller and streams recommendations as an async prop" do
    streamed_options = nil
    rsc_component_name = nil
    rsc_props = nil
    rsc_async_props = nil
    recommendation_calls = 0
    allow_any_instance_of(DiscoverController).to receive(:recommendations) do
      recommendation_calls += 1
      []
    end
    allow_any_instance_of(DiscoverRscController).to receive(:stream_view_containing_react_components) do |controller, **options|
      streamed_options = options
      rsc_component_name = controller.instance_variable_get(:@public_rsc_component_name)
      rsc_props = controller.instance_variable_get(:@public_rsc_props)
      rsc_async_props = controller.instance_variable_get(:@public_rsc_async_props)
      controller.response_body = "server-rendered Discover"
    end

    get "http://#{discover_host}/discover"

    expect(response).to be_successful
    expect(response.body).to eq("server-rendered Discover")
    expect(streamed_options).to include(template: "public_rsc/show", layout: "inertia")
    expect(rsc_component_name).to eq("DiscoverPage")
    expect(rsc_props).to include(:search_results, :recommended_wishlists, :recently_viewed)
    expect(rsc_props).not_to have_key(:recommended_products)
    expect(rsc_props[:recommended_wishlists]).to eq([])
    expect(rsc_props.dig(:global, :href)).to eq("http://#{discover_host}/discover")
    expect(recommendation_calls).to eq(0)
    expect(rsc_async_props.fetch(:recommended_products).call).to eq([])
    expect(recommendation_calls).to eq(1)
  end

  it "uses the dedicated RSC controller for an unflagged taxonomy page" do
    taxonomy = create(:taxonomy, slug: "music-and-sound-design")
    DiscoverTaxonomyConstraint.instance_variable_set(:@valid_taxonomy_paths, nil)

    route = Rails.application.routes.recognize_path("http://#{discover_host}/#{taxonomy.slug}", method: :get)

    expect(route).to include(controller: "discover_rsc", action: "index", taxonomy: taxonomy.slug)
  ensure
    DiscoverTaxonomyConstraint.instance_variable_set(:@valid_taxonomy_paths, nil)
  end

  it "resolves the root-domain Discover route" do
    allow_any_instance_of(DiscoverRscController).to receive(:stream_view_containing_react_components) do |controller, **|
      controller.response_body = "root-domain Discover"
    end

    get "http://test.gumroad.com/discover"

    expect(response).to be_successful
    expect(response.body).to eq("root-domain Discover")
  end

  it "upgrades a full Inertia visit to an RSC document request" do
    allow_any_instance_of(DiscoverRscController).to receive(:stream_view_containing_react_components) do |controller, **|
      controller.response_body = "unexpected stream"
    end

    url = "http://#{discover_host}/discover?sort=hot_and_new"
    get url, headers: { "X-Inertia" => "true" }

    expect(response).to have_http_status(:conflict)
    expect(response.headers["X-Inertia-Location"]).to eq(url)
  end
end
