import * as React from "react";

import type { MetaTag } from "$app/layouts/components/MetaTags";
import type { Taxonomy } from "$app/utils/discover";

import DiscoverLayout from "$app/components/Discover/DiscoverLayout";
import ProductInteractions, { type ProductInteractionsProps } from "$app/components/Product/ProductInteractions.client";
import PageShell, { buildInertiaPage, type GlobalProps } from "$app/components/PublicPages/PageShell.client";

export type ProductPageProps = ProductInteractionsProps & {
  _inertia_meta?: MetaTag[];
  global: GlobalProps;
  taxonomy_path?: string | null;
  taxonomies_for_nav?: Taxonomy[];
};

export default function ProductPage({
  _inertia_meta: inertiaMeta,
  global,
  taxonomy_path: taxonomyPath,
  taxonomies_for_nav: taxonomiesForNav,
  ...productProps
}: ProductPageProps) {
  const initialPage = buildInertiaPage("links/rsc_show", global, productProps, inertiaMeta);
  const product = <ProductInteractions {...productProps} />;

  return (
    <PageShell global={global} initialPage={initialPage}>
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
