# frozen_string_literal: true

require "test_helper"

class ProductRscImportGraphTest < ActiveSupport::TestCase
  COMPONENT_DIRECTORY = Rails.root.join("app/javascript/components")
  CLIENT_COMPONENTS = %w[
    Product/ProductDescription.client.tsx
    Product/ProductReviews.client.tsx
  ].freeze

  test "keeps the product description and reviews as explicit client boundaries" do
    CLIENT_COMPONENTS.each do |path|
      assert COMPONENT_DIRECTORY.join(path).read.start_with?('"use client";'), "Expected #{path} to be a client boundary"
    end
  end

  test "keeps the description editor behind an asynchronous client boundary" do
    description = COMPONENT_DIRECTORY.join("Product/ProductDescription.client.tsx")
    enhancement = COMPONENT_DIRECTORY.join("Product/ProductDescriptionEnhancement.tsx")
    client_graph = transitive_javascript_imports([description])

    assert_not_includes description.read, "@tiptap/react"
    assert_not_includes description.read, "$app/components/RichTextEditor"
    assert_includes description.read, "fetchWithOneRetry(importProductDescriptionEnhancement)"
    assert_includes description.read, 'import("$app/components/Product/ProductDescriptionEnhancement")'
    assert_includes enhancement.read, "@tiptap/react"
    assert_includes enhancement.read, "$app/components/RichTextEditor"
    assert_not_includes client_graph, enhancement
  end

  test "keeps written reviews behind an idle-loaded client enhancement" do
    reviews_boundary = COMPONENT_DIRECTORY.join("Product/ProductReviews.client.tsx")
    reviews = COMPONENT_DIRECTORY.join("Product/ProductReviews.tsx")
    enhancement = COMPONENT_DIRECTORY.join("Product/ProductReviewsEnhancement.tsx")
    review_data = Rails.root.join("app/javascript/data/product_reviews.ts")
    product_barrel = COMPONENT_DIRECTORY.join("Product/index.tsx")
    scheduler = COMPONENT_DIRECTORY.join("Product/scheduleProductReviewsLoad.ts")
    client_graph = transitive_javascript_imports([reviews_boundary])

    assert_includes reviews_boundary.read, 'export { ProductReviews } from "$app/components/Product/ProductReviews"'
    assert_includes reviews.read, 'import("$app/components/Product/ProductReviewsEnhancement")'
    assert_includes reviews.read, "scheduleProductReviewsLoad"
    assert_not_includes reviews.read, "$app/data/product_reviews"
    assert_includes client_graph, reviews
    assert_includes client_graph, scheduler
    assert_not_includes client_graph, enhancement
    assert_not_includes client_graph, product_barrel
    assert_not_includes client_graph, review_data
  end

  test "keeps the ratings summary server-renderable" do
    ratings_summary = COMPONENT_DIRECTORY.join("Product/ProductRatingsSummary.tsx")

    assert_predicate ratings_summary, :file?
    assert_not ratings_summary.read.start_with?('"use client";')
    assert_includes ratings_summary.read, "<RatingStars"
  end

  private
    def transitive_javascript_imports(entry_files)
      pending = entry_files
      visited = Set.new

      while (path = pending.shift)
        next unless visited.add?(path)

        source = path.read
        imports = source.scan(/(?:^|\n)\s*(?:import|export)\s+(?!type\b).*?\bfrom\s+["']([^"']+)["']/m).flatten
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
