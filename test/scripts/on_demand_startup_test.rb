# frozen_string_literal: true

require "minitest/autorun"
require "open3"
require "socket"
require "tmpdir"
require "timeout"
require "yaml"
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
      [{ "APP_NAME" => "production" }, { "CPLN_ORG" => "another-org" }].each do |override|
        _, _, status = Open3.capture3(env.merge(override), ".controlplane/deploy_on_demand.sh")
        assert_equal 1, status.exitstatus
        assert_empty Dir.glob(log)
      end
    end
  end

  def test_successful_release_restores_on_demand_mode
    with_fake_deployment_commands do |env, log|
      _, _, status = Open3.capture3(env.merge("DEPLOYMENT_TEST_EXIT_CODE" => "0"), ".controlplane/deploy_on_demand.sh")
      assert status.success?
      assert_includes File.readlines(log).last, "minScale=0"
      assert File.readlines(log).any? { |line| line.include?("--preserve-existing-runtime") }
    end
  end

  def test_deployment_preflight_rejects_legacy_workloads
    Dir.mktmpdir do |dir|
      state = File.join(dir, "state.json")
      cpln = File.join(dir, "cpln")
      File.write(cpln, "#!/bin/sh\n[ \"$1 $2\" = 'workload get' ] || exit 91\ncat \"$MIGRATION_TEST_STATE\"\n")
      File.chmod(0755, cpln)
      env = { "PATH" => "#{dir}:#{ENV.fetch('PATH')}", "MIGRATION_TEST_STATE" => state,
              "APP_NAME" => "gumroad-inertia", "CPLN_ORG" => "shakacode-open-source-examples-staging" }
      resources = %w[rails sidekiq redis].map do |name|
        types = { "rails" => "serverless", "redis" => "stateful", "sidekiq" => "standard" }
        { name:, spec: { type: types.fetch(name),
                         containers: [{ name:, args: ["ruby", ".controlplane/on_demand_startup.rb"] }] } }
      end
      File.write(state, JSON.generate(items: resources))
      _, _, status = Open3.capture3(env, "ruby", ".controlplane/check_on_demand_migration.rb")
      assert status.success?
      resources.first[:spec][:type] = "standard"
      resources.first[:spec][:containers].first[:args] = []
      File.write(state, JSON.generate(items: resources))
      _, error, status = Open3.capture3(env, "ruby", ".controlplane/check_on_demand_migration.rb")
      assert_equal 1, status.exitstatus
      assert_match "one-time image and workload migration", error
    end
  end

  def test_startup_cli_rejects_other_apps_before_connecting
    _, error, status = Open3.capture3({ "CPLN_GVC" => "production" }, "ruby", ".controlplane/on_demand_startup.rb", "true")
    assert_equal 1, status.exitstatus
    assert_match "Refusing startup outside the demo apps", error
  end

  def test_release_does_not_modify_data_before_dependency_readiness
    Dir.mktmpdir do |dir|
      Dir.mkdir(File.join(dir, "bin"))
      ruby = File.join(dir, "bin/ruby")
      File.write(ruby, <<~SH)
        #!/bin/sh
        if [ "$1" = .controlplane/on_demand_startup.rb ]; then
          echo wait >> "$RELEASE_TEST_LOG"
          exit "$RELEASE_WAIT_STATUS"
        fi
      SH
      rails = File.join(dir, "bin/rails")
      File.write(rails, "#!/bin/sh\necho \"rails $*\" >> \"$RELEASE_TEST_LOG\"\n")
      [ruby, rails].each { |path| File.chmod(0755, path) }
      log = File.join(dir, "calls")
      env = { "PATH" => "#{dir}/bin:#{ENV.fetch('PATH')}", "RELEASE_TEST_LOG" => log, "RELEASE_WAIT_STATUS" => "17",
              "CPLN_GVC" => "gumroad-rorp", "GUMROAD_RENDERING_SURFACE" => "rorp" }
      script = File.expand_path("../../.controlplane/release_script.sh", __dir__)
      _, _, status = Open3.capture3(env, script, chdir: dir)
      assert_equal 1, status.exitstatus
      assert_equal ["wait\n"], File.readlines(log)
    end
  end

  def test_scaling_contract_allows_workers_to_drain_before_backing_services_sleep
    resources = Dir[File.expand_path("../../.controlplane/templates/*.yml", __dir__)].flat_map do |path|
      YAML.load_stream(File.read(path))
    end
    workloads = resources.select { |resource| resource["kind"] == "workload" }
    autoscaling = workloads.to_h { |resource| [resource["name"], resource.dig("spec", "defaultOptions", "autoscaling")] } # -- Standalone configuration test.
    dependents = autoscaling.reject { |name, _| name == "rails" }
    assert dependents.values.all? { |options| options["minScale"].zero? && options["metric"] == "keda" }
    assert_equal 1, dependents.values.map { |options| options.dig("keda", "triggers") }.uniq.length
    worker_cooldown = autoscaling.dig("sidekiq", "keda", "cooldownPeriod")
    %w[mysql dynamodb elasticsearch memcached].each do |name|
      assert_operator autoscaling.dig(name, "keda", "cooldownPeriod") - worker_cooldown, :>=, 90
    end
    assert_operator autoscaling.dig("redis", "keda", "cooldownPeriod"), :>, autoscaling.dig("mysql", "keda", "cooldownPeriod")
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
            if [ "#{name}" = cpflow ] && [ "$1" = deploy-image ]; then exit "${DEPLOYMENT_TEST_EXIT_CODE:-42}"; fi
          SH
          File.chmod(0755, path)
        end
        yield({ "PATH" => "#{dir}:#{ENV.fetch('PATH')}", "DEPLOYMENT_TEST_LOG" => log,
                "APP_NAME" => "gumroad-rorp", "CPLN_ORG" => "shakacode-open-source-examples-staging" }, log)
      end
    end
end
