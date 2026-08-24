# frozen_string_literal: true

require "active_support/core_ext/integer/time"

Rails.application.configure do
  # Production's CDN compresses assets; keep Slow 4G samples representative when Rails serves them locally.
  config.middleware.insert_before 0, Rack::Deflater,
                                  if: ->(env, *) { env["PATH_INFO"].start_with?("/vite/", "/public-rsc/") },
                                  include: %w[application/javascript application/json application/xml image/svg+xml text/css text/html text/javascript text/plain text/xml]

  config.enable_reloading = false
  config.eager_load = true

  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  config.public_file_server.enabled = true
  config.public_file_server.headers = {
    "Cache-Control" => "public, max-age=#{1.year.to_i}, immutable"
  }

  # Twin storefronts must resolve both entries and lazy chunks against the
  # request's seller origin instead of a separate asset host.
  config.asset_host = nil
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
