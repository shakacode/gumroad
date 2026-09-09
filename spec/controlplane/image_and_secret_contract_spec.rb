# frozen_string_literal: true

require "pathname"
require "json"

RSpec.describe "Control Plane image and secret bootstrap" do
  def root
    Pathname.new(__dir__).join("../..").expand_path
  end

  it "keeps build placeholders out of persisted image environment" do
    dockerfile = root.join(".controlplane/Dockerfile").read
    env_blocks = dockerfile.scan(/^ENV .*?(?=\n\n|\z)/m).join("\n")

    expect(env_blocks).not_to match(/SECRET_KEY_BASE|DEVISE_SECRET_KEY|DATABASE_PASSWORD|STRONGBOX_GENERAL/)
    expect(env_blocks).not_to include("NODE_OPTIONS")
    expect(dockerfile).to include("NODE_OPTIONS=--max-old-space-size=4096")
    expect(dockerfile).to include("npm run setup", "npx vite build", "rails assets:precompile")
  end

  it "exports the build-only environment before running the complete asset build" do
    dockerfile = root.join(".controlplane/Dockerfile").read
    asset_build = dockerfile.match(
      /^RUN (?<environment>(?:.*\\\n)+\s*)npm run setup && \\\n\s+npx vite build && \\\n\s+bundle exec rails assets:precompile/,
    )

    expect(asset_build).not_to be_nil
    expect(asset_build[:environment]).to start_with("export NODE_OPTIONS=--max-old-space-size=4096")
    expect(asset_build[:environment]).to include("VITE_RUBY_ASSET_HOST=''")
    expect(asset_build[:environment]).to end_with("SKIP_BRANCH_APP_ES_INDEX_SETUP=true && \\\n    ")
  end

  it "installs asset build tools and applies repository patches" do
    dockerfile = root.join(".controlplane/Dockerfile").read
    package_lock = JSON.parse(root.join("package-lock.json").read)

    expect(package_lock.dig("packages", "node_modules/vite", "dev")).to eq(true)
    expect(package_lock.dig("packages", "node_modules/patch-package", "dev")).to eq(true)
    expect(root.join("patches/@inertiajs+core+2.3.13.patch")).to exist
    expect(dockerfile).to match(
      %r{COPY package\.json package-lock\.json \.npmrc \./\nCOPY patches \./patches\nRUN npm ci --include=dev},
    )
  end

  it "matches the production image's Bundler groups without packaging runtime env files" do
    definition = Bundler::Definition.build(root.join("Gemfile"), root.join("Gemfile.lock"), nil)
    dotenv = definition.dependencies.find { |dependency| dependency.name == "dotenv" }
    dockerfile = root.join(".controlplane/Dockerfile").read

    expect(dotenv.groups).to eq([:deployer])
    expect(dockerfile).to include("bundle config set without 'development test'")
    expect(dockerfile).not_to include("bundle config set without 'development test deployer'")
    expect(dockerfile).not_to match(/COPY .*\.env/)
  end

  it "keeps benchmark R2 build settings separate from local MinIO" do
    dockerfile = root.join(".controlplane/Dockerfile").read

    expect(dockerfile).to include(
      "BENCHMARK_STORAGE_SERVICE=benchmark",
      "BENCHMARK_STORAGE_S3_ENDPOINT=http://127.0.0.1:9000",
      "BENCHMARK_STORAGE_S3_ACCESS_KEY_ID=build-placeholder",
      "BENCHMARK_STORAGE_S3_SECRET_ACCESS_KEY=build-placeholder",
      "BENCHMARK_STORAGE_S3_REGION=auto",
      "BENCHMARK_STORAGE_S3_BUCKET=gumroad-inertia-public-storage",
      "BENCHMARK_STORAGE_PUBLIC_HOST=public-files.gumroad-inertia.reactonrails.com",
    )
    expect(dockerfile).not_to match(/^\s+AWS_S3_ENDPOINT=/)
  end

  it "keeps normal container boot free of migration and seed side effects" do
    entrypoint = root.join(".controlplane/entrypoint.sh").read

    expect(entrypoint).to include('exec "$@"')
    expect(entrypoint).not_to match(/db:|seed/)
  end

  it "excludes private key material from the image context" do
    patterns = root.join(".dockerignore").read.lines.map(&:strip)
    pem_exceptions = patterns.grep(%r{\A!.*\.pem\z})

    expect(patterns).to include("*.key", "*.pem", "*.p12", "*.pfx")
    expect(patterns).to include("config/master.key", "config/credentials/**/*.key")
    expect(pem_exceptions).to contain_exactly(
      "!config/certs/AppleAppAttestRootCA.pem",
      "!config/certs/AppleRootCA-G3.pem",
    )
  end

  it "excludes tracked runtime environment files from the image context" do
    patterns = root.join(".dockerignore").read.lines.map(&:strip)

    expect(root.join(".env.development")).to exist
    expect(root.join(".env.test")).to exist
    expect(patterns).to include(".env*")
    expect(patterns.grep(%r{\A!.*\.env})).to be_empty
  end

  it "keeps non-runtime development content out of the image context" do
    patterns = root.join(".dockerignore").read.lines.map(&:strip)

    expect(patterns).to include(
      "node_modules/",
      "qa-media/",
      "spec/",
      "test/",
      "docs/",
      ".agents/",
      ".autoreview/",
      ".buildkite/",
      ".claude/",
      ".github/",
      ".knapsack_pro/",
      ".vscode/",
      "coverage/",
      "docker/",
    )

    expect(patterns).not_to include("scripts/", "public/", "db/", "config/")
    expect(root.join("scripts/seed_native_product_page.rb")).to exist
    expect(root.join("public/native-product-page-fixture/residential-guide-preview-1.webp")).to exist
    expect(root.join("db/seeds/010_development_staging_test/taxonomy_create.rb")).to exist
    expect(root.join("config/certs/AppleAppAttestRootCA.pem")).to exist
  end

  it "prepares only fixed backing-service secrets and refuses implicit rotation" do
    bootstrap = root.join("bin/prepare-control-plane-benchmark-secrets").read

    expect(bootstrap).to include('APP_NAME="gumroad-inertia"')
    expect(bootstrap).to include("Secret ${secret_name} already exists; leaving database credentials unchanged.")
    expect(bootstrap).to include("Secret ${secret_name} already exists; leaving storage credentials unchanged.")
    expect(bootstrap).to include("create_mysql_secret", "create_mongo_secret", "create_r2_secret")
    expect(bootstrap).to include("S3_ENDPOINT", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "S3_BUCKET")
    expect(bootstrap).to match(/--entry "bucket=\$\{S3_BUCKET\}" \\\n+    >\/dev\/null/)
    expect(bootstrap).not_to match(/minio/i)
    expect(bootstrap).not_to include("shaka-perf-demo-storage")
    expect(bootstrap).not_to match(/^R2_BUCKET=/)
    expect(bootstrap).to include('cpln org get "$org"')
    expect(bootstrap).not_to include("CPLN_TOKEN must be set")
    expect(bootstrap).not_to match(/secret delete/)
    expect(bootstrap).not_to match(/create_bucket/)
    expect(bootstrap).not_to include('--entry "password=replace-with-real')
    expect(bootstrap).not_to include(
      "create_app_secret",
      "prepare_shared_license_policy",
      "gumroad-inertia-secrets",
    )
    expect(bootstrap).not_to match(/shared.*license/i)
  end

  it "serves WebP fixtures inline in every seed-supported environment" do
    %w[development test benchmark].each do |environment|
      expect(root.join("config/environments/#{environment}.rb").read).to include(
        'config.active_storage.content_types_allowed_inline += ["image/webp"]',
      )
    end
    expect(root.join("config/application.rb").read).not_to include("content_types_allowed_inline")
  end
end
