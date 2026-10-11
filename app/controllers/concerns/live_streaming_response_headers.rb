# frozen_string_literal: true

module LiveStreamingResponseHeaders
  extend ActiveSupport::Concern

  private
    def prepare_live_streaming_response
      # The outer middleware removes this sentinel after Rack::ETag skips buffering.
      request.env["gumroad.product_rsc_streaming"] = true
      response.headers["Last-Modified"] ||= Time.current.httpdate
      response.headers["X-Accel-Buffering"] = "no"
      response.headers["Cache-Control"] = "no-store"
    end
end
