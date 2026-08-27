# frozen_string_literal: true

require "spec_helper"
require "active_storage/service/prefixed_s3_service"

RSpec.describe ActiveStorage::Service::PrefixedS3Service do
  subject(:service) do
    described_class.new(
      bucket: "shaka-perf-demo-storage",
      prefix: "benchmarks/gumroad-inertia/",
      access_key_id: "opaque-access-key",
      secret_access_key: "opaque-secret-key",
      endpoint: "https://account.r2.cloudflarestorage.com",
      region: "auto",
      force_path_style: true,
    )
  end

  let(:resource) { instance_double(Aws::S3::Resource) }
  let(:bucket) { instance_double(Aws::S3::Bucket) }

  before do
    allow(Aws::S3::Resource).to receive(:new).and_return(resource)
    allow(resource).to receive(:bucket).with("shaka-perf-demo-storage").and_return(bucket)
  end

  it "scopes object operations to the surface namespace" do
    object = instance_double(Aws::S3::Object, exists?: true)
    expect(bucket).to receive(:object).with("benchmarks/gumroad-inertia/blob-key").and_return(object)

    expect(service.exist?("blob-key")).to be(true)
  end

  it "scopes prefix deletion to the surface namespace" do
    objects = double
    expect(bucket).to receive(:objects).with(prefix: "benchmarks/gumroad-inertia/variants/").and_return(objects)
    expect(objects).to receive(:batch_delete!)

    service.delete_prefixed("variants/")
  end
end
