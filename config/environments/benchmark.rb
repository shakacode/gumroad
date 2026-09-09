# frozen_string_literal: true

require "active_support/core_ext/integer/time"

Rails.application.configure do
  # Production's CDN compresses assets; keep Slow 4G samples representative when Rails serves them locally.
  config.middleware.insert_before 0, Rack::Deflater,
                                  if: ->(env, *) { env["PATH_INFO"].start_with?("/vite/", "/product-rsc/") }

  config.enable_reloading = false
  config.eager_load = true

  # Stripe fetches its font stylesheet before passing it to the card iframe.
  config.x.benchmark_csp_connect_src = ["https://fonts.googleapis.com"]

  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  config.public_file_server.enabled = true
  config.public_file_server.headers = {
    "Cache-Control" => "public, max-age=#{1.year.to_i}, immutable",
    "Access-Control-Allow-Origin" => "*"
  }

  # Seller pages and the cart iframe share one cacheable asset origin per stack.
  config.asset_host = "#{PROTOCOL}://#{ROOT_DOMAIN}"
  config.active_storage.service = :benchmark

  config.action_cable.allowed_request_origins = [%r{\Ahttp://(?:[a-z0-9-]+\.)*localhost(?::\d+)?\z}i]

  config.logger = ActiveSupport::Logger.new(STDOUT)
    .tap { |logger| logger.formatter = ::Logger::Formatter.new }
    .then { |logger| ActiveSupport::TaggedLogging.new(logger) }
  config.log_tags = [:request_id]
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")

  config.cache_store = :mem_cache_store,
                       *ENV.fetch("MEMCACHE_SERVERS").split(","),
                       { namespace: ENV.fetch("BENCHMARK_CACHE_NAMESPACE", "shakaperf-benchmark") }

  config.action_mailer.perform_caching = false
  config.action_mailer.perform_deliveries = false
  config.action_mailer.raise_delivery_errors = false

  config.i18n.fallbacks = [I18n.default_locale]
  config.active_support.report_deprecations = true
  config.active_support.disallowed_deprecation = :log
  config.active_record.dump_schema_after_migration = false
  config.mongoid.logger.level = Logger::INFO
end
