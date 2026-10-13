# frozen_string_literal: true

require "minitest/autorun"
require "yaml"

class CpflowDeploymentWorkflowsTest < Minitest::Test
  def test_hosted_control_plane_automation_is_deferred
    paths = Dir.glob(File.expand_path("../../.github/workflows/*.{yml,yaml}", __dir__))
    refute_empty paths

    hosted_paths = paths.select do |path|
      workflow = YAML.load_file(path, aliases: true)
      workflow.to_s.match?(/cpflow|cpln|control-plane-flow|\.controlplane|deploy-control-plane-benchmark/i)
    end

    assert_empty hosted_paths,
                 "Hosted Control Plane automation is deferred; use bin/deploy-control-plane-benchmark: #{hosted_paths.join(', ')}"
  end
end
