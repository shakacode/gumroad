# frozen_string_literal: true

require "json"
require "open3"

app = ENV.fetch("APP_NAME")
org = ENV.fetch("CPLN_ORG")
abort "Refusing inspection outside demo staging" unless org == "shakacode-open-source-examples-staging" && %w[gumroad-rorp gumroad-inertia].include?(app)

output, error, status = Open3.capture3("cpln", "workload", "get", "rails", "sidekiq", "redis", "--org", org, "--gvc", app, "-o", "json")
warn error unless error.empty?
abort "Cannot verify the existing on-demand migration" unless status.success?
workloads = JSON.parse(output).fetch("items").to_h { |workload| [workload.fetch("name"), workload] } # rubocop:disable Rails/IndexBy -- This preflight runs without Rails.
migrated = workloads.dig("rails", "spec", "type") == "serverless" && workloads.dig("redis", "spec", "type") == "stateful"
redis = workloads.dig("redis", "spec", "containers")&.find { |item| item["name"] == "redis" }
migrated &&= redis&.fetch("volumes", [])&.any? do |volume|
  volume["path"] == "/data" && volume["uri"] == "cpln://volumeset/#{app}-redis-vs" && volume["recoveryPolicy"] == "retain"
end
migrated &&= %w[rails sidekiq].all? do |name|
  container = workloads.dig(name, "spec", "containers")&.find { |item| item["name"] == name }
  container&.fetch("args", [])&.first(2) == ["ruby", ".controlplane/on_demand_startup.rb"]
end
abort "Complete the one-time image and workload migration before deploying on-demand templates" unless migrated
puts "Verified existing on-demand migration for #{app}"
