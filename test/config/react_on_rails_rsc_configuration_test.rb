# frozen_string_literal: true

require "test_helper"

class ReactOnRailsRscConfigurationTest < ActiveSupport::TestCase
  test "configures the public RSC renderer and stable bundle names" do
    assert_equal "server-bundle.js", ReactOnRails.configuration.server_bundle_js_file
    assert ReactOnRails.configuration.enforce_private_server_bundles
    assert ReactOnRailsPro.configuration.enable_rsc_support
    assert_equal "rsc-bundle.js", ReactOnRailsPro.configuration.rsc_bundle_js_file
  end
end
