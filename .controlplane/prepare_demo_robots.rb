# frozen_string_literal: true

require "json"
require "open3"

app = ENV.fetch("APP_NAME")
org = ENV.fetch("CPLN_ORG")
abort "Refusing domain changes outside the demo apps" unless org == "shakacode-open-source-examples-staging" && %w[gumroad-rorp gumroad-inertia].include?(app)

output, error, status = Open3.capture3("cpln", "domain", "get", "--org", org, "-o", "json")
abort error unless status.success?
rails_link = "/org/#{org}/gvc/#{app}/workload/rails"
robots_link = "/org/#{org}/gvc/#{app}/workload/robots"
JSON.parse(output).fetch("items").each do |domain|
  changed = false
  domain.fetch("spec").fetch("ports").each do |port|
    routes = port.fetch("routes", [])
    next unless routes.any? { |route| route["workloadLink"] == rails_link }
    next if routes.any? { |route| route["prefix"] == "/robots.txt" && route["workloadLink"] == robots_link }
    abort "Existing robots route needs manual review" if routes.any? { |route| route["prefix"] == "/robots.txt" }

    routes.unshift("prefix" => "/robots.txt", "workloadLink" => robots_link)
    changed = true
  end
  next unless changed

  resource = domain.slice("kind", "name", "description", "tags", "spec")
  _, error, status = Open3.capture3("cpln", "rest", "put", "/org/#{org}/domain/#{domain.fetch('name')}", "-f", "-", "-o", "json", stdin_data: JSON.generate(resource))
  abort error unless status.success?
  puts "Configured independent robots route for #{domain.fetch('name')}"
end
