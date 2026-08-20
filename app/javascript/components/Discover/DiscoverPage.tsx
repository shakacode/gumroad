"use client";

import * as React from "react";

import type { MetaTag } from "$app/layouts/components/MetaTags";
import DiscoverIndex from "$app/pages/Discover/Index";

import PageShell, { buildInertiaPage, type GlobalProps } from "$app/components/PublicPages/PageShell.client";

export type DiscoverPageProps = Record<string, unknown> & {
  _inertia_meta?: MetaTag[];
  global: GlobalProps;
};

export default function DiscoverPage({ _inertia_meta: inertiaMeta, global, ...discoverProps }: DiscoverPageProps) {
  const initialPage = buildInertiaPage("Discover/Index", global, discoverProps, inertiaMeta);

  return (
    <PageShell global={global} initialPage={initialPage}>
      <DiscoverIndex />
    </PageShell>
  );
}
