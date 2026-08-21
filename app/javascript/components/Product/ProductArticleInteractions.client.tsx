"use client";

import * as React from "react";

import type { Props as ProductProps, ServerContent } from "$app/components/Product/Interactive";
import { InteractiveProduct } from "$app/components/Product/Interactive";
import { EditButton } from "$app/components/Product/LayoutControls";
import { useProductState } from "$app/components/Product/ProductStateProvider.client";

type ProductArticleInteractionsProps = Pick<ProductProps, "product" | "purchase" | "wishlists"> & {
  ctaLabel?: string | undefined;
  serverContent: ServerContent;
};

export default function ProductArticleInteractions({
  product,
  purchase,
  wishlists,
  ctaLabel,
  serverContent,
}: ProductArticleInteractionsProps) {
  const { selection, setSelection, ctaButtonRef, configurationSelectorRef, discountCode, setDiscountCode } =
    useProductState();

  return (
    <>
      <EditButton product={product} />
      <InteractiveProduct
        product={product}
        purchase={purchase}
        discountCode={discountCode}
        setDiscountCode={setDiscountCode}
        ctaLabel={ctaLabel}
        selection={selection}
        setSelection={setSelection}
        ctaButtonRef={ctaButtonRef}
        configurationSelectorRef={configurationSelectorRef}
        wishlists={wishlists}
        serverContent={serverContent}
      />
    </>
  );
}
