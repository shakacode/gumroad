import * as React from "react";

import DiscoverHeader from "$app/components/Discover/DiscoverHeader.client";
import type { Layout } from "$app/components/Discover/Layout";

type Props = React.ComponentProps<typeof Layout>;

export default function DiscoverLayout({ className, children, renderHeader = true, ...headerProps }: Props) {
  return (
    <div className={className}>
      {renderHeader ? <DiscoverHeader {...headerProps} /> : null}
      {children}
    </div>
  );
}
