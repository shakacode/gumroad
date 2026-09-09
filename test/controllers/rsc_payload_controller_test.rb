# frozen_string_literal: true

require "test_helper"

class RscPayloadControllerTest < ActiveSupport::TestCase
  test "sets streaming headers before a successful payload response" do
    controller = Class.new(RscPayloadController) do
      def rsc_payload
        head :ok
      end
    end

    status, headers, body = controller.action(:rsc_payload).call(
      Rack::MockRequest.env_for("/rsc_payload/Example")
    )

    assert_equal 200, status
    assert_equal "no", headers.fetch("x-accel-buffering")
    assert headers.fetch("last-modified").present?
  ensure
    body&.close
  end
end
