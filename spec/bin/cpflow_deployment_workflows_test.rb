# frozen_string_literal: true

require "minitest/autorun"
require "open3"
require "tmpdir"
require "yaml"

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
      refute_includes concurrency.fetch("group"), "${{"
      concurrency.fetch("group")
    end
    assert_equal 2, groups.uniq.size
  end

  private
    def workflows
      %w[inertia rorp].map do |surface|
        YAML.load_file(File.expand_path("../../.github/workflows/cpflow-deploy-#{surface}.yml", __dir__))
      end
    end
end
