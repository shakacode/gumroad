# frozen_string_literal: true

require "spec_helper"

describe "Selective product renderer boundary", type: :request do
  include Devise::Test::IntegrationHelpers

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

    expect(errors.map(&:message).join).to match(/Cannot read properties of null|Cannot destructure property.*null/)
    expect(body.to_s).not_to include("<pre", "Product rendering is temporarily unavailable.")
  end

  it "keeps a real streamed response uncached and nonces its executable inline scripts", :product_rsc_renderer do
    Feature.activate_user(:product_page_react_on_rails, seller)

    get product.long_url(layout: "profile")

    expect(response).to be_successful
    expect(response.headers["Cache-Control"]).to include("no-store")
    document = Nokogiri::HTML(response.body)
    expect(document.css("script[data-react-on-rails-rsc-payload]")).not_to be_empty
    inline_scripts = document.css("script:not([src])").reject { _1["type"].to_s.include?("json") }
    expect(inline_scripts).not_to be_empty
    inline_scripts.each do |script|
      expect(script["nonce"]).to be_present
      expect(response.headers["Content-Security-Policy"]).to include("'nonce-#{script['nonce']}'")
    end
  end

  it "serves the personalized document despite conditional freshness dates", :product_rsc_renderer do
    Feature.activate_user(:product_page_react_on_rails, seller)

    [Time.current, 1.day.from_now].each do |date|
      get product.long_url(layout: "profile"), headers: { "If-Modified-Since" => date.httpdate, "SERVER_PROTOCOL" => "HTTP/1.1" }

      expect(response).to have_http_status(:ok)
      expect(response.headers["Cache-Control"]).to include("no-store")
      expect(response.headers["Last-Modified"]).to be_nil
      expect(response.headers["ETag"]).to be_nil
      expect(response.body).to include('id="product-rsc-root"')
    end
  end

  it "preserves a flagged checkout redirect when the renderer is unconfigured" do
    Feature.activate_user(:product_page_react_on_rails, seller)
    allow(ReactOnRailsPro.configuration).to receive(:server_renderer).and_return("ExecJS")
    expect_any_instance_of(ProductRscLinksController).not_to receive(:stream_view_containing_react_components)

    get product.long_url(layout: "profile"), params: { wanted: true }

    expect(response).to have_http_status(:found)
    location = URI(response.location)
    expect(location.path).to eq("/checkout")
    expect(Rack::Utils.parse_query(location.query)).to include("product" => product.unique_permalink)
    expect(response.headers["Last-Modified"]).to be_nil
    expect(response.headers["X-Accel-Buffering"]).to be_nil
  end

  context "when the product renderer flag is off" do
    let(:buyer) { create(:user) }

    around do |example|
      live = ActionController::Live
      test_thread_method = live.instance_method(:new_controller_thread)
      test_cleanup_method = live.instance_method(:clean_up_thread_locals)
      # Restore the pooled worker below ProductRscLinksController's scope wrapper.
      live.send(:alias_method, :new_controller_thread, :original_new_controller_thread)
      live.send(:alias_method, :clean_up_thread_locals, :original_clean_up_thread_locals)
      example.run
    ensure
      live.send(:define_method, :new_controller_thread, test_thread_method)
      live.send(:define_method, :clean_up_thread_locals, test_cleanup_method)
    end

    before do
      allow_any_instance_of(ApplicationController).to receive(:protect_against_forgery?).and_return(true)
      sign_in buyer
    end

    def expect_authenticated_contact_submission(csrf_token)
      expect do
        post "#{PROTOCOL}://#{DOMAIN}#{help_center_contact_path}",
             params: { email: buyer.email, category: "technical issue", message: "The product page needs help." },
             headers: { "X-CSRF-Token" => csrf_token }
      end.to have_enqueued_mail(SupportContactMailer, :contact_form).with(hash_including(user_id: buyer.id))

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["success"]).to be(true)
    end

    def csrf_token_from_document
      tokens = Nokogiri::HTML(response.body).css("meta[name='csrf-token']")
      expect(tokens.length).to eq(1)
      token = tokens.first["content"]
      expect(token).to be_present
      expect(token).not_to eq(CsrfTokenInjector::TOKEN_PLACEHOLDER)
      token
    end

    [false, true].each do |inertia|
      it "preserves headers, cookies and the authenticated session on a #{inertia ? 'Inertia' : 'document'} response" do
        affiliate = create(:direct_affiliate, seller:, products: [product])

        get product.long_url(layout: "profile", code: "parity"),
            params: { a: affiliate.external_id_numeric },
            headers: inertia ? { "X-Inertia" => "true", "X-Requested-With" => "XMLHttpRequest" } : {}

        expect(response).to be_successful
        expect(response.media_type).to eq(inertia ? "application/json" : "text/html")
        expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
        expect(response.headers["Content-Security-Policy"]).to include("script-src", "object-src 'none'")
        expect(response.headers["X-Robots-Tag"]).to eq("noindex")
        expect(response.headers["Last-Modified"]).to be_nil
        expect(response.headers["X-Accel-Buffering"]).to be_nil
        expect(cookies["_gumroad_guid"]).to be_present
        expect(cookies[affiliate.cookie_key]).to be_present
        expect(cookies["XSRF-TOKEN"]).to be_present
        expect(response.body).not_to include('id="product-rsc-root"', "/public-rsc/")

        if inertia
          expect(response.headers["X-Inertia"]).to eq("true")
          expect(response.parsed_body["component"]).to eq("Products/Profile/Show")
          csrf_token = cookies["XSRF-TOKEN"]
        else
          expect(response.headers["X-Inertia"]).to be_nil
          csrf_token = csrf_token_from_document
        end

        expect_authenticated_contact_submission(csrf_token)
      end
    end

    it "preserves a valid CSRF token and matching CSP nonce on the custom HTML wrapper" do
      Feature.activate_user(:custom_html_pages, seller)
      product.update!(custom_html: "<main>Custom product</main>")

      get product.long_url

      expect(response).to be_successful
      expect(response.media_type).to eq("text/html")
      document = Nokogiri::HTML(response.body)
      expect(document.at_css("iframe#gumroad-landing-frame")).to be_present
      nonces = document.css("script[nonce]").map { _1["nonce"] }.uniq
      expect(nonces).not_to be_empty
      nonces.each do |nonce|
        expect(nonce).to be_present
        expect(response.headers["Content-Security-Policy"]).to include("'nonce-#{nonce}'")
      end

      expect_authenticated_contact_submission(csrf_token_from_document)
    end
  end
end
