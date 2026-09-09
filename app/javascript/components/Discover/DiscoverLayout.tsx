import * as React from "react";

import type { Taxonomy } from "$app/utils/discover";

import DiscoverHeader from "$app/components/Discover/DiscoverHeader";
import type { GlobalProps } from "$app/components/PublicPages/PageShell.client";

type Props = {
  children: React.ReactNode;
  className?: string | undefined;
  currentSeller?: unknown;
  domainSettings: GlobalProps["domain_settings"];
  forceDomain?: boolean;
  offerCode?: string | undefined;
  query?: string | undefined;
  renderHeader?: boolean;
  showTaxonomy?: boolean;
  taxonomiesForNav: Taxonomy[];
  taxonomyPath?: string | undefined;
};

export default function DiscoverLayout({ className, children, renderHeader = true, ...headerProps }: Props) {
  return (
    <div className={className}>
      {renderHeader ? <DiscoverHeader {...headerProps} /> : null}
      {children}
    </div>
  );
}
