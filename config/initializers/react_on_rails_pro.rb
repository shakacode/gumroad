# frozen_string_literal: true

renderer_password = ENV["RENDERER_PASSWORD"].presence

ReactOnRailsPro.configure do |config|
  config.server_renderer = renderer_password.present? ? "NodeRenderer" : "ExecJS"
  config.renderer_url = ENV.fetch("REACT_RENDERER_URL", "http://127.0.0.1:3800")
  config.renderer_password = renderer_password
  config.ssr_timeout = 5
  config.renderer_request_retry_limit = 1
  config.renderer_use_fallback_exec_js = false
  config.throw_js_errors = true
  config.prerender_caching = false
  config.tracing = Rails.env.development?

  config.enable_rsc_support = true
  config.rsc_bundle_js_file = "rsc-bundle.js"
  config.rsc_payload_generation_url_path = "rsc_payload/"
end
