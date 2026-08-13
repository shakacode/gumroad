# frozen_string_literal: true

ReactOnRails.configure do |config|
  config.server_bundle_js_file = "server-bundle.js"
  config.enforce_private_server_bundles = true
  config.auto_load_bundle = false
end
