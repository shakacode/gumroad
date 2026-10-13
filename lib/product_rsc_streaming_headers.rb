# frozen_string_literal: true

class ProductRscStreamingHeaders
  def initialize(app)
    @app = app
  end

  def call(env)
    response = @app.call(env)
    # Rack::ETag needs the sentinel; Rack::ConditionalGet must never see it.
    response[1].delete("last-modified") if env["gumroad.product_rsc_streaming"]
    response
  end
end
