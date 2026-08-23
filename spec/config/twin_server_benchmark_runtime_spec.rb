# frozen_string_literal: true

require "yaml"

RSpec.describe "ShakaPerf benchmark runtime" do
  let(:compose) do
    YAML.safe_load_file(
      Rails.root.join("twin-servers/docker-compose.yml"),
      aliases: true,
    )
  end

  let(:benchmark_environment) do
    {
      "RAILS_ENV" => "benchmark",
      "RACK_ENV" => "benchmark",
      "NODE_ENV" => "production",
      "VITE_RUBY_MODE" => "production",
      "VITE_RUBY_ASSET_HOST" => "",
      "VITE_RUBY_AUTO_BUILD" => "false",
    }
  end

  it "configures both twin services for prebuilt benchmark assets" do
    %w[control-server experiment-server].each do |service|
      expect(compose.dig("services", service, "environment")).to include(benchmark_environment)
    end
  end

  it "bakes the benchmark environment into new twin images" do
    dockerfile = Rails.root.join("twin-servers/Dockerfile").read

    expect(dockerfile).to include(
      "ENV RAILS_ENV=benchmark \\",
      "RACK_ENV=benchmark \\",
      "NODE_ENV=production \\",
      "VITE_RUBY_MODE=production \\",
      "VITE_RUBY_ASSET_HOST= \\",
      "VITE_RUBY_AUTO_BUILD=false \\",
    )
  end

  it "overrides old image defaults when runtime scripts execute in place" do
    %w[start-rails setup-database setup-products].each do |script_name|
      script = Rails.root.join("twin-servers/runtime", script_name).read

      expect(script).to include(
        "export RAILS_ENV=benchmark",
        "export RACK_ENV=benchmark",
        "export NODE_ENV=production",
        "export VITE_RUBY_MODE=production",
        "export VITE_RUBY_ASSET_HOST=\"\"",
        "export VITE_RUBY_AUTO_BUILD=false",
      )
    end

    renderer = Rails.root.join("twin-servers/runtime/start-renderer").read
    expect(renderer).to include(
      "export RAILS_ENV=benchmark",
      "export RACK_ENV=benchmark",
      "export NODE_ENV=production",
    )
  end

  it "starts renderers only for twins with public RSC builds" do
    procfile = Rails.root.join("twin-servers/Procfile").read
    expect(procfile).to include(
      'control-renderer: shaka-perf servers run-overmind-command control "/shakaperf-twin/start-renderer"',
      'experiment-renderer: shaka-perf servers run-overmind-command experiment "/shakaperf-twin/start-renderer"',
    )

    renderer = Rails.root.join("twin-servers/runtime/start-renderer").read
    capability_check = 'require("./package.json").scripts["build:public-rsc"]'
    expect(renderer).to include(capability_check)
    expect(renderer.index(capability_check)).to be < renderer.index('node_pids="$(pidof node')
    expect(renderer).to include("Skipping renderer:", "exec tail -f /dev/null")
  end

  it "normally seeds and reindexes before loading the additional benchmark catalogs" do
    expected_mounts = [
      "../scripts/seed_native_product_page.rb:/shakaperf-fixtures/seed_native_product_page.rb:ro",
      "../scripts/seed_shakaperf_seller_profile.rb:/shakaperf-fixtures/seed_shakaperf_seller_profile.rb:ro",
      "../scripts/seed_shakaperf_discover.rb:/shakaperf-fixtures/seed_shakaperf_discover.rb:ro",
      "../public/native-product-page-fixture:/home/${USER}/app/public/native-product-page-fixture:ro",
    ]
    %w[control-server experiment-server].each do |service|
      expect(compose.dig("services", service, "volumes")).to include(*expected_mounts)
    end

    config = Rails.root.join("abtests.config.ts").read
    expect(config.index('command: "/shakaperf-twin/setup-database"')).to be <
      config.index('command: "/shakaperf-twin/setup-products"')

    database_commands = Rails.root.join("twin-servers/runtime/setup-database").read.lines.grep(/bundle exec rails/).map(&:strip)
    expect(database_commands).to eq(["DISABLE_SPRING=1 bundle exec rails db:reset"])

    product_commands = Rails.root.join("twin-servers/runtime/setup-products").read.lines.grep(/bundle exec rails/).map(&:strip)
    expect(product_commands).to eq(
      [
        "DISABLE_SPRING=1 bundle exec rails runner /shakaperf-fixtures/seed_native_product_page.rb",
        "DISABLE_SPRING=1 bundle exec rails runner /shakaperf-fixtures/seed_shakaperf_seller_profile.rb",
        "DISABLE_SPRING=1 bundle exec rails runner /shakaperf-fixtures/seed_shakaperf_discover.rb",
        'DISABLE_SPRING=1 bundle exec rails runner "DevTools.delete_all_indices_and_reindex_all"',
      ],
    )

    normal_seed_source = [Rails.root.join("db/seeds.rb"), *Rails.root.glob("db/seeds/**/*.rb")].map(&:read).join("\n")
    %w[seed_native_product_page seed_shakaperf_seller_profile seed_shakaperf_discover].each do |seed_name|
      expect(normal_seed_source).not_to include(seed_name)
    end
  end
end
