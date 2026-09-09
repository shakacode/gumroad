# frozen_string_literal: true

module LiveStreamingResponseHeaders
  extend ActiveSupport::Concern

  private
    def prepare_live_streaming_response
      # Rack::ETag can buffer ActionController::Live bodies unless a freshness
      # header is already present before the first stream write.
      response.headers["Last-Modified"] ||= Time.current.httpdate
      response.headers["X-Accel-Buffering"] = "no"
    end
end
