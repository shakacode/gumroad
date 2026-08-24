import * as React from "react";

import type { CardProduct } from "$app/parsers/product";

import { RecommendedProducts } from "$app/components/Discover/RecommendedProducts.client";

export default function AsyncRecommendedProducts({
  originalLocation,
  productsPromise,
}: {
  originalLocation: string;
  productsPromise: PromiseLike<CardProduct[]>;
}) {
  const products = React.use(productsPromise);
  if (!products.length) return null;

  let isCuratedProducts = false;
  try {
    const url = new URL(products[0]?.url ?? "", originalLocation);
    isCuratedProducts = url.searchParams.get("recommended_by") === "products_for_you";
  } catch {
    // Keep the generic title when a presenter returns an invalid URL.
  }

  return <RecommendedProducts products={products} title={isCuratedProducts ? "Recommended" : "Featured products"} />;
}
