import * as React from "react";

import type { MetaTag } from "$app/layouts/components/MetaTags";
import type { Taxonomy } from "$app/utils/discover";

import DiscoverLayout from "$app/components/Discover/DiscoverLayout";
import type { ProductDiscount, ServerContent } from "$app/components/Product/Interactive";
import ProductArticleInteractions from "$app/components/Product/ProductArticleInteractions.client";
import {
  type ProductContentProps,
  ProductAvailabilityNotice,
  ProductBundleItemContent,
  ProductCoverImage,
  ProductDescriptionContent,
  ProductDetails,
  ProductMembershipNotices,
  ProductQuantityRemaining,
  ProductReceiptContent,
  ProductReviewsContent,
  ProductSellerAndRatings,
  ProductSellerReputation,
  ProductSalesNotice,
  ProductStreamingNotice,
  ProductTitle,
  productDescriptionNeedsClientEnhancement,
} from "$app/components/Product/ProductContent";
import ProductInteractions, { type ProductInteractionsProps } from "$app/components/Product/ProductInteractions.client";
import { ProductStateProvider } from "$app/components/Product/ProductStateProvider.client";
import { ProfileFeaturedProduct } from "$app/components/Profile/ProfileFeaturedProduct.client";
import { ProfilePostsContent } from "$app/components/Profile/ProfilePostsContent";
import { ProfileProducts } from "$app/components/Profile/ProfileProducts.client";
import { profileRichTextNeedsClientEnhancement } from "$app/components/Profile/ProfileRichText";
import { ProfileRichTextContent } from "$app/components/Profile/ProfileRichTextContent";
import { ProfileRichTextEnhancement } from "$app/components/Profile/ProfileRichTextEnhancement.client";
import { ProfileSectionFrame } from "$app/components/Profile/ProfileSectionFrame";
import { ProfileSubscribe } from "$app/components/Profile/ProfileSubscribe.client";
import { ProfileWishlists } from "$app/components/Profile/ProfileWishlists.client";
import PageShell, { type GlobalProps } from "$app/components/PublicPages/PageShell.client";

export type ProductPageProps = Omit<ProductInteractionsProps, "productArticle" | "serverProfileSections"> & {
  _inertia_meta?: MetaTag[];
  discount_code: ProductDiscount;
  global: GlobalProps;
  rsc_product_content: ProductContentProps;
  rsc_featured_product_content: Record<string, ProductContentProps>;
  taxonomy_path?: string | null;
  taxonomies_for_nav?: Taxonomy[];
};

export default function ProductPage({
  _inertia_meta: inertiaMeta,
  global,
  rsc_product_content: rscProductContent,
  rsc_featured_product_content: rscFeaturedProductContent,
  taxonomy_path: taxonomyPath,
  taxonomies_for_nav: taxonomiesForNav,
  ...productProps
}: ProductPageProps) {
  const toServerContent = (
    content: ProductContentProps,
    { product, purchase }: Pick<ProductInteractionsProps, "product" | "purchase">,
  ): ServerContent => {
    const initialCover = product.covers.find(({ id }) => id === product.main_cover_id) ?? product.covers[0];

    return {
      availabilityNotice: <ProductAvailabilityNotice content={content} />,
      bundleItems: Object.fromEntries(
        product.bundle_products.map((bundleProduct) => [
          bundleProduct.id,
          <ProductBundleItemContent key={bundleProduct.id} product={bundleProduct} />,
        ]),
      ),
      description: <ProductDescriptionContent content={content} />,
      descriptionNeedsClientEnhancement: productDescriptionNeedsClientEnhancement(content.description_html),
      initialCover: initialCover
        ? {
            id: initialCover.id,
            content: <ProductCoverImage cover={initialCover} productName={product.name} />,
          }
        : null,
      membershipNotices: <ProductMembershipNotices content={content} />,
      quantityRemaining: <ProductQuantityRemaining quantityRemaining={product.quantity_remaining} />,
      receipt: purchase ? (
        <ProductReceiptContent
          customViewContentButtonText={product.custom_view_content_button_text}
          isBundle={product.bundle_products.length > 0}
          isPreorder={product.preorder !== null}
          permalink={product.permalink}
          purchase={purchase}
        />
      ) : null,
      reviews:
        product.ratings && product.ratings.count > 0 ? <ProductReviewsContent ratings={product.ratings} /> : null,
      salesNotice: (
        <ProductSalesNotice
          salesCount={product.sales_count}
          isMembership={product.recurrences !== null}
          isPreorder={product.preorder !== null}
          hasPaidPrice={product.price_cents > 0 || product.options.some((option) => option.price_difference_cents)}
          locale={global.locale}
        />
      ),
      title: <ProductTitle content={content} />,
      sellerAndRatings: <ProductSellerAndRatings content={content} />,
      details: <ProductDetails content={content} />,
      sellerReputation: <ProductSellerReputation content={content} />,
      streamingNotice: <ProductStreamingNotice content={content} />,
    };
  };
  const serverContent = toServerContent(rscProductContent, productProps);
  const ctaLabel =
    productProps.page_layout === "discover" || productProps.page_layout === "profile" ? "Add to cart" : undefined;
  const productArticle = (
    <ProductArticleInteractions
      product={productProps.product}
      purchase={productProps.purchase}
      wishlists={productProps.wishlists}
      ctaLabel={ctaLabel}
      serverContent={serverContent}
    />
  );
  const interactionProps = {
    ...productProps,
    cart: productProps.page_layout === "discover" || productProps.page_layout === "profile",
    hasHero: productProps.page_layout === "discover",
    serverProfileSections: Object.fromEntries(
      productProps.sections.flatMap((section) => {
        if (section.type === "SellerProfileProductsSection") {
          return [
            [
              section.id,
              <ProfileSectionFrame key={section.id} id={section.id} header={section.header}>
                <ProfileProducts
                  section={section}
                  creatorProfile={productProps.creator_profile}
                  currencyCode={productProps.currency_code}
                />
              </ProfileSectionFrame>,
            ],
          ];
        }
        if (section.type === "SellerProfilePostsSection") {
          return [
            [
              section.id,
              <ProfileSectionFrame key={section.id} id={section.id} header={section.header}>
                <ProfilePostsContent posts={section.posts} locale={global.locale} />
              </ProfileSectionFrame>,
            ],
          ];
        }
        if (section.type === "SellerProfileRichTextSection") {
          const serverContent = <ProfileRichTextContent content={section.text} />;
          return [
            [
              section.id,
              <ProfileSectionFrame key={section.id} id={section.id} header={section.header}>
                {profileRichTextNeedsClientEnhancement(section.text) ? (
                  <ProfileRichTextEnhancement content={section.text} fallback={serverContent} />
                ) : (
                  serverContent
                )}
              </ProfileSectionFrame>,
            ],
          ];
        }
        if (section.type === "SellerProfileSubscribeSection") {
          return [
            [
              section.id,
              <ProfileSectionFrame key={section.id} id={section.id} header={section.header}>
                <ProfileSubscribe creatorProfile={productProps.creator_profile} buttonLabel={section.button_label} />
              </ProfileSectionFrame>,
            ],
          ];
        }
        if (section.type === "SellerProfileWishlistsSection") {
          return [
            [
              section.id,
              <ProfileSectionFrame key={section.id} id={section.id} header={section.header}>
                <ProfileWishlists wishlists={section.wishlists} />
              </ProfileSectionFrame>,
            ],
          ];
        }
        const content = rscFeaturedProductContent[section.id];
        return [
          [
            section.id,
            <ProfileSectionFrame key={section.id} id={section.id} header={section.header}>
              {section.props ? (
                <ProfileFeaturedProduct
                  props={section.props}
                  serverContent={content ? toServerContent(content, section.props) : null}
                />
              ) : null}
            </ProfileSectionFrame>,
          ],
        ];
      }),
    ),
  } satisfies Omit<ProductInteractionsProps, "productArticle">;
  const product = (
    <ProductStateProvider product={productProps.product} initialDiscountCode={productProps.discount_code}>
      <ProductInteractions {...interactionProps} productArticle={productArticle} />
    </ProductStateProvider>
  );

  return (
    <PageShell component="links/rsc_show" global={global} inertiaMeta={inertiaMeta} pageProps={productProps}>
      {productProps.page_layout === "discover" && taxonomiesForNav ? (
        <DiscoverLayout
          currentSeller={global.current_seller}
          domainSettings={global.domain_settings}
          taxonomyPath={taxonomyPath ?? undefined}
          taxonomiesForNav={taxonomiesForNav}
          forceDomain
        >
          {product}
        </DiscoverLayout>
      ) : (
        product
      )}
    </PageShell>
  );
}
