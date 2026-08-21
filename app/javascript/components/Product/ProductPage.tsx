import * as React from "react";

import type { MetaTag } from "$app/layouts/components/MetaTags";
import type { Taxonomy } from "$app/utils/discover";

import DiscoverLayout from "$app/components/Discover/DiscoverLayout";
import type { ServerContent } from "$app/components/Product/Interactive";
import {
  type ProductContentProps,
  ProductAvailabilityNotice,
  ProductBundleItemContent,
  ProductDescriptionContent,
  ProductDetails,
  ProductMembershipNotices,
  ProductReceiptContent,
  ProductSellerAndRatings,
  ProductSellerReputation,
  ProductStreamingNotice,
  ProductTitle,
} from "$app/components/Product/ProductContent";
import ProductInteractions, { type ProductInteractionsProps } from "$app/components/Product/ProductInteractions.client";
import { ProfilePostsContent } from "$app/components/Profile/ProfilePostsContent";
import { ProfileRichTextContent } from "$app/components/Profile/ProfileRichTextContent";
import { ProfileSectionFrame } from "$app/components/Profile/ProfileSectionFrame";
import PageShell, { type GlobalProps } from "$app/components/PublicPages/PageShell.client";

export type ProductPageProps = Omit<
  ProductInteractionsProps,
  "featuredProductServerContent" | "profileRichTextServerContent" | "serverContent" | "serverProfileSections"
> & {
  _inertia_meta?: MetaTag[];
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
  ): ServerContent => ({
    availabilityNotice: <ProductAvailabilityNotice content={content} />,
    bundleItems: Object.fromEntries(
      product.bundle_products.map((bundleProduct) => [
        bundleProduct.id,
        <ProductBundleItemContent key={bundleProduct.id} product={bundleProduct} />,
      ]),
    ),
    description: <ProductDescriptionContent content={content} />,
    membershipNotices: <ProductMembershipNotices content={content} />,
    receipt: purchase ? (
      <ProductReceiptContent
        customViewContentButtonText={product.custom_view_content_button_text}
        isBundle={product.bundle_products.length > 0}
        isPreorder={product.preorder !== null}
        permalink={product.permalink}
        purchase={purchase}
      />
    ) : null,
    title: <ProductTitle content={content} />,
    sellerAndRatings: <ProductSellerAndRatings content={content} />,
    details: <ProductDetails content={content} />,
    sellerReputation: <ProductSellerReputation content={content} />,
    streamingNotice: <ProductStreamingNotice content={content} />,
  });
  const interactionProps = {
    ...productProps,
    cart: productProps.page_layout === "discover" || productProps.page_layout === "profile",
    hasHero: productProps.page_layout === "discover",
    serverContent: toServerContent(rscProductContent, productProps),
    featuredProductServerContent: Object.fromEntries(
      Object.entries(rscFeaturedProductContent).flatMap(([sectionId, content]) => {
        const section = productProps.sections.find(({ id }) => id === sectionId);
        return section?.type === "SellerProfileFeaturedProductSection" && section.props
          ? [[sectionId, toServerContent(content, section.props)]]
          : [];
      }),
    ),
    serverProfileSections: Object.fromEntries(
      productProps.sections.flatMap((section) =>
        section.type === "SellerProfilePostsSection"
          ? [
              [
                section.id,
                <ProfileSectionFrame key={section.id} id={section.id} header={section.header}>
                  <ProfilePostsContent posts={section.posts} locale={global.locale} />
                </ProfileSectionFrame>,
              ],
            ]
          : [],
      ),
    ),
    profileRichTextServerContent: Object.fromEntries(
      productProps.sections.flatMap((section) =>
        section.type === "SellerProfileRichTextSection"
          ? [[section.id, <ProfileRichTextContent key={section.id} content={section.text} />]]
          : [],
      ),
    ),
  } satisfies ProductInteractionsProps;
  const product = <ProductInteractions {...interactionProps} />;

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
