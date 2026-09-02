# frozen_string_literal: true

class RscPayloadController < ReactOnRailsPro::RscPayloadController
  include LiveStreamingResponseHeaders

  before_action :prepare_live_streaming_response, only: :rsc_payload
end
