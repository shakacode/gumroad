# frozen_string_literal: true

require "open3"

module ProductRscRenderer
  HEALTH_CHECK_TIMEOUT = 10.seconds
  HEALTH_CHECK_SCRIPT = <<~JAVASCRIPT.freeze
    const client = require("node:http2").connect("http://127.0.0.1:#{URI(ReactOnRailsPro.configuration.renderer_url).port}");
    const request = client.request({ ":path": "/health" });
    const fail = () => { client.close(); process.exit(1); };
    client.on("error", fail);
    request.on("error", fail);
    request.on("response", (headers) => {
      client.close();
      process.exit(headers[":status"] === 200 ? 0 : 1);
    });
    request.end();
    setTimeout(fail, 1000).unref();
  JAVASCRIPT

  module_function

  def with_running_renderer
    WebMock.disable!
    pid = Process.spawn(
      {
        "RAILS_ENV" => "test",
        "NODE_ENV" => "test",
        "RENDERER_PORT" => URI(ReactOnRailsPro.configuration.renderer_url).port.to_s,
        "RENDERER_PASSWORD" => "devPassword",
        "RENDERER_WORKERS_COUNT" => "1",
      },
      "node",
      Rails.root.join("client/node-renderer.cjs").to_s,
      out: File::NULL,
      err: File::NULL,
    )

    wait_until_healthy(pid)
    yield
  ensure
    stop(pid)
    WebMock.enable!
  end

  def wait_until_healthy(pid)
    deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + HEALTH_CHECK_TIMEOUT

    loop do
      return if healthy?

      status = Process.waitpid(pid, Process::WNOHANG)
      raise "Product RSC renderer exited before it became healthy." if status
      raise "Product RSC renderer did not become healthy." if Process.clock_gettime(Process::CLOCK_MONOTONIC) >= deadline

      sleep 0.1
    end
  end

  def healthy?
    _output, status = Open3.capture2("node", "-e", HEALTH_CHECK_SCRIPT)
    status.success?
  end

  def stop(pid)
    return unless pid

    Process.kill("TERM", pid)
    Process.wait(pid)
  rescue Errno::ECHILD, Errno::ESRCH
    nil
  end
end

RSpec.configure do |config|
  config.around(:each, :product_rsc_renderer) do |example|
    ProductRscRenderer.with_running_renderer { example.run }
  end
end
