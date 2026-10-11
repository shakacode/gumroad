# frozen_string_literal: true

require "minitest/autorun"
require "fileutils"
require "active_support/core_ext/enumerable"
load File.expand_path("../../bin/deploy-control-plane-benchmark", __dir__)

class VerifiedBenchmarkDeploymentTest < Minitest::Test
  Success = Struct.new(:success?)
  DIGEST = "sha256:#{'a' * 64}"

  def setup
    @directory = Dir.mktmpdir
    @root = "#{@directory}/source"
    @manifest = "#{@directory}/build.json"
    Dir.mkdir(@root)
    git("init", "-q")
    git("config", "core.hooksPath", "/dev/null")
    git("config", "user.name", "Fixture")
    git("config", "user.email", "fixture@example.invalid")
    git("remote", "add", "origin", "https://github.com/shakacode/gumroad.git")
    %w[.agents/bin/setup .agents/bin/test .agents/bin/validate .controlplane/Dockerfile
       .controlplane/controlplane.yml .controlplane/release_script.sh .controlplane/entrypoint.sh
       config/environments/benchmark.rb scripts/configure_control_plane_product_page.rb].each do |path|
      FileUtils.mkdir_p(File.dirname("#{@root}/#{path}"))
      File.write("#{@root}/#{path}", "fixture\n")
    end
    File.write("#{@root}/canonical.txt", "committed source\n")
    File.write("#{@root}/.gitignore", "ignored.txt\n")
    git("add", "-f", ".")
    git("commit", "-qm", "Fixture source")
    @source = git("rev-parse", "HEAD").strip
    @image = "gumroad-inertia:7_#{@source}"
    @commands = []
    @images = %w[rails sidekiq renderer].index_with do
      "/org/#{VerifiedBenchmarkDeployment::ORG}/image/gumroad-inertia:1@sha256:#{'b' * 64}"
    end
    @digest = DIGEST
    @image_source = @source
    @runner = method(:run_command)
  end

  def teardown
    FileUtils.remove_entry(@directory)
  end

  def deployment(source: @source, foundation: @source)
    VerifiedBenchmarkDeployment.new(root: @root, app: "gumroad-inertia", source:, manifest: @manifest,
                                    foundation:, runner: @runner, sleeper: -> { })
  end

  def test_archive_is_the_verified_commit_and_not_ignored_local_input
    File.write("#{@root}/ignored.txt", "must not enter the image")
    record = deployment.build
    assert_equal @source, record.fetch("source_sha")
    assert_equal @source, record.fetch("image_source_sha")
    assert_equal DIGEST, record.fetch("digest")
    assert_equal "built", record.fetch("phase")
    assert @context_verified
  end

  def test_rejects_wrong_dirty_untracked_and_missing_foundation_sources_before_build
    assert_raises(RuntimeError) { deployment(source: "c" * 40).build }
    File.write("#{@root}/canonical.txt", "dirty")
    assert_raises(RuntimeError) { deployment.build }
    git("checkout", "--", "canonical.txt")
    File.write("#{@root}/untracked.txt", "untracked")
    assert_raises(RuntimeError) { deployment.build }
    File.delete("#{@root}/untracked.txt")
    assert_raises(RuntimeError) { deployment(foundation: "d" * 40).build }
    assert_equal false, @commands.any? { |command| command.first == "cpflow" }
  end

  def test_rejects_a_mislabelled_image_before_promotion
    @image_source = "f" * 40
    assert_raises(RuntimeError) { deployment.build }
    assert_equal "image_uploaded", JSON.parse(File.read(@manifest)).fetch("phase")
    assert_equal false, @commands.any? { |command| command[0, 3] == %w[cpln workload update] }
  end

  def test_release_and_running_workloads_use_the_explicit_built_digest
    deployment.build
    record = deployment.deploy
    reference = "/org/#{VerifiedBenchmarkDeployment::ORG}/image/#{@image}@#{DIGEST}"
    assert_equal [reference], @images.values.uniq
    release = @commands.find { |command| command[0, 2] == %w[cpflow run] }
    assert_equal "#{@image}@#{DIGEST}", release[release.index("--image") + 1]
    assert_equal false, @commands.flatten.include?("latest")
    assert_equal "deployed", record.fetch("phase")
  end

  def test_registry_identity_change_stops_before_release_or_host_updates
    deployment.build
    @digest = "sha256:#{'c' * 64}"
    assert_raises(RuntimeError) { deployment.deploy }
    assert_equal false, @commands.any? { |command| command[0, 2] == %w[cpflow run] }
    assert_equal false, @commands.any? { |command| command[0, 3] == %w[cpln workload update] }
  end

  def test_partial_promotion_failure_restores_all_prior_images
    deployment.build
    previous = @images.dup
    @fail_update = "sidekiq"
    error = assert_raises(RuntimeError) { deployment.deploy }
    assert_includes error.message, "release data/flags require operator assessment"
    assert_equal previous, @images
    record = JSON.parse(File.read(@manifest))
    assert_equal "promotion_failed", record.fetch("phase")
    assert_empty record.fetch("rollback_errors")
  end

  def test_a_wrong_running_digest_is_detected_and_rolled_back
    deployment.build
    previous = @images.dup
    @wrong_running_image = true
    assert_raises(RuntimeError) { deployment.deploy }
    assert_equal previous, @images
    assert_equal "promotion_failed", JSON.parse(File.read(@manifest)).fetch("phase")
  end

  def test_uncommitted_archive_attributes_are_rejected_before_build
    File.write("#{@root}/.git/info/attributes", "canonical.txt export-ignore\n")
    assert_raises(RuntimeError) { deployment.build }
    assert_equal false, @commands.any? { |command| command.first == "cpflow" }
  end

  def test_committed_export_attributes_cannot_remove_source_files
    File.write("#{@root}/.gitattributes", "canonical.txt export-ignore\n")
    git("add", ".gitattributes")
    git("commit", "-qm", "Export attribute")
    @source = git("rev-parse", "HEAD").strip
    assert_raises(Errno::ENOENT) { deployment.build }
    assert_equal false, @commands.any? { |command| command.first == "cpflow" }
  end

  def test_failed_release_preserves_evidence_and_refuses_automatic_retry
    deployment.build
    @fail_release = true
    previous = @images.dup
    assert_raises(RuntimeError) { deployment.deploy }
    assert_equal previous, @images
    assert_equal "release_started", JSON.parse(File.read(@manifest)).fetch("phase")
    assert_raises(RuntimeError) { deployment.deploy }
    assert_equal 1, @commands.count { |command| command[0, 2] == %w[cpflow run] }
  end

  def test_manifest_symlink_into_source_is_rejected_before_build
    File.symlink(@root, "#{@directory}/linked-source")
    assert_raises(RuntimeError) do
      VerifiedBenchmarkDeployment.new(root: @root, app: "gumroad-inertia", source: @source,
                                      manifest: "#{@directory}/linked-source/build.json")
    end
  end

  private
    def git(*args)
      output, error, status = Open3.capture3("git", *args, chdir: @root)
      raise error unless status.success?
      output
    end

    def run_command(*args, chdir:)
      @commands << args
      return Open3.capture3(*args, chdir:) if %w[git tar].include?(args.first)

      output = if args[0, 2] == %w[cpflow build-image]
        context = args[args.index("--docker-context") + 1]
        @context_verified = chdir == context && File.read("#{context}/canonical.txt") == "committed source\n" && !File.exist?("#{context}/ignored.txt")
        return ["", "Pushed image to '/org/#{VerifiedBenchmarkDeployment::ORG}/image/#{@image}'.\n", Success.new(true)]
      elsif args[0, 3] == %w[cpln image get]
        JSON.generate(name: @image, digest: @digest)
      elsif args[0, 3] == %w[docker image inspect]
        JSON.generate(["GIT_COMMIT=#{@image_source}"])
      elsif args[0, 2] == %w[docker pull]
        raise "Expected an immutable image" unless args.last.end_with?("@#{DIGEST}")
        "pulled"
      elsif args[0, 2] == %w[cpflow run]
        return ["", "release rejected", Success.new(false)] if @fail_release
        "release completed"
      elsif args[0, 3] == %w[cpln workload get]
        workload = args[3]
        JSON.generate(spec: { containers: [{ name: workload, image: @images.fetch(workload) }] })
      elsif args[0, 3] == %w[cpln workload update]
        workload = args[3]
        if @fail_update == workload
          @fail_update = nil
          return ["", "update rejected", Success.new(false)]
        end
        @images[workload] = args.last.split("=", 2).last
        "updated"
      elsif args[0, 3] == %w[cpln workload get-deployments]
        workload = args[3]
        image = @images.fetch(workload)
        image = "wrong" if @wrong_running_image && image.include?(DIGEST)
        JSON.generate(items: [{ name: "aws-us-east-2", status: { ready: true, deploying: false,
                                                                 versions: [{ ready: true, containers: { workload => { image: } } }] } }])
      else
        raise "Unexpected external command: #{args.inspect}"
      end
      [output, "", Success.new(true)]
    end
end
