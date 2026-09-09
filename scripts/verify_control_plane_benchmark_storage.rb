# frozen_string_literal: true

require "net/http"
require "securerandom"
require "uri"

raise "Benchmark storage may only be verified in benchmark" unless Rails.env.benchmark?

service = ActiveStorage::Blob.service
raise "Benchmark R2 storage must be private" if service.public?

prefix = ENV.fetch("BENCHMARK_STORAGE_PREFIX")
public_host = ENV.fetch("BENCHMARK_STORAGE_PUBLIC_HOST")
probe_key = "release/storage-probe-#{SecureRandom.hex(12)}"
probe_body = "gumroad-inertia R2 storage probe\n"
probe_checksum = Base64.strict_encode64(Digest::MD5.digest(probe_body))
probe_uploaded = false

begin
  service.upload(probe_key, StringIO.new(probe_body), checksum: probe_checksum)
  probe_uploaded = true
  raise "Benchmark R2 storage probe object does not exist after upload" unless service.exist?(probe_key)
  raise "Benchmark R2 storage probe returned unexpected content" unless service.download(probe_key) == probe_body
  public_url = URI(service.url(probe_key))
  expected_public_url = URI::HTTPS.build(host: public_host, path: "/#{prefix}/#{probe_key}")
  raise "Benchmark R2 storage returned an unexpected public URL" unless public_url == expected_public_url

  public_response = Net::HTTP.get_response(public_url)
  unless public_response.code == "200" && public_response.body == probe_body
    raise "Benchmark R2 public delivery returned unexpected content"
  end

  service.delete(probe_key)
  raise "Benchmark R2 public object remained available after delete" unless Net::HTTP.get_response(public_url).code == "404"
  probe_uploaded = false
ensure
  service.delete(probe_key) if probe_uploaded
end

puts "Verified benchmark R2 API access and public delivery under #{prefix}"
