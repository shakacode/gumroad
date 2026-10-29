# frozen_string_literal: true

require "json"
require "open3"

app = ENV.fetch("APP_NAME")
org = ENV.fetch("CPLN_ORG")
abort "Refusing configuration outside the demo apps" unless %w[gumroad-rorp gumroad-inertia].include?(app)
abort "Refusing configuration outside demo staging" unless org == "shakacode-open-source-examples-staging"

_, status = Open3.capture2e("cpln", "secret", "get", "gumroad-on-demand-metrics", "--org", org, "-o", "json")
abort "Provision the readMetrics-only autoscaling credential before deploying" unless status.success?

resource = {
  kind: "secret", name: "#{app}-on-demand-startup", type: "opaque",
  data: { payload: File.read(File.join(__dir__, "on_demand_startup.rb")) }
}
_, status = Open3.capture2e("cpln", "apply", "-f", "-", "--org", org, "-o", "json", stdin_data: JSON.generate(resource))
abort "Failed to publish the demo startup script" unless status.success?
puts "Prepared #{app} startup script"
