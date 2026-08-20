import * as React from "react";

import type { MetaTag } from "$app/layouts/components/MetaTags";
import type { Taxonomy } from "$app/utils/discover";

import DiscoverLayout from "$app/components/Discover/DiscoverLayout";
import type { ServerContent } from "$app/components/Product/Interactive";
import {
  type ProductContentProps,
  ProductAvailabilityNotice,
  ProductDescriptionContent,
  ProductDetails,
  ProductMembershipNotices,
  ProductSellerAndRatings,
  ProductSellerReputation,
  ProductStreamingNotice,
  ProductTitle,
} from "$app/components/Product/ProductContent";
import ProductInteractions, { type ProductInteractionsProps } from "$app/components/Product/ProductInteractions.client";
import PageShell, { type GlobalProps } from "$app/components/PublicPages/PageShell.client";

export type ProductPageProps = Omit<ProductInteractionsProps, "featuredProductServerContent" | "serverContent"> & {
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
  const toServerContent = (content: ProductContentProps): ServerContent => ({
    availabilityNotice: <ProductAvailabilityNotice content={content} />,
    description: <ProductDescriptionContent content={content} />,
    membershipNotices: <ProductMembershipNotices content={content} />,
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
    serverContent: toServerContent(rscProductContent),
    featuredProductServerContent: Object.fromEntries(
      Object.entries(rscFeaturedProductContent).map(([sectionId, content]) => [sectionId, toServerContent(content)]),
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
