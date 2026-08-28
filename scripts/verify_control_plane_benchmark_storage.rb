# frozen_string_literal: true

raise "Benchmark storage may only be verified in benchmark" unless Rails.env.benchmark?

service = ActiveStorage::Blob.service
raise "Benchmark R2 storage must be private" if service.public?

prefix = ENV.fetch("BENCHMARK_STORAGE_PREFIX")
probe_key = "release/storage-probe"
probe_body = "gumroad-rorp R2 storage probe\n"
probe_checksum = Base64.strict_encode64(Digest::MD5.digest(probe_body))
probe_uploaded = false

begin
  service.upload(probe_key, StringIO.new(probe_body), checksum: probe_checksum)
  probe_uploaded = true
  raise "Benchmark R2 storage probe object does not exist after upload" unless service.exist?(probe_key)
  raise "Benchmark R2 storage probe returned unexpected content" unless service.download(probe_key) == probe_body
ensure
  service.delete(probe_key) if probe_uploaded
end

puts "Verified private benchmark R2 storage access under #{prefix}"
