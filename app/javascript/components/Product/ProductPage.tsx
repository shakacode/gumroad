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
import { PoweredByFooter } from "$app/components/PoweredByFooter";
import { Layout as ProductLayout, type Props as ProductLayoutProps } from "$app/components/Product/Layout";
import { Layout as ProfileLayout } from "$app/components/Profile/Layout";
import Alert from "$app/components/server-components/Alert";

type GlobalProps = React.ComponentProps<typeof AppWrapper>["global"] & {
  current_seller?: unknown;
  logged_in_user?: unknown;
};

export type ProductPageProps = ProductLayoutProps & {
  _inertia_meta?: MetaTag[];
  global: GlobalProps;
  page_layout: "discover" | "profile" | null;
  taxonomy_path?: string | null;
  taxonomies_for_nav?: Taxonomy[];
};

export default function ProductPage({
  _inertia_meta: inertiaMeta,
  global,
  page_layout: pageLayout,
  taxonomy_path: taxonomyPath,
  taxonomies_for_nav: taxonomiesForNav,
  ...productProps
}: ProductPageProps) {
  const creatorProfile = "creator_profile" in productProps ? productProps.creator_profile : undefined;
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

  const productPage = (() => {
    if (pageLayout === "discover" && taxonomiesForNav) {
      return (
        <DiscoverLayout taxonomyPath={taxonomyPath ?? undefined} taxonomiesForNav={taxonomiesForNav} forceDomain>
          <ProductLayout cart hasHero {...productProps} />
        </DiscoverLayout>
      );
    }

    if (pageLayout === "profile" && creatorProfile) {
      return (
        <ProfileLayout
          creatorProfile={creatorProfile}
          currencySelector
          shownCurrency={productProps.product.buyer_currency_display?.buyer_currency_shown}
        >
          <ProductLayout cart {...productProps} />
        </ProfileLayout>
      );
    }

    return (
      <>
        <ProductLayout {...productProps} />
        <PoweredByFooter
          currencySelector
          shownCurrency={productProps.product.buyer_currency_display?.buyer_currency_shown}
        />
      </>
    );
  })();

  return (
    <InertiaApp initialPage={inertiaPage} initialComponent={() => null} resolveComponent={() => () => null}>
      {() => (
        <AppWrapper global={global}>
          <MetaTags />
          <LoggedInUserProvider value={parseLoggedInUser(global.logged_in_user ?? null)}>
            <CurrentSellerProvider value={parseCurrentSeller(global.current_seller ?? null)}>
              <Alert initial={null} />
              {productPage}
            </CurrentSellerProvider>
          </LoggedInUserProvider>
        </AppWrapper>
      )}
    </InertiaApp>
  );
}
