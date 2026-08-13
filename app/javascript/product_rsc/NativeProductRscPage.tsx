"use client";

import type { Page } from "@inertiajs/core";
import { App as InertiaApp } from "@inertiajs/react";
import * as React from "react";

import AppWrapper from "$app/inertia/app_wrapper";
import MetaTags, { type MetaTag } from "$app/layouts/components/MetaTags";
import type { Taxonomy } from "$app/utils/discover";

import { CurrentSellerProvider, parseCurrentSeller } from "$app/components/CurrentSeller";
import { Layout as DiscoverLayout } from "$app/components/Discover/Layout";
import { LoggedInUserProvider, parseLoggedInUser } from "$app/components/LoggedInUser";
import { Layout as ProductLayout, type Props as ProductLayoutProps } from "$app/components/Product/Layout";
import Alert from "$app/components/server-components/Alert";

type GlobalProps = React.ComponentProps<typeof AppWrapper>["global"] & {
  current_seller?: unknown;
  logged_in_user?: unknown;
};

export type NativeProductRscPageProps = ProductLayoutProps & {
  _inertia_meta?: MetaTag[];
  global: GlobalProps;
  taxonomy_path: string | null;
  taxonomies_for_nav: Taxonomy[];
};

export default function NativeProductRscPage({
  _inertia_meta: inertiaMeta,
  global,
  taxonomy_path: taxonomyPath,
  taxonomies_for_nav: taxonomiesForNav,
  ...productProps
}: NativeProductRscPageProps) {
  const inertiaPage: Page = {
    component: "links/rsc_show",
    props: { ...global, ...productProps, _inertia_meta: inertiaMeta, errors: {} },
    url: global.href,
    version: null,
    clearHistory: false,
    encryptHistory: false,
    flash: {},
    rememberedState: {},
  };

  return (
    <InertiaApp initialPage={inertiaPage} initialComponent={() => null} resolveComponent={() => () => null}>
      {() => (
        <AppWrapper global={global}>
          <MetaTags />
          <LoggedInUserProvider value={parseLoggedInUser(global.logged_in_user ?? null)}>
            <CurrentSellerProvider value={parseCurrentSeller(global.current_seller ?? null)}>
              <Alert initial={null} />
              <DiscoverLayout taxonomyPath={taxonomyPath ?? undefined} taxonomiesForNav={taxonomiesForNav} forceDomain>
                <ProductLayout cart hasHero {...productProps} />
              </DiscoverLayout>
            </CurrentSellerProvider>
          </LoggedInUserProvider>
        </AppWrapper>
      )}
    </InertiaApp>
  );
}
