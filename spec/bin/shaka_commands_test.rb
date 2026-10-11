# frozen_string_literal: true

require "fileutils"
require "json"
require "minitest/autorun"
require "open3"
require "rbconfig"
require "tmpdir"

class ShakaCommandsTest < Minitest::Test
  def test_delegates_to_application_setup_from_an_unrelated_directory
    Dir.mktmpdir("shaka-setup") do |root|
      FileUtils.mkdir_p(["#{root}/.agents/bin", "#{root}/bin", "#{root}/commands", "#{root}/outside"])
      FileUtils.cp_r(File.expand_path("../../.agents/bin/setup", __dir__), "#{root}/.agents/bin/setup", dereference_root: false)
      File.write("#{root}/bin/setup", <<~RUBY)
        require "json"
        Dir.chdir(File.expand_path("..", __dir__)) do
          puts JSON.generate(root: Dir.pwd, arguments: ARGV)
        end
      RUBY
      # A copied setup implementation must never install dependencies in this fixture.
      File.write("#{root}/commands/gem", "#!/bin/sh\nexit 88\n")
      File.chmod(0755, "#{root}/commands/gem")

      output, status = Open3.capture2e(
        { "PATH" => "#{root}/commands:#{ENV.fetch('PATH')}" },
        RbConfig.ruby, "#{root}/.agents/bin/setup", "argument with spaces",
        chdir: "#{root}/outside"
      )

      assert status.success?, output
      assert_equal({ "root" => File.realpath(root), "arguments" => ["argument with spaces"] }, JSON.parse(output))
    end
  end

  def test_validation_honors_generated_file_exclusions_in_a_hidden_checkout
    Dir.mktmpdir("shaka-lint") do |directory|
      root = "#{directory}/.checkout"
      FileUtils.mkdir_p("#{root}/db")
      File.write("#{root}/db/schema.rb", "puts 'generated schema'\n")
      File.write("#{root}/.rubocop.yml", <<~YAML)
        AllCops:
          DisabledByDefault: true
          NewCops: disable
          Exclude:
            - db/schema.rb
        Style/FrozenStringLiteralComment:
          Enabled: true
      YAML
      command = File.readlines(File.expand_path("../../.agents/bin/validate", __dir__)).find { |line| line.start_with?("bundle exec rubocop ") }
      output, status = Open3.capture2e(
        { "BASH_ENV" => nil, "BUNDLE_GEMFILE" => File.expand_path("../../Gemfile", __dir__) },
        "bash", "-c", command, chdir: root
      )

      assert status.success?, output
    end
  end
end
