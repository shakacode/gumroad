"use client";

import * as React from "react";

import type { ProductData, Purchase } from "$app/components/Product/Interactive";
import { CtaBar } from "$app/components/Product/LayoutControls";
import { useProductState } from "$app/components/Product/ProductStateProvider.client";

export default function ProductStickyCta({
  product,
  purchase,
  cart,
  hasHero,
}: {
  product: ProductData;
  purchase: Purchase | null;
  cart: boolean;
  hasHero: boolean;
}) {
  const { selection, ctaButtonRef, configurationSelectorRef, discountCode } = useProductState();

  return (
    <CtaBar
      product={product}
      purchase={purchase}
      discountCode={discountCode}
      ctaLabel={cart ? "Add to cart" : undefined}
      selection={selection}
      ctaButtonRef={ctaButtonRef}
      configurationSelectorRef={configurationSelectorRef}
      hasHero={hasHero}
    />
  );
}
