"use client";

import * as React from "react";

import { Search } from "$app/components/Discover/Search";
import { useDomains } from "$app/components/DomainSettings";

export default function DiscoverSearch({
  offerCode,
  query,
  taxonomyPath,
}: {
  offerCode?: string | undefined;
  query?: string | undefined;
  taxonomyPath?: string | undefined;
}) {
  const { discoverDomain } = useDomains();

  return (
    <Search
      query={query}
      setQuery={(newQuery) => {
        window.location.href = taxonomyPath
          ? Routes.discover_taxonomy_url(taxonomyPath, { host: discoverDomain, offer_code: offerCode, query: newQuery })
          : Routes.discover_url({ host: discoverDomain, offer_code: offerCode, query: newQuery });
      }}
    />
  );
}
