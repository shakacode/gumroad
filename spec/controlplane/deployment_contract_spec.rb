# frozen_string_literal: true

require "pathname"
require "erb"
require "yaml"
require "active_support/core_ext/enumerable"

RSpec.describe "gumroad-inertia Control Plane contract" do
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

  it "serves Vite assets from the stack's shared root origin" do
    env = load_documents("app-inertia").fetch(0).dig("spec", "env").to_h { |entry| [entry.fetch("name"), entry.fetch("value")] }

    expect(env.fetch("VITE_RUBY_ASSET_HOST")).to eq("#{env.fetch("BENCHMARK_PROTOCOL")}://#{env.fetch("CUSTOM_DOMAIN")}")
  end

  it "keeps each local seller and cart iframe on the same site with separate asset origins" do
    compose = YAML.safe_load(root.join("twin-servers/docker-compose.yml").read, aliases: true)

    %w[control experiment].each do |stack|
      env = compose.dig("services", "#{stack}-server", "environment")
      expect(env.fetch("BENCHMARK_HOST")).to eq("#{stack}.localhost")
      expect(env.fetch("VITE_RUBY_ASSET_HOST")).to eq("http://#{stack}.localhost:${#{stack.upcase}_PORT}")
    end
  end

  it "fixes the app identity, region, and immutable image behavior" do
    config = YAML.safe_load(root.join(".controlplane/controlplane.yml").read, aliases: true)
    app = config.fetch("apps").fetch("gumroad-inertia")

    expect(config.fetch("allow_app_override_by_env")).to eq(false)
    expect(app.fetch("cpln_org")).to eq("shakacode-open-source-examples-staging")
    expect(app.fetch("default_location")).to eq("aws-us-east-2")
    expect(app.fetch("use_digest_image_ref")).to eq(true)
    expect(app.fetch("setup_app_templates")).to include("r2", "sidekiq")
    expect(app.fetch("setup_app_templates")).not_to include("minio")
    expect(app.fetch("app_workloads")).to eq(["rails", "sidekiq"])
    expect(app.fetch("additional_workloads")).to contain_exactly("mysql", "dynamodb", "redis", "elasticsearch", "memcached")
    expect(app.fetch("secrets_name")).to eq("gumroad-inertia-secrets")
    expect(app.fetch("secrets_policy_name")).to eq("gumroad-inertia-secrets-policy")
    expect(app.keys.grep(/shared/)).to be_empty
  end

  it "keeps surface settings explicit and excludes renderer transport" do
    app_template = template_root.join("app-inertia.yml").read
    gvc = load_documents("app-inertia").fetch(0)
    env = gvc.dig("spec", "env").index_by { |entry| entry.fetch("name") }

    expect(env.dig("CUSTOM_DOMAIN", "value")).to eq("gumroad-inertia.reactonrails.com")
    expect(env.dig("GUMROAD_RENDERING_SURFACE", "value")).to eq("inertia")
    expect(env.dig("CONTROL_PLANE_BENCHMARK", "value")).to eq("true")
    expect(env.dig("BENCHMARK_SELLER_USERNAME", "value")).to eq("seller")
    expect(env.dig("SESSION_COOKIE_DOMAIN", "value")).to eq("")
    expect(env.dig("SESSION_COOKIE_SECURE", "value")).to eq("true")
    expect(env.dig("ANYCABLE_REDIS_URL", "value")).to eq("redis://redis.{{APP_NAME}}.cpln.local:6379/5")
    expect(env.dig("BENCHMARK_STORAGE_SERVICE", "value")).to eq("benchmark")
    expect(env.dig("BENCHMARK_STORAGE_PREFIX", "value")).to eq("benchmarks/gumroad-inertia")
    expect(env.dig("BENCHMARK_STORAGE_PUBLIC_HOST", "value")).to eq("public-files.gumroad-inertia.reactonrails.com")
    expect(env.dig("BENCHMARK_STORAGE_S3_ENDPOINT", "value")).to eq("cpln://secret/{{APP_NAME}}-r2.endpoint")
    expect(env.dig("BENCHMARK_STORAGE_S3_BUCKET", "value")).to eq("cpln://secret/{{APP_NAME}}-r2.bucket")
    expect(env.dig("BENCHMARK_STORAGE_S3_REGION", "value")).to eq("auto")
    expect(env.dig("DYNAMODB_ENDPOINT", "value")).to eq("http://dynamodb.{{APP_NAME}}.cpln.local:8000")
    expect(env.dig("DYNAMODB_TABLE_PREFIX", "value")).to eq("benchmark_")
    expect(env.dig("AWS_ACCESS_KEY_ID", "value")).to eq("benchmark")
    expect(env.dig("AWS_SECRET_ACCESS_KEY", "value")).to eq("benchmark")
    expect(env.dig("AWS_DEFAULT_REGION", "value")).to eq("us-east-1")
    expect(env).not_to include("AWS_S3_ENDPOINT", "PUBLIC_STORAGE_S3_BUCKET")
    expect(app_template).not_to match(/renderer|RSC_|RENDERER_/i)
  end

  it "uses only app-owned application credential references" do
    env = load_documents("app-inertia").fetch(0).dig("spec", "env").index_by { |entry| entry.fetch("name") }
    app_secret_keys = %w[
      SECRET_KEY_BASE DEVISE_SECRET_KEY STRONGBOX_GENERAL STRONGBOX_GENERAL_PASSWORD
      OBFUSCATE_IDS_CIPHER_KEY OBFUSCATE_IDS_NUMERIC_CIPHER_KEY REACT_ON_RAILS_PRO_LICENSE
    ]

    app_secret_keys.each do |key|
      expect(env.dig(key, "value")).to eq("cpln://secret/{{APP_SECRETS}}.#{key}")
    end
    expect(env.dig("DATABASE_PASSWORD", "value")).to eq("cpln://secret/{{APP_NAME}}-mysql.password")
    expect(env.dig("BENCHMARK_STORAGE_S3_ACCESS_KEY_ID", "value")).to eq("cpln://secret/{{APP_NAME}}-r2.access_key_id")
    expect(env.dig("BENCHMARK_STORAGE_S3_SECRET_ACCESS_KEY", "value")).to eq("cpln://secret/{{APP_NAME}}-r2.secret_access_key")
  end

  it "gives every runtime workload liveness and readiness probes" do
    %w[mysql dynamodb redis elasticsearch memcached rails sidekiq].each do |name|
      container = workload(name).dig("spec", "containers").fetch(0)

      expect(container.fetch("cpu")).to be_a(String)
      expect(container.fetch("livenessProbe")).to be_a(Hash)
      expect(container.fetch("readinessProbe")).to be_a(Hash)
    end
  end

  it "deploys the app image digest to the benchmark Sidekiq queues" do
    container = workload("sidekiq").dig("spec", "containers").fetch(0)

    expect(container.fetch("image")).to eq("{{APP_IMAGE_LINK}}")
    expect(container.fetch("args")).to eq(%w[bundle exec sidekiq -q critical -q default -q low])
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
    mysql_documents = load_documents("mysql")
    mysql_volume = mysql_documents.find { |document| document["kind"] == "volumeset" }
    mysql_policy = mysql_documents.find { |document| document["kind"] == "policy" }
    dynamodb_documents = load_documents("dynamodb")
    dynamodb_volume = dynamodb_documents.find { |document| document["kind"] == "volumeset" }

    expect(mysql_documents).not_to include(a_hash_including("kind" => "secret"))
    expect(mysql_volume.dig("spec", "snapshots", "createFinalSnapshot")).to eq(true)
    expect(mysql_policy.fetch("targetLinks")).to eq(["//secret/{{APP_NAME}}-mysql"])
    expect(dynamodb_documents).not_to include(a_hash_including("kind" => "secret"), a_hash_including("kind" => "policy"))
    expect(dynamodb_volume.dig("spec", "snapshots", "createFinalSnapshot")).to eq(true)
    expect(workload("rails").fetch("spec").fetch("type")).to eq("standard")
  end

  it "runs the current DynamoDB Local image with retained state" do
    dynamodb = workload("dynamodb")
    container = dynamodb.dig("spec", "containers").fetch(0)

    expect(dynamodb.dig("spec", "type")).to eq("stateful")
    expect(dynamodb.dig("spec", "securityOptions", "filesystemGroupId")).to eq(1000)
    expect(container.fetch("image")).to eq("amazon/dynamodb-local:3.3.1")
    expect(container.fetch("args")).to eq(%w[-jar DynamoDBLocal.jar -sharedDb -dbPath ./data])
    expect(container.fetch("volumes")).to contain_exactly(
      "uri" => "cpln://volumeset/{{APP_NAME}}-dynamodb-vs",
      "path" => "/home/dynamodblocal/data",
      "recoveryPolicy" => "retain",
    )
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
      "benchmarks/gumroad-inertia/",
      "public-files.gumroad-inertia.reactonrails.com",
      "S3_ENDPOINT",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "S3_BUCKET",
      "before `setup-app`",
    )
    expect(guide).to include("write/read/delete")
    expect(guide).to include("exact proposed branch head", "before merge")
    expect(guide).to include("the existing `AWS_S3_*` local MinIO configuration is unchanged")
    expect(guide).to include("gumroad-inertia-secrets", "operator-supplied")
    expect(guide).not_to include("shaka-perf-demo-storage")
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
