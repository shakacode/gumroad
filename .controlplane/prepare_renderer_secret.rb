# frozen_string_literal: true

require "json"
require "open3"
require "securerandom"

app = ENV.fetch("APP_NAME")
abort "Expected a benchmark app" unless %w[gumroad-inertia gumroad-rorp].include?(app)

org = ENV.fetch("CPLN_ORG")
secret_name = "#{app}-secrets"
output, _error, status = Open3.capture3("cpln", "secret", "reveal", secret_name, "--org", org, "-o", "json")
abort "Cannot read #{secret_name}" unless status.success?

secret = JSON.parse(output)
data = secret.fetch("data")
if data["RENDERER_PASSWORD"].to_s.empty?
  # Preserve the existing Rails keys and never rotate a configured renderer password.
  data["RENDERER_PASSWORD"] = SecureRandom.hex(32)
  payload = secret.slice("kind", "name", "description", "tags", "type", "version").merge("data" => data)
  _output, _error, status = Open3.capture3("cpln", "apply", "--org", org, "-f", "-", stdin_data: payload.to_json)
  abort "Cannot add renderer password to #{secret_name}" unless status.success?
  puts "Added renderer password to #{secret_name}"
else
  puts "Renderer password already configured for #{secret_name}"
end
