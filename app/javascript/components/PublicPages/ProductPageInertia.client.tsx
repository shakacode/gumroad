"use client";

import type { Page } from "@inertiajs/core";
import { App as InertiaApp } from "@inertiajs/react";
import * as React from "react";

import type { MetaTag } from "$app/layouts/components/MetaTags";
import MetaTags from "$app/layouts/components/MetaTags";

import type { ProductGlobalProps } from "$app/components/PublicPages/ProductPageShell.client";

export default function ProductPageInertia({
  children,
  global,
  inertiaMeta,
  pageProps,
}: {
  children: React.ReactNode;
  global: ProductGlobalProps;
  inertiaMeta?: MetaTag[] | undefined;
  pageProps: Record<string, unknown>;
}) {
  const initialPage: Page = {
    component: "links/rsc_show",
    props: { ...global, ...pageProps, _inertia_meta: inertiaMeta, errors: {} },
    url: global.href,
    version: null,
    clearHistory: false,
    encryptHistory: false,
    flash: {},
    rememberedState: {},
  };

  return (
    <InertiaApp initialPage={initialPage} initialComponent={() => null} resolveComponent={() => () => null}>
      {() => (
        <>
          <MetaTags />
          {children}
        </>
      )}
    </InertiaApp>
  );
}
