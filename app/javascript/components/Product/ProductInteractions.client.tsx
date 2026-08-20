"use client";

import * as React from "react";

import { PoweredByFooter } from "$app/components/PoweredByFooter";
import type { ServerContent } from "$app/components/Product";
import { Layout as ProductLayout, type Props as ProductLayoutProps } from "$app/components/Product/Layout";
import { Layout as ProfileLayout } from "$app/components/Profile/Layout";

export type ProductInteractionsProps = ProductLayoutProps & {
  page_layout: "discover" | "profile" | null;
  serverContent: ServerContent;
};

export default function ProductInteractions({ page_layout: pageLayout, ...productProps }: ProductInteractionsProps) {
  const creatorProfile = "creator_profile" in productProps ? productProps.creator_profile : undefined;

  if (pageLayout === "discover") return <ProductLayout cart hasHero {...productProps} />;

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
}
