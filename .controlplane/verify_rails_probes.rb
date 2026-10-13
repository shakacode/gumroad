# frozen_string_literal: true

require "json"
require "open3"
require "optparse"

module ControlPlaneRailsProbes
  ORG = "shakacode-open-source-examples-staging"
  APPS = %w[gumroad-inertia gumroad-rorp].freeze

  def self.verify!(workload)
    raise "Expected the Rails workload" unless workload.is_a?(Hash) && workload["name"] == "rails"

    spec = workload["spec"]
    containers = spec.is_a?(Hash) && spec["containers"]
    raise "Expected Rails containers" unless containers.is_a?(Array)

    rails = containers.select { |container| container.is_a?(Hash) && container["name"] == "rails" }
    raise "Expected exactly one Rails container" unless rails.length == 1

    %w[livenessProbe readinessProbe].each do |name|
      probe = rails.first[name]
      request = probe.is_a?(Hash) && probe["httpGet"]
      unless request.is_a?(Hash) && request["path"] == "/healthcheck" && request["port"] == 3000 &&
             [nil, "HTTP"].include?(request["scheme"]) && (probe.keys & %w[exec grpc tcpSocket]).empty?
        raise "Rails #{name} must use HTTP /healthcheck on port3000"
      end
      headers = request["httpHeaders"]
      unless headers.is_a?(Array) && headers.all? { |header| header.is_a?(Hash) && header["name"].is_a?(String) && header["value"].is_a?(String) }
        raise "Rails #{name} must supply unambiguous probe headers"
      end
      forwarded = headers.select { |header| header["name"].upcase.tr("-", "_") == "X_FORWARDED_PROTO" }
      unless forwarded.length == 1 && forwarded.first["name"].casecmp?("X-Forwarded-Proto") && forwarded.first["value"] == "https"
        raise "Rails #{name} requires exactly one X-Forwarded-Proto:https header; reconcile probes before deployment"
      end
    end
    true
  end
end

if $PROGRAM_NAME == __FILE__
  begin
    options = {}
    OptionParser.new do |parser|
      parser.on("--app APP") { |value| options[:app] = value }
      parser.on("--org ORG") { |value| options[:org] = value }
    end.parse!
    raise "Expected only --app and --org" unless ARGV.empty?
    raise "Expected a benchmark app" unless ControlPlaneRailsProbes::APPS.include?(options[:app])
    raise "Expected the benchmark organization" unless options[:org] == ControlPlaneRailsProbes::ORG

    output, _, status = Open3.capture3("cpln", "workload", "get", "rails", "--org", options[:org],
                                       "--gvc", options[:app], "--output", "json")
    raise "Cannot read Rails probe configuration" unless status.success?

    workload = begin
      JSON.parse(output)
    rescue JSON::ParserError
      raise "Rails workload did not return valid JSON"
    end
    ControlPlaneRailsProbes.verify!(workload)
    puts "Verified Rails probe configuration for #{options[:app]}"
  rescue StandardError => error
    warn error.message
    exit 1
  end
end
