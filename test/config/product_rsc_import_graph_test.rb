# frozen_string_literal: true

require "test_helper"

class ProductRscImportGraphTest < ActiveSupport::TestCase
  COMPONENT_DIRECTORY = Rails.root.join("app/javascript/components")
  CLIENT_COMPONENTS = %w[
    Discover/Cart.client.tsx
    Discover/DiscoverResults.client.tsx
    Discover/MobileMenu.client.tsx
    Discover/Search.client.tsx
    Product/ProductInteractions.client.tsx
    Profile/ProfileRscCompatibilityPage.client.tsx
    PublicPages/PageShell.client.tsx
  ].freeze
  SERVER_COMPONENTS = %w[
    Discover/DiscoverHeader.tsx
    Discover/DiscoverLayout.tsx
    Discover/DiscoverPage.tsx
    Product/ProductPage.tsx
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

  test "keeps the legacy Discover composition out of the RSC client graph" do
    discover_clients = CLIENT_COMPONENTS.grep(%r{\ADiscover/})
    client_graph = transitive_javascript_imports(discover_clients.map { COMPONENT_DIRECTORY.join(_1) })

    assert_not_includes client_graph, Rails.root.join("app/javascript/components/Discover/Layout.tsx")
    assert_not_includes client_graph, Rails.root.join("app/javascript/components/Discover/Nav.tsx")
  end

  private
    def transitive_javascript_imports(entry_files)
      pending = entry_files
      visited = Set.new

      while (path = pending.shift)
        next unless visited.add?(path)

        source = path.read
        imports = source.scan(/(?:import|export)\b.*?\bfrom\s+["']([^"']+)["']/m).flatten
        imports.concat(source.scan(/import\s+["']([^"']+)["']/).flatten)
        pending.concat(imports.filter_map { resolve_javascript_import(path.dirname, _1) })
      end

      visited
    end

    def resolve_javascript_import(directory, import_path)
      unresolved = if import_path.start_with?("$app/")
        Rails.root.join("app/javascript", import_path.delete_prefix("$app/"))
      elsif import_path.start_with?(".")
        directory.join(import_path).cleanpath
      end
      return unless unresolved&.to_s&.start_with?(Rails.root.join("app/javascript").to_s)

      [unresolved, *%w[.ts .tsx .js .jsx].map { Pathname("#{unresolved}#{_1}") }, *%w[.ts .tsx .js .jsx].map { unresolved.join("index#{_1}") }].find(&:file?)
    end
end
