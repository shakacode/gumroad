# frozen_string_literal: true

require "open3"
require "pathname"
require "securerandom"
require "yaml"

RSpec.describe "ShakaPerf benchmark twins" do
  let(:root) { Pathname(__dir__).join("../..").expand_path }
  let(:compose) { YAML.safe_load_file(root.join("twin-servers/docker-compose.yml"), aliases: true) }
  let(:services) { compose.fetch("services") }
  let(:twin_services) { %w[control-server experiment-server] }
  let(:benchmark_environment) do
    {
      "RAILS_ENV" => "benchmark",
      "RACK_ENV" => "benchmark",
      "NODE_ENV" => "production",
      "VITE_RUBY_MODE" => "production",
      "VITE_RUBY_ASSET_HOST" => "",
      "VITE_RUBY_AUTO_BUILD" => "false",
      "MEMCACHE_SERVERS" => "127.0.0.1:11211",
    }
  end

  it "uses the repository toolchain and npm policy for both clean images" do
    dockerfile = root.join("twin-servers/Dockerfile").read
    node_version = root.join(".node-version").read.strip

    expect(node_version).to eq("22.22.2")
    expect(dockerfile).to include("ARG RUBY_VERSION=3.4.3", "ARG NODE_VERSION=#{node_version}")
    expect(dockerfile).to include("COPY --chown=${NON_ROOT_USER}:${NON_ROOT_USER} package.json package-lock.json .npmrc ./")
    expect(dockerfile).to match(/^RUN npm ci$/)
    expect(dockerfile).not_to include("legacy-peer-deps", "native-product-page-fixture", "CUSTOM_DOMAIN=localhost")
  end

  it "builds public RSC assets only when the image supports them" do
    dockerfile = root.join("twin-servers/Dockerfile").read
    capability_check = 'require("./package.json").scripts["build:public-rsc"]'

    expect(dockerfile).to include(capability_check)
    expect(dockerfile.index(capability_check)).to be < dockerfile.index("npm run build:public-rsc")
    expect(dockerfile).to include("then npm run build:public-rsc; fi")
  end

  it "isolates every twin service and uses in-container Memcached" do
    twin_services.each do |service|
      environment = services.dig(service, "environment")
      expect(environment).to include(benchmark_environment)
      expect(environment.fetch("BENCHMARK_CACHE_NAMESPACE")).to eq("shakaperf-#{service.delete_suffix("-server")}")
      expect(environment.fetch("DEV_LANE_PORT")).to eq(service == "control-server" ? "${CONTROL_PORT}" : "${EXPERIMENT_PORT}")
      expect(services.dig(service, "volumes")).to include(match(%r{:/home/\$\{USER\}/app\z}))
    end

    expect(services.keys.grep(/memcache/i)).to be_empty
    %w[DATABASE_HOST MONGO_DATABASE_URL REDIS_HOST ELASTICSEARCH_HOST AWS_S3_ENDPOINT].each do |key|
      expect(services.dig("control-server", "environment", key)).not_to eq(services.dig("experiment-server", "environment", key))
    end
  end

  it "starts Memcached idempotently before normal database setup" do
    script = root.join("twin-servers/runtime/setup-database").read
    capability_check = 'require("./package.json").scripts["build:public-rsc"]'

    expect(script).to include("TCPSocket.new(\"127.0.0.1\", 11211)")
    expect(script.scan(/^\s*memcached -d -l 127\.0\.0\.1$/).length).to eq(1)
    expect(script.index("TCPSocket.new")).to be < script.index("memcached -d -l 127.0.0.1")
    expect(script.index("memcached -d -l 127.0.0.1")).to be < script.index("bundle exec rails db:reset")
    expect(script.index("bundle exec rails db:reset")).to be < script.index("npm run setup")
    expect(script.index("npm run setup")).to be < script.index(capability_check)
    expect(script.index(capability_check)).to be < script.index("npm run build:public-rsc")
    expect(script.index("npm run build:public-rsc")).to be < script.index("bundle exec rails assets:precompile")
  end

  it "keeps orchestration generic and defers benchmark catalogs" do
    config = root.join("abtests.config.ts").read
    readiness = root.join("twin-servers/wait-for-product").read

    expect(config).to include('command: "/shakaperf-twin/setup-database"')
    expect(config).to include('dockerfile: "twin-servers/Dockerfile"')
    expect(config).not_to include("setup-products", "testPathPattern", "numberOfMeasurements")
    expect(readiness).to include("/healthcheck", "Timed out waiting for")
    expect(readiness).not_to include("O365IT", "o365itpros", "/l/")
  end

  it "keeps unsupported renderers alive without restart loops" do
    procfile = root.join("twin-servers/Procfile").read
    renderer = root.join("twin-servers/runtime/start-renderer").read

    expect(procfile).to include(
      'control-renderer: shaka-perf servers run-overmind-command control "/shakaperf-twin/start-renderer"',
      'experiment-renderer: shaka-perf servers run-overmind-command experiment "/shakaperf-twin/start-renderer"',
    )
    capability_check = 'require("./package.json").scripts["build:public-rsc"]'
    expect(renderer.index(capability_check)).to be < renderer.index('node_pids="$(pidof node')
    expect(renderer).to include("Skipping renderer:", "exec tail -f /dev/null")
  end

  it "proves same-key Memcached isolation in running twins" do
    skip "set SHAKAPERF_TWIN_RUNTIME=1 after starting both twins" unless ENV["SHAKAPERF_TWIN_RUNTIME"] == "1"

    key = "shakaperf-isolation-#{SecureRandom.hex(8)}"
    { "control-server" => %w[control experiment], "experiment-server" => %w[experiment control] }.each do |service, (own, other)|
      container = capture!("docker", "ps", "--filter", "label=com.docker.compose.service=#{service}", "--quiet").lines.first&.strip
      expect(container).not_to be_nil, "missing running #{service} container"

      ruby = [
        "key = #{key.inspect}",
        "Rails.cache.write(key, #{own.inspect})",
        "abort unless Rails.cache.read(key) == #{own.inspect}",
        "other = ActiveSupport::Cache::MemCacheStore.new(*ENV.fetch(\"MEMCACHE_SERVERS\").split(\",\"), namespace: #{"shakaperf-#{other}".inspect})",
        "abort unless other.read(key).nil?",
      ].join("; ")
      expect(system("docker", "exec", container, "bundle", "exec", "rails", "runner", ruby)).to be(true)
    end
  end

  def capture!(*command)
    stdout, stderr, status = Open3.capture3(*command)
    raise "#{command.join(" ")} failed: #{stderr}" unless status.success?

    stdout
  end
end
