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
    raise "A Product RSC renderer is already running on the configured port." if healthy?

    pid = Process.spawn(
      {
        "RAILS_ENV" => "test",
        "NODE_ENV" => "test",
        "RENDERER_PORT" => URI(ReactOnRailsPro.configuration.renderer_url).port.to_s,
        "RENDERER_PASSWORD" => ReactOnRailsPro.configuration.renderer_password,
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
      status = Process.waitpid(pid, Process::WNOHANG)
      raise "Product RSC renderer exited before it became healthy." if status
      return if healthy?

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
  Capybara.register_driver :product_rsc_chrome do |app|
    options = Selenium::WebDriver::Chrome::Options.new
    options.add_preference("intl.accept_languages", "en-US")
    options.logging_prefs = { driver: "DEBUG" }

    if ENV["IN_DOCKER"] == "true"
      docker_browser_args.reject { _1.start_with?("--host-resolver-rules=") }.each { |arg| options.args << arg }
      options.args << "--window-size=1440,900"
    else
      options.add_emulation(device_metrics: { width: 1440, height: 900, touch: false })
    end
    options.args << "--host-resolver-rules=" \
                    "MAP *.test.gumroad.com 127.0.0.1,MAP test.gumroad.com 127.0.0.1," \
                    "MAP localhost ~NOTFOUND," \
                    "MAP js.stripe.com ~NOTFOUND,MAP *.stripe.network ~NOTFOUND," \
                    "MAP www.googletagmanager.com ~NOTFOUND"

    http_client = Selenium::WebDriver::Remote::Http::Default.new(open_timeout: 120, read_timeout: 120)
    Capybara::Selenium::Driver.new(app, browser: :chrome, http_client:, options:)
  end

  config.before(:each, :product_rsc_renderer, type: :system) do
    driven_by :product_rsc_chrome
  end

  config.around(:each, :product_rsc_renderer) do |example|
    ProductRscRenderer.with_running_renderer { example.run }
  end
end
