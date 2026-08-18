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
    %w[start-rails setup-products].each do |script_name|
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
end
