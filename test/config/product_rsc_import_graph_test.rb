# frozen_string_literal: true

require "test_helper"

class ProductRscImportGraphTest < ActiveSupport::TestCase
  COMPONENT_DIRECTORY = Rails.root.join("app/javascript/components")
  CLIENT_COMPONENTS = %w[
    Discover/DiscoverHeader.client.tsx
    Discover/DiscoverResults.client.tsx
    Product/ProductPage.tsx
    Profile/ProfileRscCompatibilityPage.client.tsx
    PublicPages/PageShell.client.tsx
  ].freeze
  SERVER_COMPONENTS = %w[
    Discover/DiscoverLayout.tsx
    Discover/DiscoverPage.tsx
  ].freeze

  test "keeps public RSC root boundaries explicit" do
    CLIENT_COMPONENTS.each do |path|
      assert COMPONENT_DIRECTORY.join(path).read.start_with?('"use client";'), "Expected #{path} to be a client boundary"
    end

    SERVER_COMPONENTS.each do |path|
      assert_not COMPONENT_DIRECTORY.join(path).read.start_with?('"use client";'),
                 "Expected #{path} to be a server component"
    end

    assert_not Rails.root.join("app/javascript/product_rsc").exist?
  end
end
