# frozen_string_literal: true

require "json"
require "net/http"
require "socket"

class OnDemandStartup
  def initialize(services:, elasticsearch: nil, timeout: 450, interval: 2)
    @services = services
    @elasticsearch = elasticsearch && URI(elasticsearch)
    @timeout = Float(timeout)
    @interval = interval
    raise ArgumentError, "Startup timeout must be positive and finite" unless @timeout.positive? && @timeout.finite?
  end

  def wait
    deadline = monotonic_time + @timeout
    loop do
      raise "Timed out waiting for demo dependencies" if monotonic_time >= deadline

      return if @services.all? { |host, port| listening?(host, port, deadline) } && search_ready?(deadline)

      sleep [@interval, [deadline - monotonic_time, 0].max].min
    end
  end

  private
    def monotonic_time
      Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end

    def listening?(host, port, deadline)
      remaining = deadline - monotonic_time
      return false unless remaining.positive?

      TCPSocket.new(host, port, connect_timeout: [remaining, 1].min).close
      true
    rescue SocketError, SystemCallError, IOError, Timeout::Error
      false
    end

    def search_ready?(deadline)
      return true unless @elasticsearch

      remaining = deadline - monotonic_time
      return false unless remaining.positive?

      uri = @elasticsearch.dup
      uri.path = "/_cluster/health"
      http = Net::HTTP.new(uri.host, uri.port, nil)
      http.use_ssl = uri.scheme == "https"
      http.open_timeout = http.read_timeout = [remaining, 2].min
      response = http.get(uri.request_uri)
      response.is_a?(Net::HTTPSuccess) && %w[green yellow].include?(JSON.parse(response.body)["status"])
    rescue SocketError, SystemCallError, IOError, Timeout::Error, JSON::ParserError
      false
    end
end

if $PROGRAM_NAME == __FILE__
  app = ENV.fetch("CPLN_GVC", ENV["BRANCH"])
  abort "Refusing startup outside the demo apps" unless %w[gumroad-rorp gumroad-inertia].include?(app)
  abort "Missing startup command" if ARGV.empty?

  services = { "mysql" => 3306, "dynamodb" => 8000, "redis" => 6379, "memcached" => 11211 }
  services["renderer"] = 3800 unless ARGV.include?("sidekiq")
  services = services.map { |name, port| ["#{name}.#{app}.cpln.local", port] }
  puts "Waiting for demo dependencies before starting #{ARGV.first}"
  $stdout.flush
  OnDemandStartup.new(services:, elasticsearch: ENV.fetch("ELASTICSEARCH_HOST")).wait
  exec(*ARGV)
end
