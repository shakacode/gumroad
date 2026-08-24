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
  COMPOSITION_CLIENT_COMPONENTS = %w[
    PoweredByFooter.tsx
    Product/CoffeeProduct.tsx
    Product/ProductAnalytics.client.tsx
    PublicPages/PageShell.client.tsx
    PublicPages/ProductPageInertia.client.tsx
    PublicPages/ProductPageShell.client.tsx
  ].freeze
  DISCOVER_CLIENT_COMPONENTS = %w[
    Discover/Cart.client.tsx
    Discover/DiscoverResults.client.tsx
    Discover/MobileMenu.client.tsx
    Discover/RecentlyViewed.tsx
    Discover/RecommendedProducts.client.tsx
    Discover/RecommendedWishlists.tsx
    Discover/Search.client.tsx
    Discover/TaxonomyMenu.client.tsx
  ].freeze
  CLIENT_COMPONENTS = (PRICING_CLIENT_COMPONENTS + PURCHASE_CLIENT_COMPONENTS + MEDIA_CLIENT_COMPONENTS +
    VISUAL_CLIENT_COMPONENTS + COMPOSITION_CLIENT_COMPONENTS + DISCOVER_CLIENT_COMPONENTS + %w[
      Product/ProductDescription.client.tsx
      Product/ProductCardAnalytics.client.tsx
      Product/ProductReviews.client.tsx
      Product/Thumbnail.tsx
      Profile/FollowForm.tsx
      Profile/Layout.tsx
      Profile/ProfileHeaderActions.client.tsx
      Profile/ProfileProducts.client.tsx
      Profile/ProfileRscCompatibilityPage.client.tsx
      Profile/ProfileRichText.client.tsx
      Profile/ProfileRichTextEnhancement.client.tsx
      Profile/ProfileSubscribe.client.tsx
      Profile/ProfileWishlists.client.tsx
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

  test "keeps product composition server-owned and legacy edges out of its client graph" do
    composition_boundaries = COMPOSITION_CLIENT_COMPONENTS.map { COMPONENT_DIRECTORY.join(_1) }
    client_graph = transitive_javascript_imports(composition_boundaries)
    cta_button = COMPONENT_DIRECTORY.join("Product/CtaButton.tsx").read
    legacy_product = COMPONENT_DIRECTORY.join("Product/LegacyProduct.tsx").read
    page_path = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx")
    page = page_path.read
    root_graph = transitive_javascript_imports([page_path])

    %w[ProductArticle.tsx ProductContent.tsx ProductFooter.tsx ProductPage.tsx].each do |composition|
      component = COMPONENT_DIRECTORY.join("Product", composition)
      assert_predicate component, :file?
      assert_not component.read.start_with?('"use client";')
    end
    %w[index.tsx Interactive.tsx LegacyProduct.tsx ProductArticle.tsx ProductContent.tsx ProductPage.tsx
       SubscriptionChoiceModal.tsx].each do |composition|
      assert_not_includes client_graph, COMPONENT_DIRECTORY.join("Product", composition)
    end
    %w[index.tsx Interactive.tsx LegacyProduct.tsx SubscriptionChoiceModal.tsx].each do |legacy_edge|
      assert_not_includes root_graph, COMPONENT_DIRECTORY.join("Product", legacy_edge)
    end
    assert_match %r{import type .*from "\$app/components/Product/Interactive"}m, cta_button
    assert_includes cta_button, "$app/components/Product/productAvailability"
    assert_includes legacy_product, "product.seller && !(hideSellerByline && !product.collaborating_user)"
    assert_includes legacy_product, "legacyProductContent({ ...props, hideSellerByline })"
    assert_includes page, "$app/components/PublicPages/ProductPageShell.client"
    assert_includes page, "<ProductStateProvider"
    assert_includes page, "<ProductArticle"
    assert_includes page, "<ProductFooter"
    assert_includes page, "detectedCurrency={global.detected_buyer_currency}"
    assert_includes page, 'productProps.page_layout === "profile"'
    assert_includes page, "sellerAndRatings: <ProductSellerAndRatings content={content} hideSellerByline={hideSellerByline} />"
    assert_includes page, "$app/components/Discover/DiscoverLayout"
    assert_includes page, "$app/components/PublicPages/ProductPageInertia.client"
    assert_not_includes page, "ProfileRscCompatibilityPage"
    assert_not_includes page, "$app/components/PublicPages/PageShell.client"
  end

  test "keeps profile rich text rendering behind an asynchronous client boundary" do
    sections = COMPONENT_DIRECTORY.join("Profile/Sections.tsx").read
    enhancement = COMPONENT_DIRECTORY.join("Profile/ProfileRichTextEnhancement.client.tsx")
    rich_text = COMPONENT_DIRECTORY.join("Profile/ProfileRichText.client.tsx")
    rich_text_predicate = COMPONENT_DIRECTORY.join("Profile/ProfileRichText.ts")
    rich_text_content = COMPONENT_DIRECTORY.join("Profile/ProfileRichTextContent.tsx")
    client_graph = transitive_javascript_imports([enhancement])

    assert_not_includes sections, "@tiptap/react"
    assert_not_includes sections, "$app/components/RichTextEditor"
    assert_includes sections, "<ProfileRichTextEnhancement"
    assert_includes sections, 'import { ProfileRichTextContent } from "$app/components/Profile/ProfileRichTextContent"'
    assert_includes sections, "fallback={<ProfileRichTextContent content={section.text} />}"
    assert_includes enhancement.read, 'import("$app/components/Profile/ProfileRichText.client")'
    assert_includes enhancement.read, "fetchWithOneRetry(importProfileRichText)"
    assert_not_includes client_graph, rich_text
    assert_not_includes client_graph, rich_text_content
    assert_not_includes client_graph, COMPONENT_DIRECTORY.join("RichTextEditor.tsx")
    assert_not rich_text_predicate.read.start_with?('"use client";')
    assert_not rich_text_content.read.start_with?('"use client";')
    assert_includes rich_text.read, "@tiptap/react"
    assert_includes rich_text.read, "$app/components/RichTextEditor"
  end

  test "keeps profile sections server-composed around explicit client leaves" do
    card_grid = COMPONENT_DIRECTORY.join("Product/CardGrid.tsx").read
    page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read
    products = COMPONENT_DIRECTORY.join("Profile/ProfileProducts.client.tsx").read
    sections = COMPONENT_DIRECTORY.join("Profile/Sections.tsx").read
    server_components = %w[
      Product/Card.tsx
      Profile/ProfileFeaturedProduct.tsx
      Profile/ProfilePostsContent.tsx
      Profile/ProfileSectionFrame.tsx
    ]

    server_components.each do |component|
      assert_not COMPONENT_DIRECTORY.join(component).read.start_with?('"use client";')
    end
    assert_includes page, "const serverProfileSections = Object.fromEntries"
    assert_includes page, "serverProfileSections[section.id]"
    assert_includes page, 'section.type === "SellerProfileProductsSection"'
    assert_includes page, "initialCards={section.search_results.products.map"
    assert_includes page, "eager={index < 4}"
    assert_includes page, "profileRichTextNeedsClientEnhancement(section.text)"
    assert_includes page, "<ProfilePostsContent"
    assert_includes page, "<ProfileFeaturedProduct"
    assert_includes page, "<ProfileSubscribe"
    assert_includes page, "<ProfileWishlists"
    assert_includes page, "index === productProps.main_section_index ? mainSection : null"
    assert_includes page, "productProps.main_section_index >= productProps.sections.length"
    assert_includes products, "section.exclude_ids?.length"
    assert_includes products, "initialProducts.every"
    assert_includes products, "initialCardCount={hasInitialCards ? initialProducts.length : undefined}"
    assert_includes card_grid, ".slice(serverCardCount)"
    assert_includes sections, "postsContent ?? <PostsView"
    assert_includes sections, "renderFeaturedProduct ?? renderLegacyFeaturedProduct"
    assert_includes sections, "<ProfileSubscribe"
    assert_not_includes sections, "hideFollowForm"
  end

  test "keeps the profile shell server-owned around explicit client boundaries" do
    actions = COMPONENT_DIRECTORY.join("Profile/ProfileHeaderActions.client.tsx")
    compatibility = COMPONENT_DIRECTORY.join("Profile/ProfileRscCompatibilityPage.client.tsx")
    follow_form = COMPONENT_DIRECTORY.join("Profile/FollowForm.tsx")
    layout_path = COMPONENT_DIRECTORY.join("Profile/ProductProfileLayout.tsx")
    layout = layout_path.read
    legacy_layout = COMPONENT_DIRECTORY.join("Profile/Layout.tsx")
    legacy_profile = COMPONENT_DIRECTORY.join("Profile/index.tsx").read
    page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read
    wrapper = COMPONENT_DIRECTORY.join("PublicPages/ror_components/ProfileRscCompatibilityPage.tsx").read
    client_graph = transitive_javascript_imports(CLIENT_COMPONENTS.map { COMPONENT_DIRECTORY.join(_1) })

    [actions, compatibility, follow_form, legacy_layout].each do |boundary|
      assert boundary.read.start_with?('"use client";'), "Expected #{boundary.basename} to be a client boundary"
    end
    assert_not layout.start_with?('"use client";')
    assert_not_includes client_graph, layout_path
    assert_includes layout, "$app/components/Profile/ProfileHeaderActions.client"
    assert_includes layout, "<ProfileHeaderButtons"
    assert_includes layout, "<FollowForm"
    assert_includes layout, "!creatorProfile.hide_follow_form"
    assert_includes layout, "detectedCurrency={detectedCurrency}"
    assert_not_includes layout, "Impersonate"
    assert_not_includes actions.read, "useLoggedInUser"
    assert_not_includes actions.read, "admin_impersonate"
    assert_includes legacy_layout.read, "hideFollowForm || Boolean(creatorProfile.hide_follow_form)"
    assert_not_includes legacy_layout.read, "useLoggedInUser"
    assert_includes page, "$app/components/Profile/ProductProfileLayout"
    assert_includes page, 'productProps.page_layout === "profile"'
    assert_includes page, "<ProductProfileLayout"
    assert_equal 2, page.scan("detectedCurrency={global.detected_buyer_currency}").count
    assert_includes page, 'productProps.page_layout === "discover" || productProps.page_layout === "profile"'
    assert_includes page, "ctaLabel={ctaLabel}"
    assert_includes page, 'cart={productProps.page_layout === "discover" || productProps.page_layout === "profile"}'
    assert_includes page, 'hasHero={productProps.page_layout === "discover"}'
    assert_includes page, "<ProfileSubscribe"
    assert_includes compatibility.read, 'component="Users/Show"'
    assert_includes compatibility.read, "pageProps={profileProps}"
    assert_includes wrapper, "$app/components/Profile/ProfileRscCompatibilityPage.client"
    assert_includes legacy_profile, "renderFeaturedProduct={renderFeaturedProduct}"
    assert_includes legacy_profile, "<PostsView posts={section.posts} />"
    assert_includes page, "$app/components/Discover/DiscoverLayout"
  end

  test "keeps Discover result state behind an explicit client boundary" do
    results_core = COMPONENT_DIRECTORY.join("Discover/DiscoverResultsCore.client.tsx")
    client_graph = transitive_javascript_imports(DISCOVER_CLIENT_COMPONENTS.map { COMPONENT_DIRECTORY.join(_1) })

    assert_predicate results_core, :file?
    assert_not results_core.read.start_with?('"use client";')
    assert_includes client_graph, results_core
    assert_includes results_core.read, "Routes.discover_path()"
    assert_includes results_core.read, "$app/components/Product/CardGrid"
    assert_includes results_core.read, "renderLayout?: ((props: DiscoverPageLayoutProps"
    assert_not_includes client_graph, Rails.root.join("app/javascript/pages/Discover/Index.tsx")
    assert_not_includes client_graph, COMPONENT_DIRECTORY.join("Discover/Index.tsx")
    assert_not_includes client_graph, COMPONENT_DIRECTORY.join("Discover/Layout.tsx")
    assert_not_includes client_graph, COMPONENT_DIRECTORY.join("Discover/Nav.tsx")
  end

  test "keeps Discover recommendations in streamed server regions with legacy fallbacks" do
    async_regions = %w[
      Discover/AsyncRecentlyViewed.tsx
      Discover/AsyncRecommendedProducts.tsx
      Discover/AsyncRecommendedWishlists.tsx
    ].map { COMPONENT_DIRECTORY.join(_1) }
    results = COMPONENT_DIRECTORY.join("Discover/DiscoverResults.client.tsx").read
    results_core = COMPONENT_DIRECTORY.join("Discover/DiscoverResultsCore.client.tsx").read
    react_types = Rails.root.join("app/javascript/types/index.d.ts").read
    recently_viewed = COMPONENT_DIRECTORY.join("Discover/RecentlyViewed.tsx").read

    async_regions.each do |region|
      assert_not region.read.start_with?('"use client";')
      assert_includes region.read, "React.use("
    end
    assert_includes results, "recentlyViewed"
    assert_includes results, "recommendedProducts"
    assert_includes results, "recommendedWishlists"
    assert_includes results_core, '<Deferred data={["recently_viewed"]}'
    assert_includes results_core, '<Deferred data={["recommended_products"]}'
    assert_includes results_core, 'data={["recommended_wishlists"]}'
    assert_includes results_core, "<RecommendedProductsSkeleton />"
    assert_includes results_core, "<RecommendedWishlists wishlists={null}"
    assert_equal 3, results_core.scan("Slot !== undefined").count
    assert_includes results_core, "const recommendedWishlistsTitle = wishlistTaxonomy"
    assert_includes results_core, ": \"Wishlists you might like\""
    assert_includes react_types, "function use<T>(usable: PromiseLike<T>): T;"
    assert_includes recently_viewed, 'export type { RecentlyViewedProps } from "$app/components/Discover/RecentlyViewed.types"'
    assert_not_includes results_core, "$app/components/Discover/DiscoverPage"
  end

  test "keeps the Discover header and Black Friday hero server-owned" do
    header = COMPONENT_DIRECTORY.join("Discover/DiscoverHeader.tsx")
    hero = COMPONENT_DIRECTORY.join("Discover/BlackFridayHero.tsx")
    results = COMPONENT_DIRECTORY.join("Discover/DiscoverResults.client.tsx").read
    results_core = COMPONENT_DIRECTORY.join("Discover/DiscoverResultsCore.client.tsx").read

    [header, hero].each do |component|
      assert_predicate component, :file?
      assert_not component.read.start_with?('"use client";')
    end
    assert_includes header.read, "forceDomain"
    assert_includes header.read, "Routes.discover_path"
    assert_includes header.read, "Routes.discover_url"
    assert_includes hero.read, "black_friday.svg"
    assert_includes results, "blackFridayHero: React.ReactNode"
    assert_includes results_core, "useScrollToElement"
    assert_includes results_core, "blackFridayHero != null"
    assert_includes results_core, "{blackFridayHero}"
    assert_includes results_core, "ref={resultsRef}"
    assert_not_includes results_core, "black_friday.svg"
    assert_not_includes results_core, "illustrations/sale.svg"
    assert_not_includes results_core, "formatPriceCentsWithCurrencySymbol"
    assert_not_includes results_core, "$app/components/Discover/DiscoverPage"
  end

  test "streams Discover async props through the server composition" do
    page = COMPONENT_DIRECTORY.join("Discover/DiscoverPage.tsx").read

    %w[recommended_products recommended_wishlists recently_viewed].each do |prop|
      assert_includes page, %(getReactOnRailsAsyncProp("#{prop}"))
    end
    assert_equal 3, page.scan("<React.Suspense").count
    assert_includes page, "<AsyncRecentlyViewed"
    assert_includes page, "<AsyncRecommendedProducts"
    assert_includes page, "<AsyncRecommendedWishlists"
    assert_includes page, "recentlyViewed={recentlyViewed}"
    assert_includes page, "recommendedProducts={recommendedProducts}"
    assert_includes page, "recommendedWishlists={recommendedWishlists}"
  end

  test "composes the Discover hero and public roots without legacy client edges" do
    layout = COMPONENT_DIRECTORY.join("Discover/DiscoverLayout.tsx")
    page = COMPONENT_DIRECTORY.join("Discover/DiscoverPage.tsx")
    powered_by_footer = COMPONENT_DIRECTORY.join("PoweredByFooter.tsx")
    product_inertia = COMPONENT_DIRECTORY.join("PublicPages/ProductPageInertia.client.tsx")
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read
    profile_compatibility = COMPONENT_DIRECTORY.join("Profile/ProfileRscCompatibilityPage.client.tsx").read
    page_shell = COMPONENT_DIRECTORY.join("PublicPages/PageShell.client.tsx").read
    wrapper = COMPONENT_DIRECTORY.join("PublicPages/ror_components/DiscoverPage.tsx").read
    client_graph = transitive_javascript_imports(CLIENT_COMPONENTS.map { COMPONENT_DIRECTORY.join(_1) })

    [layout, page].each do |component|
      assert_predicate component, :file?
      assert_not component.read.start_with?('"use client";')
    end
    [powered_by_footer, product_inertia].each do |component|
      assert component.read.start_with?('"use client";')
    end
    assert_includes page.read, "<BlackFridayHero"
    assert_includes page.read, "blackFridayHero={blackFridayHero}"
    assert_includes page.read, "<PageShell"
    assert_includes page_shell, "component: string"
    assert_includes page_shell, "<Alert initial={global.flash ?? null} />"
    assert_not_includes page_shell, "export const buildInertiaPage"
    assert_includes profile_compatibility, 'component="Users/Show"'
    assert_includes product_page, 'productProps.page_layout === "discover" && taxonomiesForNav'
    assert_includes product_page, "<ProductPageInertia"
    assert_includes product_page, "<DiscoverLayout"
    assert_includes product_page, "forceDomain"
    assert_includes wrapper, "$app/components/Discover/DiscoverPage"
    %w[Discover/Index.tsx Discover/Layout.tsx Discover/Nav.tsx].each do |legacy|
      assert_not_includes client_graph, COMPONENT_DIRECTORY.join(legacy)
    end
    assert_not_includes client_graph, Rails.root.join("app/javascript/pages/Discover/Index.tsx")
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
