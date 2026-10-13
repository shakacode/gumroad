# frozen_string_literal: true

require "spec_helper"

describe "Authenticated product documents", :product_rsc_renderer, type: :request do
  include Devise::Test::IntegrationHelpers

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

  it "preserves the signed-in buyer and usable CSRF tokens through streaming and rollback" do
    buyer = create(:user)
    product = create(:product)
    allow_any_instance_of(ApplicationController).to receive(:protect_against_forgery?).and_return(true)
    sign_in buyer
    Feature.activate_user(:product_page_react_on_rails, product.user)

    [true, false].each do |enabled|
      Feature.deactivate_user(:product_page_react_on_rails, product.user) unless enabled
      get product.long_url(layout: "profile")
      expect(response).to be_successful
      expect(response.body).to include(enabled ? 'id="product-rsc-root"' : 'id="app"')
      token = Nokogiri::HTML(response.body).at_css("meta[name='csrf-token']")["content"]
      expect(token).to be_present
      expect(token).not_to eq(CsrfTokenInjector::TOKEN_PLACEHOLDER)
      expect(cookies["XSRF-TOKEN"]).to be_present

      expect do
        post "#{PROTOCOL}://#{DOMAIN}#{help_center_contact_path}",
             params: { email: buyer.email, category: "technical issue", message: "The product page needs help." },
             headers: { "X-CSRF-Token" => token }
      end.to have_enqueued_mail(SupportContactMailer, :contact_form).with(hash_including(user_id: buyer.id))
      expect(response).to have_http_status(:ok)
    end
  end
end
