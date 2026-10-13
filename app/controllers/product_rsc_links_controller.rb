# frozen_string_literal: true

class ProductRscLinksController < LinksController
  include ReactOnRailsPro::Stream

  prepend_around_action :clear_live_active_record_connections
  prepend_around_action :close_live_response_stream, if: :product_rsc_route_request?
  before_action :prepare_product_xsrf_cookie
  helper_method :content_security_policy_nonce

  def process(name)
    # Precommit exceptions return to Live's parent thread for middleware reporting.
    Sentry.get_current_scope&.set_transaction_name("#{self.class}##{name}", source: :view)
    super
  end

  private
    def process_action(*)
      super
    rescue ActionController::Live::ClientDisconnected
      # A normal disconnect still runs the stream and connection-cleanup ensures.
      nil
    rescue StandardError => error
      # Capture worker-added context before Live re-raises on the parent; Sentry deduplicates it.
      Sentry.capture_exception(error)
      raise
    end

    def new_controller_thread
      request_scope = Sentry.get_current_scope&.dup
      return super unless request_scope

      # Live copies fiber locals, but Sentry stores its hub in a true thread variable.
      super do
        Sentry.with_scope do |scope|
          scope.clear
          scope.update_from_scope(request_scope)
          scope.set_rack_env(request_scope.rack_env)
          scope.set_level(request_scope.level)
          scope.set_session(request_scope.session)
          request_scope.event_processors.each { scope.add_event_processor(&_1) }
          yield
        end
      end
    end

    def prepare_product_xsrf_cookie
      # Live can commit the document before its cookie after-action runs.
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
