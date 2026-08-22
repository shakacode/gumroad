"use client";

import * as React from "react";

import DiscoverResultsCore from "$app/components/Discover/DiscoverResultsCore.client";

export default function DiscoverResults({
  blackFridayHero,
  recentlyViewed,
  recommendedProducts,
  recommendedWishlists,
}: {
  blackFridayHero: React.ReactNode;
  recentlyViewed: React.ReactNode;
  recommendedProducts: React.ReactNode;
  recommendedWishlists: React.ReactNode;
}) {
  return (
    <DiscoverResultsCore
      blackFridayHero={blackFridayHero}
      recentlyViewed={recentlyViewed}
      recommendedProducts={recommendedProducts}
      recommendedWishlists={recommendedWishlists}
    />
  );
}
