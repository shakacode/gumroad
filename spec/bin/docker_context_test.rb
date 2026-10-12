# frozen_string_literal: true

require "fileutils"
require "minitest/autorun"
require "open3"
require "tmpdir"

class DockerContextTest < Minitest::Test
  ROOT = File.expand_path("../..", __dir__)
  RUNTIME_FILES = %w[docker/web/server.sh docker/nginx/main.conf docker/nginx/nginx.conf
                     docker/nginx/run_nginx.sh].freeze
  BENCHMARK_FILES = %w[app/product.rb client/product.tsx .controlplane/entrypoint.sh
                       .controlplane/release_script.sh patches/package.patch package-lock.json
                       config/certs/AppleAppAttestRootCA.pem config/certs/AppleRootCA-G3.pem].freeze
  EXCLUDED_FILES = %w[.env.production secret.pem config/credentials/production.key node_modules/package.js
                      .node-renderer-bundles/cache .node-renderer-bundles.preseed.lock
                      public/vite/assets/stale.js spec/example.rb].freeze

  def setup
    skip "Set RUN_DOCKER_CONTEXT_TEST=true for native BuildKit context checks" unless ENV["RUN_DOCKER_CONTEXT_TEST"] == "true"
    @directory = Dir.mktmpdir("gumroad-docker-context")
    @context = "#{@directory}/context"
    FileUtils.mkdir_p(@context)
    [".dockerignore", ".controlplane/Dockerfile.dockerignore"].each do |path|
      next unless File.file?("#{ROOT}/#{path}")
      FileUtils.mkdir_p(File.dirname("#{@context}/#{path}"))
      FileUtils.cp("#{ROOT}/#{path}", "#{@context}/#{path}")
    end
    (RUNTIME_FILES + BENCHMARK_FILES + EXCLUDED_FILES).each do |path|
      FileUtils.mkdir_p(File.dirname("#{@context}/#{path}"))
      File.write("#{@context}/#{path}", "fixture: #{path}\n")
    end
  end

  def teardown
    FileUtils.remove_entry(@directory) if @directory
  end

  def test_ordinary_web_and_nginx_contexts_retain_runtime_files
    %w[docker/web/Dockerfile docker/nginx/Dockerfile].each do |recipe|
      output = export_context(recipe)
      RUNTIME_FILES.each { |path| assert File.file?("#{output}/#{path}"), "#{recipe}: missing #{path}" }
    end
  end

  def test_benchmark_context_retains_sources_and_public_certificates_without_local_inputs
    output = export_context(".controlplane/Dockerfile")
    BENCHMARK_FILES.each { |path| assert File.file?("#{output}/#{path}"), "missing #{path}" }
    (EXCLUDED_FILES + RUNTIME_FILES).each { |path| refute File.exist?("#{output}/#{path}"), "included #{path}" }
  end

  private
    def export_context(recipe)
      FileUtils.mkdir_p(File.dirname("#{@context}/#{recipe}"))
      # Exercise Docker's file selection without running the application recipe or exporting an image.
      File.write("#{@context}/#{recipe}", "FROM scratch\nCOPY . /\n")
      destination = "#{@directory}/#{recipe.tr('/', '-')}-output"
      output, error, status = Open3.capture3("docker", "buildx", "build", "--network=none",
                                             "--provenance=false", "--output", "type=local,dest=#{destination}",
                                             "--file", "#{@context}/#{recipe}", @context)
      assert status.success?, "#{output}\n#{error}"
      destination
    end
end
