"use client";

import * as React from "react";

import AppWrapper from "$app/inertia/app_wrapper";

import { CurrentSellerProvider, parseCurrentSeller } from "$app/components/CurrentSeller";
import { LoggedInUserProvider, parseLoggedInUser } from "$app/components/LoggedInUser";
import {
  ProductHydrationProvider,
  type ProductHydrationSnapshot,
} from "$app/components/PublicPages/ProductHydration.client";
import Alert, { type AlertPayload } from "$app/components/server-components/Alert";

export type ProductGlobalProps = React.ComponentProps<typeof AppWrapper>["global"] & {
  current_seller?: unknown;
  detected_buyer_currency?: string | null;
  flash?: AlertPayload | null;
  logged_in_user?: unknown;
};

// RSC pages never navigate with Inertia, so this shell provides the same
// context tree as the Inertia shell without pulling in @inertiajs/react.
export default function ProductPageShell({
  children,
  global,
  hydrationSnapshot,
}: {
  children: React.ReactNode;
  global: ProductGlobalProps;
  hydrationSnapshot: ProductHydrationSnapshot;
}) {
  return (
    <AppWrapper global={global}>
      <LoggedInUserProvider value={parseLoggedInUser(global.logged_in_user ?? null)}>
        <CurrentSellerProvider value={parseCurrentSeller(global.current_seller ?? null)}>
          <Alert initial={global.flash ?? null} />
          <ProductHydrationProvider value={hydrationSnapshot}>{children}</ProductHydrationProvider>
        </CurrentSellerProvider>
      </LoggedInUserProvider>
    </AppWrapper>
  );
}
