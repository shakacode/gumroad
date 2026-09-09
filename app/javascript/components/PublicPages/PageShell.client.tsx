"use client";

import type { Page } from "@inertiajs/core";
import { App as InertiaApp } from "@inertiajs/react";
import * as React from "react";

import AppWrapper from "$app/inertia/app_wrapper";
import MetaTags, { type MetaTag } from "$app/layouts/components/MetaTags";

import { CurrentSellerProvider, parseCurrentSeller } from "$app/components/CurrentSeller";
import { LoggedInUserProvider, parseLoggedInUser } from "$app/components/LoggedInUser";
import Alert from "$app/components/server-components/Alert";

export type GlobalProps = React.ComponentProps<typeof AppWrapper>["global"] & {
  current_seller?: unknown;
  logged_in_user?: unknown;
};

export const buildInertiaPage = (
  component: string,
  global: GlobalProps,
  pageProps: Record<string, unknown>,
  inertiaMeta?: MetaTag[],
): Page => ({
  component,
  props: { ...global, ...pageProps, _inertia_meta: inertiaMeta, errors: {} },
  url: global.href,
  version: null,
  clearHistory: false,
  encryptHistory: false,
  flash: {},
  rememberedState: {},
});

export default function PageShell({
  children,
  global,
  initialPage,
}: {
  children: React.ReactNode;
  global: GlobalProps;
  initialPage: Page;
}) {
  return (
    <InertiaApp initialPage={initialPage} initialComponent={() => null} resolveComponent={() => () => null}>
      {() => (
        <AppWrapper global={global}>
          <MetaTags />
          <LoggedInUserProvider value={parseLoggedInUser(global.logged_in_user ?? null)}>
            <CurrentSellerProvider value={parseCurrentSeller(global.current_seller ?? null)}>
              <Alert initial={null} />
              {children}
            </CurrentSellerProvider>
          </LoggedInUserProvider>
        </AppWrapper>
      )}
    </InertiaApp>
  );
}
