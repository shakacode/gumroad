"use client";

import * as React from "react";

import DiscoverResultsCore from "$app/components/Discover/DiscoverResultsCore.client";

export default function DiscoverResults({ blackFridayHero }: { blackFridayHero: React.ReactNode }) {
  return <DiscoverResultsCore blackFridayHero={blackFridayHero} />;
}
