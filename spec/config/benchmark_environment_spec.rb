# frozen_string_literal: true

require "json"
require "open3"

RSpec.describe "benchmark Rails environment" do
  CONFIG_RUNNER = <<~'RUBY'
    require "json"

    storage = ActiveStorage::Blob.services.fetch(:benchmark)
    storefront_hosts = %w[localhost:3100 o365itpros.localhost:3100]
    requests = storefront_hosts.to_h do |host|
      session = ActionDispatch::Integration::Session.new(Rails.application)
      session.host! host
      session.get("/healthcheck")
      [host, { status: session.response.status, location: session.response.location }]
    end
    vite_paths = {
      entry: "#{Rails.application.config.asset_host}/vite/assets/entry.js",
      lazy_chunk: "#{ViteRuby.config.asset_host}/vite/assets/lazy-chunk.js",
    }
    vite_urls = storefront_hosts.to_h do |host|
      storefront_url = "http://#{host}/l/example"
      [host, vite_paths.transform_values { |path| URI.join(storefront_url, path).to_s }]
    end
    rack_attack_request = Rack::Attack::Request.new(
      Rack::MockRequest.env_for("/", "HTTP_CF_CONNECTING_IP" => "203.0.113.10")
    )
    team_member = Object.new
    def team_member.is_team_member? = true
    controller = ApplicationController.new
    controller.define_singleton_method(:current_user) { team_member }
    team_member_profiler_authorization_safe = begin
      controller.send(:authorize_rack_mini_profiler)
      true
    rescue NameError
      false
    end

    payload = {
      rails_env: Rails.env.to_s,
      production: Rails.env.production?,
      staging: Rails.env.staging?,
      eager_load: Rails.application.config.eager_load,
      enable_reloading: Rails.application.config.enable_reloading,
      controller_caching: Rails.application.config.action_controller.perform_caching,
      static_files: Rails.application.config.public_file_server.enabled,
      asset_host: Rails.application.config.asset_host,
      storage_service: Rails.application.config.active_storage.service,
      storage_class: storage.class.name,
      storage_bucket: storage.bucket.name,
      storage_endpoint: storage.client.client.config.endpoint.to_s,
      storage_force_path_style: storage.client.client.config.force_path_style,
      database_adapter: ActiveRecord::Base.connection_db_config.adapter,
      database_name: ActiveRecord::Base.connection_db_config.database,
      mongo_hosts: Mongoid.default_client.cluster.addresses.map(&:to_s),
      mongo_database: Mongoid.default_client.database.name,
      domain: DOMAIN,
      protocol: PROTOCOL,
      vite_mode: ViteRuby.config.mode,
      vite_asset_host: ViteRuby.config.asset_host,
      vite_auto_build: ViteRuby.config.auto_build,
      vite_output_dir: ViteRuby.config.public_output_dir,
      renderer_url: ReactOnRailsPro.configuration.renderer_url,
      renderer_password_configured: ReactOnRailsPro.configuration.renderer_password == ENV.fetch("RENDERER_PASSWORD"),
      renderer_fallback: ReactOnRailsPro.configuration.renderer_use_fallback_exec_js,
      renderer_tracing: ReactOnRailsPro.configuration.tracing,
      mail_delivery_method: Rails.application.config.action_mailer.delivery_method,
      mail_deliveries: Rails.application.config.action_mailer.perform_deliveries,
      stripe_public_key: STRIPE_PUBLIC_KEY,
      braintree_environment: Braintree::Configuration.environment.to_s,
      paypal_url: PAYPAL_URL,
      currency_source: CURRENCY_SOURCE,
      analytics_enabled: ApplicationController.new.send(:analytics_enabled?, seller: nil),
      middleware: Rails.application.middleware.map { |middleware| middleware.klass.name },
      rack_attack_safelisted: Rack::Attack.configuration.safelisted?(rack_attack_request),
      seller_subdomain_match: Subdomain.send(:subdomain_request?, "seller.localhost").present?,
      profiler_constant_loaded: defined?(Rack::MiniProfiler).present?,
      team_member_profiler_authorization_safe:,
      session_key: Rails.application.config.session_options[:key],
      session_secure: Rails.application.config.session_options[:secure],
      requests:,
      vite_urls:,
    }

    puts "BENCHMARK_CONFIG=#{JSON.generate(payload)}"
  RUBY

  ASSET_HOST_RUNNER = <<~'RUBY'
    require "json"
    rack_attack_request = Rack::Attack::Request.new(
      Rack::MockRequest.env_for("/", "HTTP_CF_CONNECTING_IP" => "203.0.113.10")
    )
    puts "ASSET_HOST_CONFIG=#{JSON.generate(
      asset_host: Rails.application.config.asset_host,
      rack_attack_safelisted: Rack::Attack.configuration.safelisted?(rack_attack_request),
    )}"
  RUBY

  COMPRESSION_RUNNER = <<~'RUBY'
    require "json"
    require "securerandom"
    require "stringio"
    require "zlib"

    body = "benchmark-compression-proof\n" * 512
    binary_body = "\x89PNG\r\n\x1a\n".b + SecureRandom.random_bytes(8192)
    filename = "benchmark-compression-#{SecureRandom.hex(8)}.js"
    bodies = {
      "/vite/#{filename}" => body,
      "/public-rsc/#{filename.sub(/\.js\z/, ".txt")}" => body,
      "/public-rsc/#{filename.sub(/\.js\z/, ".png")}" => binary_body,
    }
    files = bodies.keys.map { |path| Rails.root.join("public", path.delete_prefix("/")) }
    files.zip(bodies.values).each do |file, contents|
      FileUtils.mkdir_p(file.dirname)
      File.binwrite(file, contents)
    end

    begin
      payload = bodies.to_h do |path, contents|
        response = Rack::MockRequest.new(Rails.application).get(
          path,
          "HTTP_ACCEPT_ENCODING" => "gzip",
          "HTTP_HOST" => "localhost:3100",
        )
        decoded = if response.headers["content-encoding"] == "gzip"
          Zlib::GzipReader.new(StringIO.new(response.body)).read
        else
          response.body
        end
        [path, {
          status: response.status,
          content_encoding: response.headers["content-encoding"],
          cache_control: response.headers["cache-control"],
          decoded: decoded == contents,
        }]
      end
      puts "COMPRESSION_CONFIG=#{JSON.generate(payload)}"
    ensure
      files.each { FileUtils.rm_f(_1) }
    end
  RUBY

  def run_environment(environment, runner, extra_env = {})
    env = {
      "RAILS_ENV" => environment,
      "DISABLE_SPRING" => "1",
      "SECRET_KEY_BASE" => "benchmark-spec-secret-key-base",
      "MEMCACHE_SERVERS" => "127.0.0.1:11211",
      "RENDERER_PASSWORD" => "benchmark-spec-renderer-password",
      "REACT_RENDERER_URL" => "http://127.0.0.1:3800",
      "VITE_RUBY_MODE" => environment == "benchmark" ? "production" : nil,
      "VITE_RUBY_ASSET_HOST" => environment == "benchmark" ? "" : nil,
      "DEV_LANE_PORT" => environment == "benchmark" ? "3100" : nil,
      "CUSTOM_DOMAIN" => nil,
      "REVISION" => "benchmark-spec",
    }.merge(extra_env)

    stdout, stderr, status = Open3.capture3(env, "bin/rails", "runner", runner)
    expect(status).to be_success, stderr
    stdout
  end

  def payload_from(stdout, marker)
    line = stdout.lines.find { |candidate| candidate.start_with?(marker) }
    expect(line).to be_present, stdout
    JSON.parse(line.delete_prefix(marker), symbolize_names: true)
  end

  before(:context) do
    stdout = run_environment("benchmark", CONFIG_RUNNER)
    @benchmark_config = payload_from(stdout, "BENCHMARK_CONFIG=")
  end

  it "uses production-like code loading and controller caching" do
    expect(@benchmark_config).to include(
      rails_env: "benchmark",
      production: false,
      staging: false,
      eager_load: true,
      enable_reloading: false,
      controller_caching: true,
    )
  end

  it "serves deterministic static files without an asset host or Vite compilation" do
    expect(@benchmark_config).to include(
      static_files: true,
      asset_host: nil,
      vite_mode: "production",
      vite_asset_host: "",
      vite_auto_build: false,
      vite_output_dir: "vite",
    )
    expect(@benchmark_config[:middleware]).to include("Rack::Deflater")
  end

  it "resolves initial and lazy Vite assets against each storefront origin" do
    expect(@benchmark_config[:vite_urls]).to eq(
      "localhost:3100": {
        entry: "http://localhost:3100/vite/assets/entry.js",
        lazy_chunk: "http://localhost:3100/vite/assets/lazy-chunk.js",
      },
      "o365itpros.localhost:3100": {
        entry: "http://o365itpros.localhost:3100/vite/assets/entry.js",
        lazy_chunk: "http://o365itpros.localhost:3100/vite/assets/lazy-chunk.js",
      },
    )
    expect(@benchmark_config[:vite_urls].to_json).not_to include("assets.gumroad.com")
  end

  it "serves compressed Vite and public RSC assets with immutable caching" do
    compression = payload_from(run_environment("benchmark", COMPRESSION_RUNNER), "COMPRESSION_CONFIG=")

    expect(compression.keys.map { _1.to_s.sub(/benchmark-compression-[^.]+/, "benchmark") }).to contain_exactly(
      "/vite/benchmark.js",
      "/public-rsc/benchmark.txt",
      "/public-rsc/benchmark.png",
    )
    expect(compression.values_at(*compression.keys.reject { _1.end_with?(".png") })).to all(include(status: 200, content_encoding: "gzip", decoded: true))
    expect(compression.values_at(*compression.keys.select { _1.end_with?(".png") })).to all(include(status: 200, content_encoding: nil, decoded: true))
    expect(compression.values).to all(satisfy { _1[:cache_control].include?("immutable") })
  end

  it "uses disposable local database, Mongo and MinIO configuration" do
    expect(@benchmark_config).to include(
      database_adapter: "mysql2_makara",
      storage_service: "benchmark",
      storage_class: "ActiveStorage::Service::S3Service",
      storage_bucket: "gumroad-dev-public-storage",
      storage_force_path_style: true,
    )
    expect(@benchmark_config[:database_name]).to eq(ENV.fetch("DATABASE_NAME"))
    expect(@benchmark_config[:mongo_database]).to eq(ENV.fetch("MONGO_DATABASE_NAME"))
    expect(@benchmark_config[:mongo_hosts]).to include(ENV.fetch("MONGO_DATABASE_URL"))
    expect(@benchmark_config[:storage_endpoint]).to eq(ENV.fetch("AWS_S3_ENDPOINT"))
  end

  it "uses the authenticated local renderer with production React behavior" do
    expect(@benchmark_config).to include(
      renderer_url: "http://127.0.0.1:3800",
      renderer_password_configured: true,
      renderer_fallback: false,
      renderer_tracing: false,
    )
  end

  it "keeps HTTP localhost and seller subdomains routable" do
    expect(@benchmark_config).to include(domain: "localhost:3100", protocol: "http")
    expect(@benchmark_config[:rack_attack_safelisted]).to be(true)
    expect(@benchmark_config).to include(seller_subdomain_match: true)
    expect(@benchmark_config[:requests]).to eq(
      "localhost:3100": { status: 200, location: nil },
      "o365itpros.localhost:3100": { status: 200, location: nil },
    )
  end

  it "does not load development diagnostics" do
    expect(@benchmark_config[:middleware]).not_to include(
      "Bullet::Rack",
      "Rack::MiniProfiler",
      "EnsureHeadersIsRackHeadersObject",
      "ActionDispatch::ServerTiming",
      "ActionDispatch::Reloader",
      "ActiveRecord::Migration::CheckPending",
    )
    expect(@benchmark_config).to include(
      profiler_constant_loaded: false,
      team_member_profiler_authorization_safe: true,
    )
  end

  it "keeps payment and email integrations in local-safe modes" do
    expect(@benchmark_config).to include(
      mail_delivery_method: "test",
      mail_deliveries: false,
      braintree_environment: "sandbox",
      paypal_url: "https://www.sandbox.paypal.com",
      currency_source: Rails.root.join("lib/currency/backup_rates.json").to_s,
      analytics_enabled: false,
      session_key: "_gumroad_app_session_benchmark",
      session_secure: false,
    )
    expect(@benchmark_config[:stripe_public_key]).to start_with("pk_test_")
  end

  it "does not change development or production asset hosts" do
    development = payload_from(run_environment("development", ASSET_HOST_RUNNER), "ASSET_HOST_CONFIG=")
    production = payload_from(run_environment("production", ASSET_HOST_RUNNER), "ASSET_HOST_CONFIG=")

    expect(development[:asset_host]).to eq("http://app.localhost:3000")
    expect(production[:asset_host]).to eq("https://assets.gumroad.com")
    expect(development[:rack_attack_safelisted]).to be(false)
    expect(production[:rack_attack_safelisted]).to be(false)
  end
end
