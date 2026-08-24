"use client";

import * as React from "react";

import DiscoverResultsCore from "$app/components/Discover/DiscoverResultsCore.client";

export default function DiscoverResults({
  recentlyViewed,
  recommendedProducts,
  recommendedWishlists,
}: {
  recentlyViewed: React.ReactNode;
  recommendedProducts: React.ReactNode;
  recommendedWishlists: React.ReactNode;
}) {
  return (
    <DiscoverResultsCore
      recentlyViewed={recentlyViewed}
      recommendedProducts={recommendedProducts}
      recommendedWishlists={recommendedWishlists}
    />
  );
}
