"use client";

import * as React from "react";

import AppWrapper from "$app/inertia/app_wrapper";

import { CurrentSellerProvider, parseCurrentSeller } from "$app/components/CurrentSeller";
import { LoggedInUserProvider, parseLoggedInUser } from "$app/components/LoggedInUser";
import Alert from "$app/components/server-components/Alert";

export type ProductGlobalProps = React.ComponentProps<typeof AppWrapper>["global"] & {
  current_seller?: unknown;
  detected_buyer_currency?: string | null;
  logged_in_user?: unknown;
};

export default function ProductPageShell({
  children,
  global,
}: {
  children: React.ReactNode;
  global: ProductGlobalProps;
}) {
  return (
    <AppWrapper global={global}>
      <LoggedInUserProvider value={parseLoggedInUser(global.logged_in_user ?? null)}>
        <CurrentSellerProvider value={parseCurrentSeller(global.current_seller ?? null)}>
          <Alert initial={null} />
          {children}
        </CurrentSellerProvider>
      </LoggedInUserProvider>
    </AppWrapper>
  );
}
