# frozen_string_literal: true

require "minitest/autorun"
require "open3"
require "tmpdir"
require "yaml"
require "json"
require "fileutils"
require "rbconfig"

class CpflowDeploymentWorkflowsTest < Minitest::Test
  def test_only_the_deployment_branch_and_explicit_preparation_dispatch_can_deploy
    workflows.each do |workflow|
      [
        ["push", "ramez/cpln/cpflow", true],
        ["workflow_dispatch", "ramez/cpln/cpflow", true],
        ["workflow_dispatch", "jg-codex/matched-source-demo-deployment", true],
        ["push", "jg-codex/matched-source-demo-deployment", false],
        ["workflow_dispatch", "main", false],
        ["workflow_dispatch", "unrelated", false]
      ].each do |event, branch, expected|
        Dir.mktmpdir do |directory|
          output_file = "#{directory}/outputs"
          output, status = Open3.capture2e(
            workflow.fetch("env").merge(
              "BASH_ENV" => nil,
              "GITHUB_EVENT_NAME" => event,
              "GITHUB_REF" => "refs/heads/#{branch}",
              "GITHUB_REF_NAME" => branch,
              "GITHUB_OUTPUT" => output_file
            ),
            "bash", "-c", workflow.fetch("jobs").fetch("validate-branch").fetch("steps").find { |step| step["id"] == "check-branch" }.fetch("run")
          )
          expression = workflow.fetch("concurrency").fetch("group")[/\$\{\{ (.*) \}\}/, 1]
          expression = expression.gsub("github.ref", "refs/heads/#{branch}".to_json).gsub("github.event_name", event.to_json)
          group, result = Open3.capture2e("node", "-p", expression)
          assert result.success?, group
          assert_equal expected ? "deployment" : "refs/heads/#{branch}", group.strip
          assert status.success?, output
          assert_equal "is_deployable=#{expected}\n", File.read(output_file), "#{event} #{branch}"
        end
      end
    end
  end

  def test_all_allowed_refs_share_one_non_cancelling_queue_per_app
    groups = workflows.map do |workflow|
      concurrency = workflow.fetch("concurrency")
      refute concurrency.fetch("cancel-in-progress")
      assert_includes concurrency.fetch("group"), "${{"
      concurrency.fetch("group")
    end
    assert_equal 2, groups.uniq.size
  end

  def test_probe_guard_failure_stops_both_hosted_paths_before_deployment_writes
    workflows.each do |workflow|
      steps = workflow.fetch("jobs").fetch("deploy").fetch("steps")
      index = steps.index { |step| step["run"].to_s.include?("verify_rails_probes.rb") }
      refute_nil index
      guard = steps.fetch(index)
      refute guard["continue-on-error"]
      %w[prepare_renderer_secret.rb apply-template deploy-image].each do |command|
        assert_operator index, :<, steps.index { |step| step["run"].to_s.include?(command) }
      end
      Dir.mktmpdir do |directory|
        FileUtils.mkdir_p("#{directory}/.controlplane")
        FileUtils.cp(File.expand_path("../../.controlplane/verify_rails_probes.rb", __dir__), "#{directory}/.controlplane/verify_rails_probes.rb")
        File.write("#{directory}/cpln", <<~RUBY)
          #!#{RbConfig.ruby}
          require "json"
          File.write(ENV.fetch("PROBE_COMMAND_RECORD"), JSON.generate(ARGV))
          puts JSON.generate(name: "rails", spec: { containers: [{ name: "rails" }] })
        RUBY
        FileUtils.chmod(0o755, "#{directory}/cpln")
        record = "#{directory}/command.json"
        env = workflow.fetch("env").merge("CPLN_ORG" => "shakacode-open-source-examples-staging",
                                          "PATH" => "#{directory}:#{ENV.fetch('PATH')}", "PROBE_COMMAND_RECORD" => record,
                                          "BASH_ENV" => nil, "ENV" => nil)
        _, status = Open3.capture2e(env,
                                    "bash", "-e", "-c", guard.fetch("run"), chdir: directory)
        refute status.success?
        assert_equal ["workload", "get", "rails", "--org", "shakacode-open-source-examples-staging",
                      "--gvc", workflow.fetch("env").fetch("APP_NAME"), "--output", "json"], JSON.parse(File.read(record))
      end
    end
  end

  private
    def workflows
      %w[inertia rorp].map do |surface|
        YAML.load_file(File.expand_path("../../.github/workflows/cpflow-deploy-#{surface}.yml", __dir__))
      end
    end
end
