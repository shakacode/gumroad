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
    Product/ProductReceiptActions.client.tsx
    Profile/ProfileProducts.client.tsx
    Profile/ProfileRichTextEnhancement.client.tsx
    Profile/ProfileRichText.client.tsx
    Profile/ProfileRscCompatibilityPage.client.tsx
    Profile/ProfileSubscribe.client.tsx
    Profile/ProfileWishlists.client.tsx
    PublicPages/PageShell.client.tsx
  ].freeze
  SERVER_COMPONENTS = %w[
    Discover/DiscoverHeader.tsx
    Discover/DiscoverLayout.tsx
    Discover/DiscoverPage.tsx
    Product/ProductContent.tsx
    Product/ProductPage.tsx
    Profile/ProfilePostsContent.tsx
    Profile/ProfileRichText.ts
    Profile/ProfileRichTextContent.tsx
    Profile/ProfileSectionFrame.tsx
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

  test "passes the server-rendered initial cover through the client carousel" do
    covers = COMPONENT_DIRECTORY.join("Product/Covers/index.tsx").read
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    product_content = COMPONENT_DIRECTORY.join("Product/ProductContent.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read

    assert_includes covers, "initialContent={initialCover?.id === cover.id ? initialCover.content : null}"
    assert_includes interactive_product, "initialCover={serverContent.initialCover}"
    assert_includes product_content, "export const ProductCoverImage"
    assert_includes product_page, "content: <ProductCoverImage"
  end

  test "only enhances interactive product descriptions on the client" do
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    product_content = COMPONENT_DIRECTORY.join("Product/ProductContent.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read

    assert_includes interactive_product, "needsClientEnhancement={serverContent.descriptionNeedsClientEnhancement}"
    assert_includes product_content, "export const productDescriptionNeedsClientEnhancement"
    assert_includes product_page,
                    "descriptionNeedsClientEnhancement: productDescriptionNeedsClientEnhancement(content.description_html)"
  end

  test "passes static bundle item text through the client pricing loop" do
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read
    client_graph = transitive_javascript_imports([COMPONENT_DIRECTORY.join("Product/ProductInteractions.client.tsx")])

    assert_includes interactive_product, "serverContent.bundleItems[bundleProduct.id]"
    assert_includes product_page, "<ProductBundleItemContent"
    assert_not_includes client_graph, COMPONENT_DIRECTORY.join("Product/ProductContent.tsx")
  end

  test "renders the receipt shell outside the product client island" do
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    product_content = COMPONENT_DIRECTORY.join("Product/ProductContent.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read

    assert_includes interactive_product, "serverContent.receipt"
    assert_not_includes interactive_product, "ExistingPurchaseCard"
    assert_no_match(%r{import\s+(?!type\b).*from "\$app/components/ReviewForm"}, interactive_product)
    assert_includes product_content, "<ProductReceiptReviewAction"
    assert_includes product_page, "<ProductReceiptContent"
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

  test "defers the initial written reviews request until browser idle time" do
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read

    assert_includes interactive_product, "scheduleProductReviewsLoad"
    assert_not_includes interactive_product, "useRunOnce(() => void loadNextPage())"
  end

  test "keeps profile rich text rendering behind an asynchronous client boundary" do
    sections = COMPONENT_DIRECTORY.join("Profile/Sections.tsx").read
    enhancement = COMPONENT_DIRECTORY.join("Profile/ProfileRichTextEnhancement.client.tsx").read
    rich_text = COMPONENT_DIRECTORY.join("Profile/ProfileRichText.client.tsx").read
    product_interactions = COMPONENT_DIRECTORY.join("Product/ProductInteractions.client.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read
    client_graph = transitive_javascript_imports([COMPONENT_DIRECTORY.join("Product/ProductInteractions.client.tsx")])

    assert_not_includes sections, "@tiptap/react"
    assert_not_includes sections, "$app/components/RichTextEditor"
    assert_not_includes sections, 'import("$app/components/Profile/ProfileRichText.client")'
    assert_not_includes sections, "profileRichTextNeedsClientEnhancement"
    assert_includes sections, "<ProfileRichTextEnhancement"
    assert_includes enhancement, 'import("$app/components/Profile/ProfileRichText.client")'
    assert_includes enhancement, "fetchWithOneRetry(importProfileRichText)"
    assert_not_includes product_interactions, "profileRichTextServerContent"
    assert_includes product_page, "profileRichTextNeedsClientEnhancement(section.text)"
    assert_includes product_page, "<ProfileRichTextEnhancement"
    assert_includes product_page, "<ProfileSectionFrame"
    assert_includes product_page, "<ProfileRichTextContent"
    assert_not_includes client_graph, COMPONENT_DIRECTORY.join("Profile/ProfileRichText.client.tsx")
    assert_not_includes client_graph, COMPONENT_DIRECTORY.join("Profile/ProfileRichTextContent.tsx")
    assert_not_includes client_graph, COMPONENT_DIRECTORY.join("RichTextEditor.tsx")
    assert_includes rich_text, "@tiptap/react"
    assert_includes rich_text, "$app/components/RichTextEditor"
  end

  test "renders profile post frames outside the product client island" do
    sections = COMPONENT_DIRECTORY.join("Profile/Sections.tsx").read
    product_interactions = COMPONENT_DIRECTORY.join("Product/ProductInteractions.client.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read
    posts_content = COMPONENT_DIRECTORY.join("Profile/ProfilePostsContent.tsx")
    legacy_product_layout = COMPONENT_DIRECTORY.join("Product/Layout.tsx").read
    legacy_profile = COMPONENT_DIRECTORY.join("Profile/index.tsx").read
    client_graph = transitive_javascript_imports([COMPONENT_DIRECTORY.join("Product/ProductInteractions.client.tsx")])

    assert_includes sections, "postsContent"
    assert_not_includes sections, "formatPostDate"
    assert_not_includes sections, "useUserAgentInfo"
    assert_includes product_interactions, "serverProfileSections[section.id] ??"
    assert_not_includes product_interactions, "postsContent={profilePostsServerContent[section.id]}"
    assert_includes product_page, "serverProfileSections: Object.fromEntries"
    assert_includes product_page, "<ProfileSectionFrame"
    assert_includes product_page, "<ProfilePostsContent"
    assert_not_includes client_graph, posts_content
    assert_includes legacy_product_layout, "<PostsView posts={section.posts} />"
    assert_includes legacy_profile, "<PostsView posts={section.posts} />"
  end

  test "renders profile subscribe frames outside the product client island" do
    sections = COMPONENT_DIRECTORY.join("Profile/Sections.tsx").read
    subscribe = COMPONENT_DIRECTORY.join("Profile/ProfileSubscribe.client.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read

    assert_not_includes sections, "$app/components/Profile/FollowForm"
    assert_includes sections, "<ProfileSubscribe"
    assert_includes subscribe, "$app/components/Profile/FollowForm"
    assert_includes product_page, 'section.type === "SellerProfileSubscribeSection"'
    assert_includes product_page, "<ProfileSectionFrame"
    assert_includes product_page, "<ProfileSubscribe"
  end

  test "renders profile wishlist frames outside the product client island" do
    sections = COMPONENT_DIRECTORY.join("Profile/Sections.tsx").read
    wishlists = COMPONENT_DIRECTORY.join("Profile/ProfileWishlists.client.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read

    assert_not_includes sections, "<WishlistCardGrid>"
    assert_includes sections, "<ProfileWishlists"
    assert_includes wishlists, "<WishlistCardGrid>"
    assert_includes product_page, 'section.type === "SellerProfileWishlistsSection"'
    assert_includes product_page, "<ProfileSectionFrame"
    assert_includes product_page, "<ProfileWishlists"
  end

  test "renders profile product frames outside the product client island" do
    products = COMPONENT_DIRECTORY.join("Profile/ProfileProducts.client.tsx")
    sections = COMPONENT_DIRECTORY.join("Profile/Sections.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read

    assert_predicate products, :file?
    assert products.read.start_with?('"use client";')
    assert_includes sections, "<ProfileProducts"
    assert_includes product_page, 'section.type === "SellerProfileProductsSection"'
    assert_includes product_page, "<ProfileSectionFrame"
    assert_includes product_page, "<ProfileProducts"
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
