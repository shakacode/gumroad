# frozen_string_literal: true

require "pathname"
require "erb"
require "yaml"
require "active_support/core_ext/enumerable"

RSpec.describe "gumroad-rorp Control Plane contract" do
  def root
    Pathname.new(__dir__).join("../..").expand_path
  end

  def template_root
    root.join(".controlplane/templates")
  end

  def load_documents(name)
    YAML.safe_load_stream(template_root.join("#{name}.yml").read, aliases: true)
  end

  def workload(name)
    load_documents(name).find { |document| document["kind"] == "workload" }
  end

  it "fixes the app identity, region, and immutable image behavior" do
    config = YAML.safe_load(root.join(".controlplane/controlplane.yml").read, aliases: true)
    app = config.fetch("apps").fetch("gumroad-rorp")

    expect(config.fetch("allow_app_override_by_env")).to eq(false)
    expect(app.fetch("cpln_org")).to eq("shakacode-open-source-examples-staging")
    expect(app.fetch("default_location")).to eq("aws-us-east-2")
    expect(app.fetch("use_digest_image_ref")).to eq(true)
    expect(app.fetch("setup_app_templates")).to include("r2", "sidekiq", "renderer")
    expect(app.fetch("setup_app_templates")).not_to include("minio")
    expect(app.fetch("app_workloads")).to eq(["rails", "sidekiq", "renderer"])
    expect(app.fetch("additional_workloads")).to contain_exactly("mysql", "mongo", "redis", "elasticsearch", "memcached")
    expect(app.fetch("secrets_name")).to eq("gumroad-rorp-secrets")
    expect(app.fetch("secrets_policy_name")).to eq("gumroad-rorp-secrets-policy")
    expect(app.keys.grep(/shared/)).to be_empty
  end

  it "keeps surface and renderer transport settings explicit" do
    app_template = template_root.join("app-rorp.yml").read
    gvc = load_documents("app-rorp").fetch(0)
    env = gvc.dig("spec", "env").index_by { |entry| entry.fetch("name") }

    expect(env.dig("CUSTOM_DOMAIN", "value")).to eq("gumroad-rorp.reactonrails.com")
    expect(env.dig("GUMROAD_RENDERING_SURFACE", "value")).to eq("rorp")
    expect(env.dig("CONTROL_PLANE_BENCHMARK", "value")).to eq("true")
    expect(env.dig("BENCHMARK_SELLER_USERNAME", "value")).to eq("seller")
    expect(env.dig("SESSION_COOKIE_DOMAIN", "value")).to eq("")
    expect(env.dig("SESSION_COOKIE_SECURE", "value")).to eq("true")
    expect(env.dig("ANYCABLE_REDIS_URL", "value")).to eq("redis://redis.{{APP_NAME}}.cpln.local:6379/5")
    expect(env.dig("BENCHMARK_STORAGE_SERVICE", "value")).to eq("control_plane_benchmark")
    expect(env.dig("BENCHMARK_STORAGE_PREFIX", "value")).to eq("benchmarks/gumroad-rorp")
    expect(env.dig("BENCHMARK_STORAGE_PUBLIC_HOST", "value")).to eq("public-files.gumroad-rorp.reactonrails.com")
    expect(env.dig("BENCHMARK_STORAGE_S3_ENDPOINT", "value")).to eq("cpln://secret/{{APP_NAME}}-r2.endpoint")
    expect(env.dig("BENCHMARK_STORAGE_S3_BUCKET", "value")).to eq("cpln://secret/{{APP_NAME}}-r2.bucket")
    expect(env.dig("BENCHMARK_STORAGE_S3_REGION", "value")).to eq("auto")
    expect(env.dig("REACT_RENDERER_URL", "value")).to eq("http://renderer.{{APP_NAME}}.cpln.local:3800")
    expect(env.dig("RENDERER_PASSWORD", "value")).to eq("cpln://secret/{{APP_SECRETS}}.RENDERER_PASSWORD")
    expect(env).not_to include("AWS_S3_ENDPOINT", "AWS_DEFAULT_REGION", "PUBLIC_STORAGE_S3_BUCKET")
    expect(app_template).not_to include("devPassword")
  end

  it "uses only app-owned application credential references" do
    env = load_documents("app-rorp").fetch(0).dig("spec", "env").index_by { |entry| entry.fetch("name") }
    app_secret_keys = %w[
      SECRET_KEY_BASE DEVISE_SECRET_KEY STRONGBOX_GENERAL STRONGBOX_GENERAL_PASSWORD
      OBFUSCATE_IDS_CIPHER_KEY OBFUSCATE_IDS_NUMERIC_CIPHER_KEY RENDERER_PASSWORD REACT_ON_RAILS_PRO_LICENSE
    ]

    app_secret_keys.each do |key|
      expect(env.dig(key, "value")).to eq("cpln://secret/{{APP_SECRETS}}.#{key}")
    end
    expect(env.dig("DATABASE_PASSWORD", "value")).to eq("cpln://secret/{{APP_NAME}}-mysql.password")
    expect(env.dig("MONGO_DATABASE_PASSWORD", "value")).to eq("cpln://secret/{{APP_NAME}}-mongo.password")
    expect(env.dig("BENCHMARK_STORAGE_S3_ACCESS_KEY_ID", "value")).to eq("cpln://secret/{{APP_NAME}}-r2.access_key_id")
    expect(env.dig("BENCHMARK_STORAGE_S3_SECRET_ACCESS_KEY", "value")).to eq("cpln://secret/{{APP_NAME}}-r2.secret_access_key")
  end

  it "gives every runtime workload liveness and readiness probes" do
    %w[mysql mongo redis elasticsearch memcached rails sidekiq renderer].each do |name|
      container = workload(name).dig("spec", "containers").fetch(0)

      expect(container.fetch("cpu")).to be_a(String)
      expect(container.fetch("livenessProbe")).to be_a(Hash)
      expect(container.fetch("readinessProbe")).to be_a(Hash)
    end
  end

  it "runs the authenticated RSC renderer on internal HTTP/2" do
    renderer = workload("renderer")
    container = renderer.dig("spec", "containers").fetch(0)
    env = container.fetch("env").index_by { |entry| entry.fetch("name") }

    expect(renderer.dig("spec", "identityLink")).to eq("{{APP_IDENTITY_LINK}}")
    expect(container.fetch("inheritEnv")).to eq(false)
    expect(container.fetch("image")).to eq("{{APP_IMAGE_LINK}}")
    expect(container.fetch("args")).to eq(%w[node client/node-renderer.cjs])
    expect(container.fetch("ports")).to eq([{ "number" => 3800, "protocol" => "http2" }])
    expect(env.dig("RENDERER_PASSWORD", "value")).to eq("cpln://secret/{{APP_SECRETS}}.RENDERER_PASSWORD")
    expect(env.dig("RENDERER_HOST", "value")).to eq("0.0.0.0")
    expect(env.dig("RENDERER_PORT", "value")).to eq("3800")
    expect(container.dig("livenessProbe", "exec", "command")).to eq(%w[node scripts/check_renderer_health.cjs])
    expect(container.dig("readinessProbe", "exec", "command")).to eq(%w[node scripts/check_renderer_health.cjs])
    expect(root.join("scripts/check_renderer_health.cjs")).to exist
  end

  it "deploys the app image digest to the benchmark Sidekiq queues" do
    container = workload("sidekiq").dig("spec", "containers").fetch(0)

    expect(container.fetch("image")).to eq("{{APP_IMAGE_LINK}}")
    expect(container.fetch("args")).to eq(%w[bundle exec sidekiq -q critical -q default -q low -q mongo])
  end

  it "retains isolated single-node Elasticsearch data" do
    documents = load_documents("elasticsearch")
    volume = documents.find { |document| document["kind"] == "volumeset" }
    elasticsearch = workload("elasticsearch")
    container = elasticsearch.dig("spec", "containers").fetch(0)
    env = container.fetch("env").index_by { |entry| entry.fetch("name") }

    expect(volume.fetch("name")).to eq("{{APP_NAME}}-elasticsearch-vs")
    expect(volume.dig("spec", "snapshots", "createFinalSnapshot")).to eq(true)
    expect(elasticsearch.dig("spec", "type")).to eq("stateful")
    expect(elasticsearch.dig("spec", "securityOptions", "filesystemGroupId")).to eq(1000)
    expect(container.fetch("volumes")).to eq(
      [
        {
          "uri" => "cpln://volumeset/{{APP_NAME}}-elasticsearch-vs",
          "path" => "/usr/share/elasticsearch/data",
          "recoveryPolicy" => "retain",
        },
      ]
    )
    expect(env.dig("discovery.type", "value")).to eq("single-node")
  end

  it "keeps persistent state isolated and credentials outside templates" do
    %w[mysql mongo].each do |name|
      documents = load_documents(name)
      volume = documents.find { |document| document["kind"] == "volumeset" }
      policy = documents.find { |document| document["kind"] == "policy" }

      expect(documents).not_to include(a_hash_including("kind" => "secret"))
      expect(volume.dig("spec", "snapshots", "createFinalSnapshot")).to eq(true)
      expect(policy.fetch("targetLinks")).to eq(["//secret/{{APP_NAME}}-#{name}"])
    end

    expect(workload("rails").fetch("spec").fetch("type")).to eq("standard")
  end

  it "preserves the official Mongo entrypoint" do
    mongo = workload("mongo").dig("spec", "containers").fetch(0)

    expect(mongo).not_to have_key("command")
    expect(mongo.fetch("args")).to include("--bind_ip_all")
  end

  it "authenticates the benchmark Mongoid client" do
    env = {
      "MONGO_DATABASE_URL" => "mongo.internal:27017",
      "MONGO_DATABASE_NAME" => "gumroad_log_benchmark",
      "MONGO_DATABASE_USERNAME" => "gumroad",
      "MONGO_DATABASE_PASSWORD" => "secret",
    }
    env.each { |key, value| allow(ENV).to receive(:fetch).with(key).and_return(value) }
    allow(ENV).to receive(:fetch).with("MONGO_AUTH_SOURCE", "admin").and_return("admin")
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("CONTROL_PLANE_BENCHMARK").and_return("true")

    config = YAML.safe_load(ERB.new(root.join("config/mongoid.yml").read).result)
    options = config.dig("benchmark", "clients", "default", "options")

    expect(options).to include(
      "user" => "gumroad",
      "password" => "secret",
      "auth_source" => "admin",
    )
  end

  it "preserves unauthenticated Mongo for local benchmarks" do
    env = {
      "MONGO_DATABASE_URL" => "mongo:27017",
      "MONGO_DATABASE_NAME" => "gumroad_log_benchmark",
      "MONGO_DATABASE_USERNAME" => "username",
      "MONGO_DATABASE_PASSWORD" => "password",
    }
    env.each { |key, value| allow(ENV).to receive(:fetch).with(key).and_return(value) }
    allow(ENV).to receive(:fetch).with("MONGO_AUTH_SOURCE", "admin").and_return("admin")
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("CONTROL_PLANE_BENCHMARK").and_return(nil)

    config = YAML.safe_load(ERB.new(root.join("config/mongoid.yml").read).result)

    expect(config.dig("benchmark", "clients", "default")).not_to have_key("options")
  end

  it "grants only the app identity access to its R2 secret" do
    policy = load_documents("r2").sole

    expect(policy).to include(
      "kind" => "policy",
      "name" => "{{APP_NAME}}-r2-access",
      "targetKind" => "secret",
      "targetLinks" => ["//secret/{{APP_NAME}}-r2"],
    )
    expect(policy.fetch("bindings")).to eq(
      [
        {
          "permissions" => ["reveal"],
          "principalLinks" => ["{{APP_IDENTITY_LINK}}"],
        },
      ]
    )
  end

  it "shares the app identity and R2 environment with Rails and Sidekiq" do
    %w[rails sidekiq].each do |name|
      runtime = workload(name)
      container = runtime.dig("spec", "containers").fetch(0)

      expect(runtime.dig("spec", "identityLink")).to eq("{{APP_IDENTITY_LINK}}")
      expect(container.fetch("inheritEnv")).to eq(true)
    end
  end

  it "contains no benchmark MinIO topology" do
    surface = [root.join(".controlplane/controlplane.yml"), *root.join(".controlplane/templates").children]
      .filter_map { |path| path.read if path.file? }
      .join("\n")

    expect(template_root.join("minio.yml")).not_to exist
    expect(surface).not_to match(/minio/i)
  end

  it "documents the pre-provisioned R2 public-delivery contract" do
    guide = root.join("docs/control-plane-benchmark-deployment.md").read

    expect(guide).to include(
      "shaka-perf-demo-storage",
      "benchmarks/gumroad-rorp/",
      "public-files.gumroad-rorp.reactonrails.com",
      "S3_ENDPOINT",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "before `setup-app`",
    )
    expect(guide).to include("write/read/delete")
    expect(guide).to include("exact proposed branch head", "before merge")
    expect(guide).to include("the existing `AWS_S3_*` local MinIO configuration is unchanged")
    expect(guide).to include("gumroad-rorp-secrets", "operator-supplied")
    expect(guide).not_to include("Rails proxies media", "fixture media is proxied by Rails")
    expect(guide).not_to match(/benchmark MinIO|MinIO workload|MinIO volume/i)
    expect(guide).not_to match(/creates? (?:the )?(?:R2 )?bucket/i)
  end

  it "documents noninteractive template reapplication" do
    guide = root.join("docs/control-plane-benchmark-deployment.md").read
    section = guide[/## Reapply declarative configuration\n.*?(?=\n## )/m]

    expect(section).to include("--yes")
  end
end
