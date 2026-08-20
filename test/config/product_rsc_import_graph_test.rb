# frozen_string_literal: true

require "test_helper"

class ProductRscImportGraphTest < ActiveSupport::TestCase
  COMPONENT_DIRECTORY = Rails.root.join("app/javascript/components")
  CLIENT_COMPONENTS = %w[
    Discover/Cart.client.tsx
    Discover/DiscoverResults.client.tsx
    Discover/MobileMenu.client.tsx
    Discover/Search.client.tsx
    Product/ProductAnalytics.client.tsx
    Product/ProductDescription.client.tsx
    Product/ProductInteractions.client.tsx
    Profile/ProfileRscCompatibilityPage.client.tsx
    PublicPages/PageShell.client.tsx
  ].freeze
  SERVER_COMPONENTS = %w[
    Discover/DiscoverHeader.tsx
    Discover/DiscoverLayout.tsx
    Discover/DiscoverPage.tsx
    Product/ProductContent.tsx
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

  test "keeps the legacy product composition out of the RSC client graph" do
    client_graph = transitive_javascript_imports([COMPONENT_DIRECTORY.join("Product/ProductInteractions.client.tsx")])

    assert_not_includes client_graph, Rails.root.join("app/javascript/components/Product/index.tsx")
    assert_not_includes client_graph, Rails.root.join("app/javascript/components/Product/Layout.tsx")
    assert_not_includes client_graph, Rails.root.join("app/javascript/components/Product/LegacyProduct.tsx")
  end

  test "isolates product view analytics in a null client island" do
    analytics = COMPONENT_DIRECTORY.join("Product/ProductAnalytics.client.tsx").read
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read

    assert analytics.start_with?('"use client";')
    assert_match(/return null;/, analytics)
    assert_includes interactive_product, "$app/components/Product/ProductAnalytics.client"
    assert_not_includes interactive_product, "$app/data/view_event"
    assert_not_includes interactive_product, "$app/utils/user_analytics"
    assert_not_includes interactive_product, "$app/components/useAddThirdPartyAnalytics"
  end

  test "passes server-rendered description content through the client island" do
    description = COMPONENT_DIRECTORY.join("Product/ProductDescription.client.tsx").read
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read

    assert_not_includes description, "$app/components/Product/ProductContent"
    assert_includes interactive_product, "initialContent={serverContent.description}"
    assert_includes product_page, "description: <ProductDescriptionContent content={content} />"
  end

  test "keeps the description editor behind an asynchronous client boundary" do
    description = COMPONENT_DIRECTORY.join("Product/ProductDescription.client.tsx").read

    assert_not_includes description, "@tiptap/react"
    assert_not_includes description, "$app/components/RichTextEditor"
    assert_includes description, "fetchWithOneRetry(importProductDescriptionEnhancement)"
    assert_includes description, 'import("$app/components/Product/ProductDescriptionEnhancement")'

    enhancement = COMPONENT_DIRECTORY.join("Product/ProductDescriptionEnhancement.tsx").read
    assert_includes enhancement, "@tiptap/react"
    assert_includes enhancement, "$app/components/RichTextEditor"
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
