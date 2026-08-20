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

  it "uses the dedicated RSC controller and resolves deferred props for a full HTML request" do
    streamed_options = nil
    rsc_component_name = nil
    rsc_props = nil
    allow_any_instance_of(DiscoverRscController).to receive(:stream_view_containing_react_components) do |controller, **options|
      streamed_options = options
      rsc_component_name = controller.instance_variable_get(:@public_rsc_component_name)
      rsc_props = controller.instance_variable_get(:@public_rsc_props)
      controller.response_body = "server-rendered Discover"
    end

    get "http://#{discover_host}/discover", params: { rsc: "1" }

    expect(response).to be_successful
    expect(response.body).to eq("server-rendered Discover")
    expect(streamed_options).to include(template: "public_rsc/show", layout: "inertia")
    expect(rsc_component_name).to eq("NativeDiscoverRscPage")
    expect(rsc_props).to include(:search_results, :recommended_products, :recommended_wishlists, :recently_viewed)
    expect(rsc_props[:recommended_products]).to eq([])
    expect(rsc_props[:recommended_wishlists]).to eq([])
    expect(rsc_props.dig(:global, :href)).to include("rsc=1")
  end

  it "uses the dedicated RSC controller for a taxonomy page when the experiment gate is enabled" do
    taxonomy = create(:taxonomy, slug: "music-and-sound-design")
    DiscoverTaxonomyConstraint.instance_variable_set(:@valid_taxonomy_paths, nil)
    original_native_public_rsc = ENV["SHAKAPERF_NATIVE_PUBLIC_RSC"]
    ENV["SHAKAPERF_NATIVE_PUBLIC_RSC"] = "1"

    route = Rails.application.routes.recognize_path("http://#{discover_host}/#{taxonomy.slug}", method: :get)

    expect(route).to include(controller: "discover_rsc", action: "index", taxonomy: taxonomy.slug)
  ensure
    ENV["SHAKAPERF_NATIVE_PUBLIC_RSC"] = original_native_public_rsc
    DiscoverTaxonomyConstraint.instance_variable_set(:@valid_taxonomy_paths, nil)
  end

  it "resolves the root-domain Discover route" do
    allow_any_instance_of(DiscoverRscController).to receive(:stream_view_containing_react_components) do |controller, **|
      controller.response_body = "root-domain Discover"
    end

    get "http://test.gumroad.com/discover", params: { rsc: "1" }

    expect(response).to be_successful
    expect(response.body).to eq("root-domain Discover")
  end
end
