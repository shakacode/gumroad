"use client";

import * as React from "react";

import DiscoverResultsCore from "$app/components/Discover/DiscoverResultsCore.client";

export default function DiscoverResults({
  blackFridayHero,
  recommendedProducts,
}: {
  blackFridayHero: React.ReactNode;
  recommendedProducts: React.ReactNode;
}) {
  return <DiscoverResultsCore blackFridayHero={blackFridayHero} recommendedProducts={recommendedProducts} />;
}
