# frozen_string_literal: true

class ProductRscLinksController < LinksController
  include ReactOnRailsPro::Stream

  prepend_around_action :close_live_response_stream
  helper_method :content_security_policy_nonce

  private
    def close_live_response_stream
      yield
    ensure
      response.stream.close unless response.stream.closed?
    end

    def content_security_policy_nonce(*)
      SecureHeaders.content_security_policy_script_nonce(request)
    end
end
