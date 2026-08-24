# frozen_string_literal: true

require "test_helper"

class ProductRscImportGraphTest < ActiveSupport::TestCase
  COMPONENT_DIRECTORY = Rails.root.join("app/javascript/components")
  PRICING_CLIENT_COMPONENTS = %w[
    Product/ProductBundle.client.tsx
    Product/ProductFooterCurrencySelector.client.tsx
    Product/ProductPrice.client.tsx
    Product/ProductStateProvider.client.tsx
    Product/useSelectionFromUrl.client.ts
  ].freeze
  PURCHASE_CLIENT_COMPONENTS = %w[
    Product/ProductEditButton.client.tsx
    Product/ProductLicenseKeyLookup.client.tsx
    Product/ProductPurchaseControls.client.tsx
    Product/ProductReceiptActions.client.tsx
    Product/ProductSecondaryActions.client.tsx
  ].freeze
  MEDIA_CLIENT_COMPONENTS = %w[
    Product/ProductMedia.client.tsx
    Product/ProductRefundPolicy.client.tsx
    Product/ProductShare.client.tsx
  ].freeze
  VISUAL_CLIENT_COMPONENTS = %w[
    Product/ProductPreorderNotice.client.tsx
    Product/ProductStickyCta.client.tsx
  ].freeze
  CLIENT_COMPONENTS = (PRICING_CLIENT_COMPONENTS + PURCHASE_CLIENT_COMPONENTS + MEDIA_CLIENT_COMPONENTS +
    VISUAL_CLIENT_COMPONENTS + %w[
      Product/ProductDescription.client.tsx
      Product/ProductReviews.client.tsx
    ]).freeze

  test "keeps product client boundaries explicit" do
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

  test "keeps product state, pricing, and bundle presentation in client boundaries" do
    bundle = COMPONENT_DIRECTORY.join("Product/ProductBundle.client.tsx")
    price = COMPONENT_DIRECTORY.join("Product/ProductPrice.client.tsx")
    provider = COMPONENT_DIRECTORY.join("Product/ProductStateProvider.client.tsx")
    selection_from_url = COMPONENT_DIRECTORY.join("Product/useSelectionFromUrl.client.ts")

    assert_includes bundle.read, "bundleItems[bundleProduct.id]"
    assert_includes bundle.read, "getBundleComparisonPriceCents"
    assert_not_includes bundle.read, "bundleProduct.price * bundleProduct.quantity"
    assert_includes price.read, "<PriceTag"
    assert_includes price.read, "buyerLocalPriceCentsForSelection"
    assert_includes provider.read, "children: React.ReactNode"
    assert_includes provider.read, "useSelectionFromUrl(product)"
    assert_includes selection_from_url.read, "searchParams.get(\"variant\")"
    assert_includes selection_from_url.read, "searchParams.get(recurrence)"
    assert_includes selection_from_url.read, "product.options.find(({ quantity_left }) => quantity_left !== 0)"
    assert_includes selection_from_url.read, "getMaxQuantity(product, parsedOption ?? null)"
  end

  test "keeps all pricing client graphs out of product composition" do
    pricing_boundaries = PRICING_CLIENT_COMPONENTS.map { COMPONENT_DIRECTORY.join(_1) }
    client_graph = transitive_javascript_imports(pricing_boundaries)
    product_barrel = COMPONENT_DIRECTORY.join("Product/index.tsx")
    type_consumers = pricing_boundaries.reject { _1.basename.to_s == "ProductFooterCurrencySelector.client.tsx" }

    type_consumers.each do |boundary|
      assert_match %r{import type .*from "\$app/components/Product"}m, boundary.read
    end
    assert_not_includes client_graph, product_barrel
    %w[Interactive.tsx ProductArticle.tsx ProductContent.tsx ProductPage.tsx].each do |composition|
      assert_not_includes client_graph, COMPONENT_DIRECTORY.join("Product", composition)
    end
  end

  test "keeps purchase controls out of later product composition" do
    purchase_boundaries = PURCHASE_CLIENT_COMPONENTS.map { COMPONENT_DIRECTORY.join(_1) }
    client_graph = transitive_javascript_imports(purchase_boundaries)
    purchase_controls = COMPONENT_DIRECTORY.join("Product/ProductPurchaseControls.client.tsx")
    static_purchase_imports = purchase_controls.read.scan(
      /(?:^|\n)\s*(?:import|export)\s+(?!type\b).*?\bfrom\s+["']([^"']+)["']/m,
    ).flatten
    type_consumers = purchase_boundaries.select do |boundary|
      %w[ProductEditButton.client.tsx ProductPurchaseControls.client.tsx ProductSecondaryActions.client.tsx].include?(
        boundary.basename.to_s,
      )
    end

    type_consumers.each do |boundary|
      assert_match %r{import type .*from "\$app/components/Product"}m, boundary.read
      assert_not_includes boundary.read, "$app/components/Product/Interactive"
    end
    assert_includes purchase_controls.read, 'import("$app/components/Product/SubscriptionChoiceModal")'
    assert_not_includes static_purchase_imports, "$app/components/Product/SubscriptionChoiceModal"
    %w[Interactive.tsx ProductArticle.tsx ProductContent.tsx ProductPage.tsx].each do |composition|
      assert_not_includes client_graph, COMPONENT_DIRECTORY.join("Product", composition)
    end
  end

  test "keeps media and dialogs outside later product composition" do
    media_boundaries = MEDIA_CLIENT_COMPONENTS.map { COMPONENT_DIRECTORY.join(_1) }
    client_graph = transitive_javascript_imports(media_boundaries)
    covers = COMPONENT_DIRECTORY.join("Product/Covers/index.tsx").read
    product_media = COMPONENT_DIRECTORY.join("Product/ProductMedia.client.tsx").read
    refund_policy = COMPONENT_DIRECTORY.join("Product/ProductRefundPolicy.client.tsx").read
    refund_policy_modal = COMPONENT_DIRECTORY.join("Product/ProductRefundPolicyModal.tsx")
    product_share = COMPONENT_DIRECTORY.join("Product/ProductShare.client.tsx").read
    product_share_menu = COMPONENT_DIRECTORY.join("Product/ProductShareMenu.tsx")
    share_section = COMPONENT_DIRECTORY.join("Product/ShareSection.tsx").read
    subscription_modal = COMPONENT_DIRECTORY.join("Product/SubscriptionChoiceModal.tsx").read

    assert_match %r{import type .*from "\$app/components/Product"}m, product_media
    assert_includes product_media, "initialCover={initialCover}"
    assert_includes covers, "initialContent={initialCover?.id === cover.id ? initialCover.content : null}"
    assert_includes refund_policy, 'import("$app/components/Product/ProductRefundPolicyModal")'
    assert_includes product_share, 'import("$app/components/Product/ProductShareMenu")'
    assert_not_includes client_graph, refund_policy_modal
    assert_not_includes client_graph, product_share_menu
    %w[$app/components/Modal $app/components/UserAgent $app/data/user_action_event].each do |dependency|
      assert_not_includes refund_policy, dependency
      assert_includes refund_policy_modal.read, dependency
    end
    %w[TwitterShareButton FacebookShareButton CopyToClipboard].each do |dependency|
      assert_not_includes product_share, dependency
      assert_includes product_share_menu.read, dependency
    end
    assert_includes product_share, '<Share className="size-5" /> Share'
    assert_includes share_section, "<ProductShare"
    assert_not_includes share_section, "<Popover"
    assert_includes share_section, 'import type { PriceSelection } from "$app/components/Product/ConfigurationSelector"'
    assert_match %r{import type .*Purchase.*from "\$app/components/Product"}m, subscription_modal
    media_boundaries.each { assert_not_includes _1.read, "$app/components/Product/Interactive" }
    %w[Interactive.tsx ProductArticle.tsx ProductContent.tsx ProductPage.tsx].each do |composition|
      assert_not_includes client_graph, COMPONENT_DIRECTORY.join("Product", composition)
    end
  end

  test "keeps the visual shell server-owned around explicit client leaves" do
    visual_boundaries = VISUAL_CLIENT_COMPONENTS.map { COMPONENT_DIRECTORY.join(_1) }
    client_graph = transitive_javascript_imports(visual_boundaries)
    content = COMPONENT_DIRECTORY.join("Product/ProductContent.tsx")
    covers = COMPONENT_DIRECTORY.join("Product/Covers/index.tsx").read
    footer = COMPONENT_DIRECTORY.join("Product/ProductFooter.tsx")
    layout = COMPONENT_DIRECTORY.join("Product/Layout.tsx").read
    layout_controls = COMPONENT_DIRECTORY.join("Product/LayoutControls.tsx").read
    preorder_notice = COMPONENT_DIRECTORY.join("Product/ProductPreorderNotice.client.tsx").read
    single_cover = COMPONENT_DIRECTORY.join("Product/ProductSingleCover.tsx")
    sticky_cta = COMPONENT_DIRECTORY.join("Product/ProductStickyCta.client.tsx").read

    [content, footer, single_cover].each do |server_component|
      assert_predicate server_component, :file?
      assert_not server_component.read.start_with?('"use client";')
      assert_not_includes client_graph, server_component
    end
    assert_includes content.read, "productDescriptionNeedsClientEnhancement"
    assert_includes content.read, "<ProductReceiptReviewAction"
    assert_includes content.read, "getNotForSaleMessage(content)"
    assert_includes covers, "$app/components/Product/productCover"
    assert_includes covers, "export { DEFAULT_IMAGE_WIDTH };"
    assert_includes footer.read, "$app/components/Product/ProductFooterCurrencySelector.client"
    assert_includes single_cover.read, "aspectRatio"
    assert_includes preorder_notice, "formatDate(parseISO(releaseDate))"
    assert_includes sticky_cta, "useProductState()"
    assert_includes sticky_cta, "$app/components/Product/LayoutControls"
    assert_includes layout, "hideSellerByline={props.hideSellerByline}"
    [content.read, layout_controls, sticky_cta].each do |source|
      assert_match %r{import type .*from "\$app/components/Product"}m, source
      assert_not_includes source, "$app/components/Product/Interactive"
    end
    %w[ProductArticle.tsx ProductPage.tsx].each do |composition|
      assert_not_includes client_graph, COMPONENT_DIRECTORY.join("Product", composition)
    end
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
