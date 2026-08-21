# frozen_string_literal: true

require "test_helper"

class ProductRscImportGraphTest < ActiveSupport::TestCase
  COMPONENT_DIRECTORY = Rails.root.join("app/javascript/components")
  CLIENT_COMPONENTS = %w[
    Discover/Cart.client.tsx
    Discover/DiscoverResults.client.tsx
    Discover/MobileMenu.client.tsx
    Discover/Search.client.tsx
    Product/CoffeeProduct.tsx
    Product/ProductAnalytics.client.tsx
    Product/ProductBundle.client.tsx
    Product/ProductDescription.client.tsx
    Product/ProductEditButton.client.tsx
    Product/ProductInteractions.client.tsx
    Product/ProductLicenseKeyLookup.client.tsx
    Product/ProductMedia.client.tsx
    Product/ProductPrice.client.tsx
    Product/ProductPreorderNotice.client.tsx
    Product/ProductPurchaseControls.client.tsx
    Product/ProductRefundPolicy.client.tsx
    Product/ProductSecondaryActions.client.tsx
    Product/ProductReceiptActions.client.tsx
    Product/ProductReviews.client.tsx
    Product/ProductStateProvider.client.tsx
    Product/useSelectionFromUrl.client.ts
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
    Product/ProductArticle.tsx
    Product/ProductContent.tsx
    Product/ProductPage.tsx
    Product/ProductRatingsSummary.tsx
    Product/ProductSingleCover.tsx
    Profile/ProfileFeaturedProduct.tsx
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
    product_clients = CLIENT_COMPONENTS.grep(%r{\AProduct/})
    client_graph = transitive_javascript_imports(product_clients.map { COMPONENT_DIRECTORY.join(_1) })

    assert_not_includes client_graph, Rails.root.join("app/javascript/components/Product/index.tsx")
    assert_not_includes client_graph, Rails.root.join("app/javascript/components/Product/Layout.tsx")
    assert_not_includes client_graph, Rails.root.join("app/javascript/components/Product/LegacyProduct.tsx")
    assert_not_includes client_graph, Rails.root.join("app/javascript/components/Product/Interactive.tsx")
    assert_not_includes client_graph, Rails.root.join("app/javascript/components/Product/ProductArticle.tsx")
    assert_not_includes client_graph, Rails.root.join("app/javascript/components/Product/ProductContent.tsx")
  end

  test "composes product state around server-owned children" do
    provider = COMPONENT_DIRECTORY.join("Product/ProductStateProvider.client.tsx")
    selection_from_url = COMPONENT_DIRECTORY.join("Product/useSelectionFromUrl.client.ts")
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    product_article = COMPONENT_DIRECTORY.join("Product/ProductArticle.tsx").read
    interactions = COMPONENT_DIRECTORY.join("Product/ProductInteractions.client.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read

    assert_predicate provider, :file?
    assert_predicate selection_from_url, :file?
    assert selection_from_url.read.start_with?('"use client";')
    assert_includes provider.read, "children: React.ReactNode"
    assert_includes provider.read, "useSelectionFromUrl(product)"
    assert_includes provider.read, "$app/components/Product/useSelectionFromUrl.client"
    assert_not_includes provider.read, "useSelectionFromUrl } from \"$app/components/Product/Interactive\""
    assert_includes interactive_product, 'export { useSelectionFromUrl } from "$app/components/Product/useSelectionFromUrl.client"'
    assert_not_includes interactive_product, "export const useSelectionFromUrl"
    assert_includes provider.read, "React.useState(initialDiscountCode)"
    assert_includes interactions, "useProductState()"
    assert_not_includes interactions, "useSelectionFromUrl(product)"
    assert_includes product_article, "<ProductPriceFromState"
    assert_includes product_article, "<ProductBundleFromState"
    assert_includes product_article, "<ProductPurchaseControlsFromState"
    assert_includes product_article, "<ProductSecondaryActionsFromState"
    assert_includes product_page, "product={productProps.product}"
    assert_includes product_page, "initialDiscountCode={productProps.discount_code}"
    assert_includes product_page, "<ProductInteractions {...interactionProps} productArticle={productArticle} />"
  end

  test "passes the product article through the layout client boundary" do
    product_article = COMPONENT_DIRECTORY.join("Product/ProductArticle.tsx")
    interactions = COMPONENT_DIRECTORY.join("Product/ProductInteractions.client.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read

    assert_predicate product_article, :file?
    assert_not product_article.read.start_with?('"use client";')
    assert_not_includes interactions, "InteractiveProduct"
    assert_includes interactions, "productArticle: React.ReactNode"
    assert_includes interactions, "{productArticle}"
    assert_includes product_page, "<ProductArticle"
    assert_includes product_page, "productArticle={productArticle}"
    assert_not COMPONENT_DIRECTORY.join("Product/ProductArticleInteractions.client.tsx").exist?
  end

  test "isolates the browser-aware product edit control" do
    edit_button = COMPONENT_DIRECTORY.join("Product/ProductEditButton.client.tsx")
    product_article = COMPONENT_DIRECTORY.join("Product/ProductArticle.tsx").read
    layout = COMPONENT_DIRECTORY.join("Product/Layout.tsx").read
    layout_controls = COMPONENT_DIRECTORY.join("Product/LayoutControls.tsx").read

    assert_predicate edit_button, :file?
    assert edit_button.read.start_with?('"use client";')
    assert_includes edit_button.read, "useAppDomain()"
    assert_includes edit_button.read, "<NavigationButton"
    assert_includes product_article, "$app/components/Product/ProductEditButton.client"
    assert_includes product_article, "<ProductEditButton product={product} />"
    assert_includes layout, "$app/components/Product/ProductEditButton.client"
    assert_includes layout, "<ProductEditButton product={product} />"
    assert_not_includes layout_controls, "export const EditButton"
    assert_not_includes layout_controls, "useAppDomain"
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

  test "renders a single static image cover without the client carousel" do
    covers = COMPONENT_DIRECTORY.join("Product/Covers/index.tsx").read
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    product_article = COMPONENT_DIRECTORY.join("Product/ProductArticle.tsx").read
    product_media = COMPONENT_DIRECTORY.join("Product/ProductMedia.client.tsx")
    product_content = COMPONENT_DIRECTORY.join("Product/ProductContent.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read
    single_cover = COMPONENT_DIRECTORY.join("Product/ProductSingleCover.tsx")

    assert_predicate product_media, :file?
    assert product_media.read.start_with?('"use client";')
    assert_predicate single_cover, :file?
    assert_not single_cover.read.start_with?('"use client";')
    assert_includes single_cover.read, 'cover?.type === "image"'
    assert_includes single_cover.read, "aspectRatio"
    assert_includes single_cover.read, "MAX_PORTRAIT_FRAME_HEIGHT"
    assert_includes covers, "initialContent={initialCover?.id === cover.id ? initialCover.content : null}"
    assert_includes interactive_product, "<ProductMedia"
    assert_includes product_article, "singleStaticImageCover(product.covers)"
    assert_includes product_article, "<ProductSingleCover cover={staticCover} productName={product.name} />"
    assert_includes product_article, "<ProductMedia"
    assert_includes product_media.read, "initialCover={initialCover}"
    assert_includes product_media.read, "useOnChange(() => setActiveCoverId(mainCoverId), [mainCoverId])"
    assert_not_includes interactive_product, "useOnChange"
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
    product_bundle = COMPONENT_DIRECTORY.join("Product/ProductBundle.client.tsx")
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read
    client_graph = transitive_javascript_imports([COMPONENT_DIRECTORY.join("Product/ProductInteractions.client.tsx")])

    assert_predicate product_bundle, :file?
    assert product_bundle.read.start_with?('"use client";')
    assert_includes product_bundle.read, "bundleItems[bundleProduct.id]"
    assert_includes product_bundle.read, "getBundleComparisonPriceCents"
    assert_includes product_bundle.read, "export const ProductBundleFromState"
    assert_includes product_bundle.read, "const { selection, discountCode } = useProductState()"
    assert_includes product_bundle.read,
                    "<ProductBundle product={product} selection={selection} discountCode={discountCode} bundleItems={bundleItems} />"
    assert_includes interactive_product, "<ProductBundle"
    assert_not_includes interactive_product, "<CartItemList>"
    assert_not_includes interactive_product, "getBundleComparisonPriceCents"
    assert_includes product_page, "<ProductBundleItemContent"
    assert_not_includes client_graph, COMPONENT_DIRECTORY.join("Product/ProductContent.tsx")
  end

  test "isolates live product pricing from the article composition" do
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    product_price = COMPONENT_DIRECTORY.join("Product/ProductPrice.client.tsx")

    assert_predicate product_price, :file?
    assert product_price.read.start_with?('"use client";')
    assert_includes product_price.read, "<PriceTag"
    assert_includes product_price.read, "export const ProductPriceFromState"
    assert_includes product_price.read, "const { selection, discountCode } = useProductState()"
    assert_includes product_price.read, "<ProductPrice product={product} selection={selection} discountCode={discountCode} />"
    assert_includes interactive_product,
                    "<ProductPrice product={product} selection={selection} discountCode={discountCode} />"
    assert_not_includes interactive_product, 'import { PriceTag }'
    assert_not_includes interactive_product, "buyerLocalPriceCentsForSelection("
  end

  test "keeps the sticky ratings summary out of the legacy article module" do
    ratings_summary = COMPONENT_DIRECTORY.join("Product/ProductRatingsSummary.tsx")
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    layout_controls = COMPONENT_DIRECTORY.join("Product/LayoutControls.tsx").read

    assert_predicate ratings_summary, :file?
    assert_includes ratings_summary.read, "<RatingStars"
    assert_includes layout_controls, "$app/components/Product/ProductRatingsSummary"
    assert_includes layout_controls, "<ProductRatingsSummary"
    assert_not_includes layout_controls, "RatingsSummary,"
    assert_includes interactive_product,
                    'export { ProductRatingsSummary as RatingsSummary } from "$app/components/Product/ProductRatingsSummary"'
    assert_not_includes interactive_product, "export const RatingsSummary"
  end

  test "isolates product configuration and purchase behavior" do
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    purchase_controls = COMPONENT_DIRECTORY.join("Product/ProductPurchaseControls.client.tsx")

    assert_predicate purchase_controls, :file?
    assert purchase_controls.read.start_with?('"use client";')
    assert_includes purchase_controls.read, "<ConfigurationSelector"
    assert_includes purchase_controls.read, "<CtaButton"
    assert_includes purchase_controls.read, "<DiscountExpirationCountdown"
    assert_includes purchase_controls.read, "<SubscriptionChoiceModal"
    assert_includes purchase_controls.read, 'import("$app/components/Product/SubscriptionChoiceModal")'
    assert_not_includes purchase_controls.read, "import { SubscriptionChoiceModal }"
    assert_includes purchase_controls.read, "export const ProductPurchaseControlsFromState"
    assert_includes purchase_controls.read, "const productState = useProductState()"
    assert_includes purchase_controls.read, 'setDiscountCode({ valid: false, error_code: "inactive" })'
    assert_includes interactive_product, "<ProductPurchaseControls"
    assert_not_includes interactive_product, 'import { CtaButton }'
    assert_not_includes interactive_product, 'import { DiscountExpirationCountdown }'
    assert_not_includes interactive_product, 'import { SubscriptionChoiceModal }'
    assert_not_includes interactive_product, "useLoggedInUser"
  end

  test "isolates share and refund actions from the article composition" do
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    product_article = COMPONENT_DIRECTORY.join("Product/ProductArticle.tsx").read
    refund_policy = COMPONENT_DIRECTORY.join("Product/ProductRefundPolicy.client.tsx")
    refund_policy_modal = COMPONENT_DIRECTORY.join("Product/ProductRefundPolicyModal.tsx")
    secondary_actions = COMPONENT_DIRECTORY.join("Product/ProductSecondaryActions.client.tsx")

    assert_predicate refund_policy, :file?
    assert refund_policy.read.start_with?('"use client";')
    assert_includes refund_policy.read, 'import("$app/components/Product/ProductRefundPolicyModal")'
    assert_includes refund_policy.read, "React.lazy"
    assert_includes refund_policy.read, "fetchWithOneRetry"
    assert_not_includes refund_policy.read, 'from "$app/components/Modal"'
    assert_not_includes refund_policy.read, "useUserAgentInfo"
    assert_not_includes refund_policy.read, "trackUserProductAction"
    assert_predicate refund_policy_modal, :file?
    assert_includes refund_policy_modal.read, "<Modal"
    assert_includes refund_policy_modal.read, "useUserAgentInfo()"
    assert_includes refund_policy_modal.read, "trackUserProductAction"
    assert_predicate secondary_actions, :file?
    assert secondary_actions.read.start_with?('"use client";')
    assert_includes secondary_actions.read, "<ShareSection"
    assert_not_includes secondary_actions.read, "<Modal"
    assert_not_includes secondary_actions.read, "RefundPolicyInfo"
    assert_not_includes secondary_actions.read, "useUserAgentInfo"
    assert_includes secondary_actions.read, "export const ProductSecondaryActionsFromState"
    assert_includes secondary_actions.read, "const { selection } = useProductState()"
    assert_includes secondary_actions.read, "<ProductSecondaryActions product={product} selection={selection} wishlists={wishlists} />"
    assert_includes product_article, "product.refund_policy?.fine_print ?"
    assert_includes product_article,
                    "<ProductRefundPolicy refundPolicy={product.refund_policy} permalink={product.permalink} />"
    assert_includes product_article, '<div className="text-center">{product.refund_policy.title}</div>'
    assert_includes interactive_product, "<ProductSecondaryActions"
    assert_includes interactive_product,
                    "<ProductRefundPolicy refundPolicy={product.refund_policy} permalink={product.permalink} />"
    assert_not_includes interactive_product, 'import { ShareSection }'
    assert_not_includes interactive_product, "RefundPolicyInfo"
    assert_not_includes interactive_product, "useUserAgentInfo"
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

  test "isolates the license-key lookup domain behavior" do
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    license_key_lookup = COMPONENT_DIRECTORY.join("Product/ProductLicenseKeyLookup.client.tsx")

    assert_predicate license_key_lookup, :file?
    assert license_key_lookup.read.start_with?('"use client";')
    assert_includes license_key_lookup.read, "useDomains()"
    assert_includes license_key_lookup.read, "Routes.license_key_lookup_url"
    assert_includes interactive_product, "<ProductLicenseKeyLookup"
    assert_not_includes interactive_product, "LicenseKeyLookupPrompt"
    assert_not_includes interactive_product, "useDomains"
  end

  test "renders deterministic product notices on the server and formats preorder dates on the client" do
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    product_content = COMPONENT_DIRECTORY.join("Product/ProductContent.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read
    preorder_notice = COMPONENT_DIRECTORY.join("Product/ProductPreorderNotice.client.tsx")

    assert_includes product_content, "export const ProductQuantityRemaining"
    assert_includes product_content, "export const ProductSalesNotice"
    assert_includes product_page, "quantityRemaining: <ProductQuantityRemaining"
    assert_includes product_page, "<ProductSalesNotice"
    assert_includes product_page, "locale={global.locale}"
    assert_includes interactive_product, "serverContent.quantityRemaining"
    assert_includes interactive_product, "serverContent.salesNotice"
    assert_predicate preorder_notice, :file?
    assert preorder_notice.read.start_with?('"use client";')
    assert_includes preorder_notice.read, "formatDate(parseISO(releaseDate))"
    assert_includes interactive_product, "<ProductPreorderNotice"
    assert_not_includes interactive_product, "parseISO"
    assert_not_includes interactive_product, "formatDate"
    assert_not_includes interactive_product, "<Ribbon"
    assert_not_includes interactive_product, "<Alert"
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

  test "streams the ratings summary before loading written reviews on browser idle" do
    reviews_boundary = COMPONENT_DIRECTORY.join("Product/ProductReviews.client.tsx")
    reviews = COMPONENT_DIRECTORY.join("Product/ProductReviews.tsx")
    enhancement = COMPONENT_DIRECTORY.join("Product/ProductReviewsEnhancement.tsx")
    interactive_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx").read
    product_content = COMPONENT_DIRECTORY.join("Product/ProductContent.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read
    client_graph = transitive_javascript_imports([COMPONENT_DIRECTORY.join("Product/ProductInteractions.client.tsx")])

    assert_predicate reviews_boundary, :file?
    assert_predicate reviews, :file?
    assert_predicate enhancement, :file?
    assert_includes reviews_boundary.read, 'export { ProductReviews } from "$app/components/Product/ProductReviews"'
    assert_includes interactive_product, "initialContent={serverContent.reviews}"
    assert_not_includes interactive_product, "scheduleProductReviewsLoad"
    assert_not_includes interactive_product, "$app/data/product_reviews"
    assert_not_includes interactive_product, "useRunOnce(() => void loadNextPage())"
    assert_includes product_content, "export const ProductReviewsContent"
    assert_includes product_page, "<ProductReviewsContent ratings={product.ratings} />"
    assert_includes reviews.read, 'import("$app/components/Product/ProductReviewsEnhancement")'
    assert_includes reviews.read, "scheduleProductReviewsLoad"
    assert_not_includes reviews.read, "$app/data/product_reviews"
    assert_not_includes client_graph, enhancement
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
    assert_includes product_interactions, "serverProfileSections[section.id]"
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

  test "composes featured products on the server without the legacy product tree" do
    featured_product = COMPONENT_DIRECTORY.join("Profile/ProfileFeaturedProduct.tsx")
    legacy_featured_product = COMPONENT_DIRECTORY.join("Profile/ProfileFeaturedProduct.client.tsx")
    legacy_product = COMPONENT_DIRECTORY.join("Product/Interactive.tsx")
    product_interactions = COMPONENT_DIRECTORY.join("Product/ProductInteractions.client.tsx").read
    product_page = COMPONENT_DIRECTORY.join("Product/ProductPage.tsx").read
    product_page_clients = CLIENT_COMPONENTS - ["Profile/ProfileRscCompatibilityPage.client.tsx"]
    client_graph = transitive_javascript_imports(product_page_clients.map { COMPONENT_DIRECTORY.join(_1) })

    assert_predicate featured_product, :file?
    assert_not featured_product.read.start_with?('"use client";')
    assert_not_predicate legacy_featured_product, :exist?
    assert_includes featured_product.read, "<FeaturedProductStateProvider"
    assert_includes featured_product.read, "<ProductArticle"
    assert_includes featured_product.read, "<CoffeeProduct"
    assert_not_includes featured_product.read, "InteractiveProduct"
    assert_not_includes client_graph, legacy_product
    assert_includes product_interactions, 'import type { PageProps as SectionsProps }'
    assert_not_includes product_interactions, "<Section "
    assert_not_includes product_interactions, "renderFeaturedProduct"
    assert_includes product_page, "<ProfileSectionFrame"
    assert_includes product_page, "<ProfileFeaturedProduct"
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
