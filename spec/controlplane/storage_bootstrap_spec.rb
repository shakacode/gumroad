# frozen_string_literal: true

require "spec_helper"
require "aws-sdk-s3"
require "pathname"
require_relative "../../app/helpers/cdn_url_helper"

RSpec.describe "Control Plane benchmark storage verification" do
  def root
    Pathname.new(__dir__).join("../..").expand_path
  end

  def run_verifier(service)
    allow(Rails).to receive(:env).and_return(double(benchmark?: true))
    allow(ActiveStorage::Blob).to receive(:service).and_return(service)

    original_prefix = ENV["BENCHMARK_STORAGE_PREFIX"]
    ENV["BENCHMARK_STORAGE_PREFIX"] = "benchmarks/gumroad-inertia"
    load root.join("scripts/verify_control_plane_benchmark_storage.rb")
  ensure
    ENV["BENCHMARK_STORAGE_PREFIX"] = original_prefix
  end

  it "verifies private write, existence, read, and delete access through Active Storage" do
    service = double
    checksum = Base64.strict_encode64(Digest::MD5.digest("gumroad-inertia R2 storage probe\n"))
    expect(service).to receive(:public?).ordered.and_return(false)
    expect(service).to receive(:upload).with(
      "release/storage-probe",
      kind_of(StringIO),
      checksum:,
    ).ordered
    expect(service).to receive(:exist?).with("release/storage-probe").ordered.and_return(true)
    expect(service).to receive(:download).with("release/storage-probe").ordered.and_return("gumroad-inertia R2 storage probe\n")
    expect(service).to receive(:delete).with("release/storage-probe").ordered

    run_verifier(service)
  end

  it "deletes the probe and fails closed when R2 returns unexpected content" do
    service = double(public?: false, upload: nil, exist?: true, download: "wrong")
    expect(service).to receive(:delete).with("release/storage-probe")

    expect { run_verifier(service) }.to raise_error("Benchmark R2 storage probe returned unexpected content")
  end

  it "fails before upload when the configured service is public" do
    service = double(public?: true)
    expect(service).not_to receive(:upload)

    expect { run_verifier(service) }.to raise_error("Benchmark R2 storage must be private")
  end

  it "keeps object storage private behind the Rails proxy" do
    benchmark_config = root.join("config/environments/benchmark.rb").read
    storage_config = root.join("config/storage.yml").read

    expect(benchmark_config).to include("config.active_storage.resolve_model_to_route = :rails_storage_proxy")
    expect(storage_config).to match(
      /benchmark:.*?service: PrefixedS3.*?endpoint: <%= GlobalConfig\.get\("BENCHMARK_STORAGE_S3_ENDPOINT"\) %>.*?access_key_id: <%= GlobalConfig\.get\("BENCHMARK_STORAGE_S3_ACCESS_KEY_ID"\) %>.*?secret_access_key: <%= GlobalConfig\.get\("BENCHMARK_STORAGE_S3_SECRET_ACCESS_KEY"\) %>.*?region: <%= GlobalConfig\.get\("BENCHMARK_STORAGE_S3_REGION", "auto"\) %>.*?bucket: <%= GlobalConfig\.get\("BENCHMARK_STORAGE_S3_BUCKET"\) %>.*?public: false.*?force_path_style: true.*?prefix: <%= ENV\.fetch\("BENCHMARK_STORAGE_PREFIX", "benchmarks\/gumroad-inertia"\) %>/m,
    )
  end

  it "preserves the existing local MinIO path independently of benchmark R2" do
    aws_initializer = root.join("config/initializers/aws.rb").read
    benchmark_environment = root.join("config/environments/benchmark.rb").read
    control_plane_app = root.join(".controlplane/templates/app-inertia.yml").read
    signed_urls = root.join("app/helpers/signed_url_helper.rb").read
    storage_config = root.join("config/storage.yml").read

    expect(aws_initializer).to include(
      'USING_MINIO = AWS_S3_ENDPOINT.present? && !AWS_S3_ENDPOINT.include?("amazonaws.com")',
      "# Support for MinIO in development and test environments",
      "aws_config[:ssl_verify_peer] = false if USING_MINIO",
    )
    expect(signed_urls).to include("if USING_MINIO", "minio_presigned_url")
    expect(storage_config).to match(
      /# MinIO for development\ndevelopment:.*?endpoint: <%= GlobalConfig\.get\("AWS_S3_ENDPOINT"\) %>.*?region: us-east-1.*?public: true/m,
    )
    expect(benchmark_environment).to include(
      'config.active_storage.service = ENV.fetch("BENCHMARK_STORAGE_SERVICE", "development").to_sym',
    )
    expect(control_plane_app).to match(
      /- name: BENCHMARK_STORAGE_SERVICE\n\s+value: benchmark/,
    )
  end

  it "emits a browser-reachable Rails path for benchmark attachments" do
    attachment = double
    route_helpers = double
    allow(route_helpers).to receive(:rails_storage_proxy_path).with(attachment, only_path: true).and_return(
      "/rails/active_storage/blobs/proxy/signed-id/fixture.png"
    )
    stub_const("Rails", double(env: double(benchmark?: true), application: double(routes: double(url_helpers: route_helpers))))
    helper = Class.new { include CdnUrlHelper }.new

    expect(helper.storage_url_for(attachment)).to eq("/rails/active_storage/blobs/proxy/signed-id/fixture.png")
  end

  it "routes seeded avatars, previews, and thumbnails through the storage URL helper" do
    expect(root.join("app/models/user.rb").read).to include("storage_url_for(avatar)", "storage_url_for(variant)")
    expect(root.join("app/models/asset_preview.rb").read).to include("storage_url_for(variant)", "storage_url_for(file)")
    expect(root.join("app/models/thumbnail.rb").read).to include("storage_url_for(thumbnail_variant)", "storage_url_for(file)")
  end
end
