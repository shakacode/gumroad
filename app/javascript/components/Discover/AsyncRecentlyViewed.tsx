import * as React from "react";

import { RecentlyViewed } from "$app/components/Discover/RecentlyViewed";
import type { RecentlyViewedProps } from "$app/components/Discover/RecentlyViewed.types";

export default function AsyncRecentlyViewed({
  recentlyViewedPromise,
}: {
  recentlyViewedPromise: Promise<RecentlyViewedProps | null>;
}) {
  const recentlyViewed = React.use(recentlyViewedPromise);

  return <RecentlyViewed data={recentlyViewed} />;
}
