"use client";

import * as React from "react";

import type { PriceSelection } from "$app/components/Product/ConfigurationSelector";
import type { ProductData, WishlistForProduct } from "$app/components/Product/Interactive";
import { useProductState } from "$app/components/Product/ProductStateProvider.client";
import { ShareSection } from "$app/components/Product/ShareSection";

export const ProductSecondaryActions = ({
  product,
  selection,
  wishlists,
}: {
  product: ProductData;
  selection: PriceSelection;
  wishlists: WishlistForProduct[];
}) => <ShareSection product={product} selection={selection} wishlists={wishlists} />;

export const ProductSecondaryActionsFromState = ({
  product,
  wishlists,
}: {
  product: ProductData;
  wishlists: WishlistForProduct[];
}) => {
  const { selection } = useProductState();

  return <ProductSecondaryActions product={product} selection={selection} wishlists={wishlists} />;
};
