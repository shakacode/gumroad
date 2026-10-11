# frozen_string_literal: true

require "spec_helper"

describe "Selective product renderer boundary", type: :request do
  let(:seller) { create(:user) }
  let(:product) { create(:product, user: seller) }

  it "keeps two sellers isolated and permits rollback without a renderer" do
    other_product = create(:product)
    Feature.activate_user(:product_page_react_on_rails, seller)
    allow(ReactOnRailsPro.configuration).to receive(:server_renderer).and_return("ExecJS")
    expect_any_instance_of(ProductRscLinksController).not_to receive(:stream_view_containing_react_components)

    get product.long_url(layout: "profile")
    expect(response).to have_http_status(:service_unavailable)
    expect(response.headers["Cache-Control"]).to include("no-store")

    get other_product.long_url(layout: "profile")
    expect(response).to be_successful
    expect(response.body).to include('id="app"')
    expect(response.body).not_to include('id="product-rsc-root"', "/public-rsc/")

    Feature.deactivate_user(:product_page_react_on_rails, seller)
    get product.long_url(layout: "profile")
    expect(response).to be_successful
    expect(response.body).to include('id="app"')
    expect(response.body).not_to include('id="product-rsc-root"', "/public-rsc/")
  end

  it "rejects caller-controlled RSC payload requests on root and seller hosts" do
    Feature.activate_user(:product_page_react_on_rails, seller)
    expect_any_instance_of(ProductRscLinksController).not_to receive(:stream_view_containing_react_components)
    ["#{PROTOCOL}://#{DOMAIN}", seller.subdomain_with_protocol].each do |host|
      ["ProductPage", "UnknownComponent"].each do |component|
        get "#{host}/rsc_payload/#{component}", params: { props: { product: { id: product.external_id }, global: { logged_in_user: { id: seller.external_id } } }.to_json }
        expect(response).to have_http_status(:not_found)
        get "#{host}/rsc_payload/#{component}", params: { props: "{" }
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  it "returns 503 for a real refused renderer connection before committing HTML" do
    Feature.activate_user(:product_page_react_on_rails, seller)
    socket = Socket.new(:INET, :STREAM, 0)
    socket.bind(Socket.sockaddr_in(0, "127.0.0.1"))
    WebMock.disable!
    ProductRscRenderer.with_configuration(url: "http://127.0.0.1:#{socket.local_address.ip_port}") do
      get product.long_url(layout: "profile")
      expect(response).to have_http_status(:service_unavailable)
      expect(response.headers["Cache-Control"]).to include("no-store")
      expect(response.body).to eq("Product rendering is temporarily unavailable.")
    end
  ensure
    WebMock.enable!
    socket&.close
  end

  it "preserves application errors before the first streamed byte" do
    Feature.activate_user(:product_page_react_on_rails, seller)
    allow(ReactOnRailsPro.configuration).to receive(:server_renderer).and_return("NodeRenderer")
    allow(ReactOnRailsPro.configuration).to receive(:renderer_password).and_return("test-only-stub")
    allow_any_instance_of(ProductRscLinksController).to receive(:stream_view_containing_react_components).and_raise(ArgumentError, "invalid product rendering")

    expect { get product.long_url(layout: "profile") }.to raise_error(ArgumentError, "invalid product rendering")
  end

  it "reports actual JavaScript rendering errors instead of returning error HTML", :product_rsc_renderer do
    Feature.activate_user(:product_page_react_on_rails, seller)
    errors = []
    allow_any_instance_of(ProductPresenter::RscContentProps).to receive(:props).and_return(nil)
    allow_any_instance_of(ProductRscLinksController).to receive(:stream_view_containing_react_components).and_wrap_original do |original, **options|
      original.call(**options)
    rescue StandardError => error
      errors << error
      raise
    end

    begin
      get product.long_url(layout: "profile")
      body = response.body
    rescue StandardError => error
      errors << error
    end

    expect(errors.map(&:message).join).to include("description_html")
    expect(body.to_s).not_to include("<pre", "Product rendering is temporarily unavailable.")
  end

  [false, true].each do |inertia|
    it "sets the XSRF cookie on a flag-off #{inertia ? 'Inertia' : 'document'} response with forgery protection" do
      allow_any_instance_of(ProductRscLinksController).to receive(:protect_against_forgery?).and_return(true)

      get product.long_url(layout: "profile"), headers: inertia ? { "X-Inertia" => "true", "X-Requested-With" => "XMLHttpRequest" } : {}

      expect(response).to be_successful
      expect(cookies["XSRF-TOKEN"]).to be_present
      expect(response.headers["X-Inertia"]).to eq("true") if inertia
    end
  end
end
