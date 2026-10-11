# frozen_string_literal: true

class ProductRscLinksController < LinksController
  include ReactOnRailsPro::Stream

  prepend_around_action :close_live_response_stream, if: :product_rsc_route_request?
  before_action :prepare_product_xsrf_cookie
  helper_method :content_security_policy_nonce

  private
    def prepare_product_xsrf_cookie
      # Live can commit a normal Inertia response before its cookie after-action runs.
      cookies["XSRF-TOKEN"] = form_authenticity_token if protect_against_forgery?
    end

    def close_live_response_stream
      yield
    ensure
      response.stream.close if @rendering_product_rsc_document && response.committed? && !response.stream.closed?
    end

    def content_security_policy_nonce(*)
      SecureHeaders.content_security_policy_script_nonce(request)
    end
end
