# frozen_string_literal: true

require "test_helper"

class ReactOnRailsRscConfigurationTest < ActiveSupport::TestCase
  test "configures normal React on Rails rendering" do
    assert_equal "server-bundle.js", ReactOnRails.configuration.server_bundle_js_file
    assert ReactOnRails.configuration.enforce_private_server_bundles
    assert_not ReactOnRailsPro.configuration.enable_rsc_support
  end
end
