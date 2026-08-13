# frozen_string_literal: true

class ProductRscLinksController < LinksController
  include ReactOnRailsPro::Stream

  helper_method :content_security_policy_nonce

  private
    def content_security_policy_nonce(*)
      SecureHeaders.content_security_policy_script_nonce(request)
    end
end
