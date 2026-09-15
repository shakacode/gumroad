"use client";

import { App as InertiaApp } from "@inertiajs/react";
import * as React from "react";

import AppWrapper from "$app/inertia/app_wrapper";
import type { MetaTag } from "$app/layouts/components/MetaTags";
import MetaTags from "$app/layouts/components/MetaTags";

import { CurrentSellerProvider, parseCurrentSeller } from "$app/components/CurrentSeller";
import { LoggedInUserProvider, parseLoggedInUser } from "$app/components/LoggedInUser";
import { buildInertiaPage } from "$app/components/PublicPages/PageShell.client";
import Alert, { type AlertPayload } from "$app/components/server-components/Alert";

export type ProductGlobalProps = React.ComponentProps<typeof AppWrapper>["global"] & {
  current_seller?: unknown;
  detected_buyer_currency?: string | null;
  flash?: AlertPayload | null;
  logged_in_user?: unknown;
};

export default function ProductPageShell({
  children,
  global,
  inertiaMeta,
}: {
  children: React.ReactNode;
  global: ProductGlobalProps;
  inertiaMeta?: MetaTag[];
}) {
  const initialPage = buildInertiaPage("Products/Profile/Show", global, {}, inertiaMeta);

  return (
    <InertiaApp initialPage={initialPage} initialComponent={() => null} resolveComponent={() => () => null}>
      {() => (
        <AppWrapper global={global}>
          <MetaTags />
          <LoggedInUserProvider value={parseLoggedInUser(global.logged_in_user ?? null)}>
            <CurrentSellerProvider value={parseCurrentSeller(global.current_seller ?? null)}>
              <Alert initial={global.flash ?? null} />
              {children}
            </CurrentSellerProvider>
          </LoggedInUserProvider>
        </AppWrapper>
      )}
    </InertiaApp>
  );
}
