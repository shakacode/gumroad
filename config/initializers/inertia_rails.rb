# frozen_string_literal: true

InertiaRails.configure do |config|
  config.always_include_errors_hash = true
  config.deep_merge_shared_data = true
  # Opt-in server-side rendering through Inertia's Node SSR server (`bin/vite ssr`).
  # Off by default, so ordinary environments keep client rendering.
  config.ssr_enabled = ENV["INERTIA_SSR_ENABLED"] == "true"
  config.ssr_url = ENV.fetch("INERTIA_SSR_URL", "http://127.0.0.1:13714")
end
