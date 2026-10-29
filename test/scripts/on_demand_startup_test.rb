# frozen_string_literal: true

require "minitest/autorun"
require "open3"
require "socket"
require "tmpdir"
require "timeout"
require_relative "../../.controlplane/on_demand_startup"

class OnDemandStartupTest < Minitest::Test
  def test_waits_until_a_dependency_accepts_connections
    reservation = TCPServer.new("127.0.0.1", 0)
    port = reservation.addr[1]
    reservation.close
    waiter = Thread.new { OnDemandStartup.new(services: [["127.0.0.1", port]], timeout: 2, interval: 0.01).wait }
    sleep 0.05
    assert waiter.alive?, "Startup continued with a sleeping dependency"
    server = TCPServer.new("127.0.0.1", port)
    Timeout.timeout(2) { waiter.value }
  ensure
    waiter&.kill
    server&.close
  end

  def test_fails_instead_of_starting_when_a_dependency_stays_asleep
    server = TCPServer.new("127.0.0.1", 0)
    port = server.addr[1]
    server.close
    error = assert_raises(RuntimeError) do
      OnDemandStartup.new(services: [["127.0.0.1", port]], timeout: 0.05, interval: 0.01).wait
    end
    assert_match "Timed out", error.message
  end

  def test_waits_for_search_indices_to_recover_after_the_port_opens
    server = TCPServer.new("127.0.0.1", 0)
    statuses = Queue.new
    statuses << "red"
    statuses << "yellow"
    requests = Queue.new
    responder = Thread.new do
      2.times do
        client = server.accept
        requests << client.gets
        while (line = client.gets) && line != "\r\n"
        end
        body = JSON.generate(status: statuses.pop)
        client.write "HTTP/1.1 200 OK\r\nContent-Length: #{body.bytesize}\r\nConnection: close\r\n\r\n#{body}"
        client.close
      end
    end
    OnDemandStartup.new(services: [], elasticsearch: "http://127.0.0.1:#{server.addr[1]}", timeout: 2, interval: 0.01).wait
    assert_equal 2, requests.size
    assert_match "/_cluster/health", requests.pop
  ensure
    responder&.kill
    server&.close
  end

  def test_rejects_unbounded_timeouts
    [0, -1, Float::INFINITY].each do |timeout|
      assert_raises(ArgumentError) { OnDemandStartup.new(services: [], timeout:) }
    end
  end

  def test_failed_release_restores_on_demand_mode_and_preserves_the_failure
    with_fake_deployment_commands do |env, log|
      _, _, status = Open3.capture3(env, ".controlplane/deploy_on_demand.sh")
      assert_equal 42, status.exitstatus
      calls = File.readlines(log)
      wake = calls.index { |line| line.include?("minScale=1") }
      release = calls.index { |line| line.start_with?("cpflow deploy-image") }
      restore = calls.index { |line| line.include?("minScale=0") }
      assert wake && release && restore
      assert_operator wake, :<, release
      assert_operator release, :<, restore
    end
  end

  def test_refuses_to_modify_other_environments
    with_fake_deployment_commands do |env, log|
      _, _, status = Open3.capture3(env.merge("APP_NAME" => "production"), ".controlplane/deploy_on_demand.sh")
      assert_equal 1, status.exitstatus
      assert_empty Dir.glob(log)
    end
  end

  private
    def with_fake_deployment_commands
      Dir.mktmpdir do |dir|
        log = File.join(dir, "calls")
        %w[ruby cpln cpflow].each do |name|
          path = File.join(dir, name)
          File.write(path, <<~SH)
            #!/bin/sh
            echo "#{name} $*" >> "$DEPLOYMENT_TEST_LOG"
            if [ "#{name}" = cpflow ] && [ "$1" = deploy-image ]; then exit 42; fi
          SH
          File.chmod(0755, path)
        end
        yield({ "PATH" => "#{dir}:#{ENV.fetch('PATH')}", "DEPLOYMENT_TEST_LOG" => log,
                "APP_NAME" => "gumroad-rorp", "CPLN_ORG" => "shakacode-open-source-examples-staging" }, log)
      end
    end
end
