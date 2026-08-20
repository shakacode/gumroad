import * as React from "react";

import type { MetaTag } from "$app/layouts/components/MetaTags";
import type { Taxonomy } from "$app/utils/discover";

import DiscoverLayout from "$app/components/Discover/DiscoverLayout";
import DiscoverResults from "$app/components/Discover/DiscoverResults.client";
import PageShell, { type GlobalProps } from "$app/components/PublicPages/PageShell.client";

export type DiscoverPageProps = Record<string, unknown> & {
  _inertia_meta?: MetaTag[];
  global: GlobalProps;
  taxonomies_for_nav: Taxonomy[];
};

export default function DiscoverPage({ _inertia_meta: inertiaMeta, global, ...discoverProps }: DiscoverPageProps) {
  const url = new URL(global.href);
  const taxonomyPath = url.pathname === Routes.discover_path() ? undefined : url.pathname.replace(/^\//u, "");

  return (
    <PageShell component="Discover/Index" global={global} inertiaMeta={inertiaMeta} pageProps={discoverProps}>
      <DiscoverLayout
        taxonomyPath={taxonomyPath}
        taxonomiesForNav={discoverProps.taxonomies_for_nav}
        query={url.searchParams.get("query") ?? undefined}
        showTaxonomy
      >
        <DiscoverResults renderHeader={false} />
      </DiscoverLayout>
    </PageShell>
  );
}
