# frozen_string_literal: true

require "active_support"
require "active_support/core_ext/string/inquiry"
require "action_dispatch"
require "rack/cors"
require "rack/mock"
require "tmpdir"
require "fileutils"

RSpec.describe "benchmark static asset caching" do
  it "serves the same cache variant to seller pages and their root cart iframe" do
    Dir.mktmpdir do |public_dir|
      FileUtils.mkdir_p("#{public_dir}/vite")
      File.write("#{public_dir}/vite/shared.js", "window.sharedAssetLoaded = true;")
      stack = ActionDispatch::MiddlewareStack.new
      stack.use ActionDispatch::Static, public_dir, headers: {
        "Cache-Control" => "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin" => "*",
      }
      config = double(middleware: stack)
      stub_const("Rails", double(env: "benchmark".inquiry, application: double(config: config)))
      stub_const("VALID_CORS_ORIGINS", [])
      stub_const("VALID_API_REQUEST_HOSTS", [])
      load File.expand_path("../../config/initializers/cors.rb", __dir__)
      request = Rack::MockRequest.new(stack.build(->(_env) { [404, {}, []] }))

      ["http://seller.control.localhost:3100", "http://control.localhost:3100", nil].each do |origin|
        headers = origin ? { "HTTP_ORIGIN" => origin } : {}
        response = request.get("/vite/shared.js", headers)

        expect(response.status).to eq(200)
        expect(response.body).to eq("window.sharedAssetLoaded = true;")
        expect(response["access-control-allow-origin"]).to eq("*")
        expect(response["cache-control"]).to include("immutable")
        expect(response["vary"].to_s.downcase).not_to include("origin")
      end
    end
  end
end
