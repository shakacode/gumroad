"use client";

import { incrementProductViews } from "$app/data/view_event";
import type { AnalyticsData, BuyerCurrencyDisplay } from "$app/parsers/product";
import { startTrackingForSeller, trackBuyerCurrencyDisplayView, trackProductEvent } from "$app/utils/user_analytics";

import { useAddThirdPartyAnalytics } from "$app/components/useAddThirdPartyAnalytics";
import { useOriginalLocation } from "$app/components/useOriginalLocation";
import { useRunOnce } from "$app/components/useRunOnce";

export default function ProductAnalytics({
  analytics,
  buyerCurrencyDisplay,
  disabled,
  hasThirdPartyAnalytics,
  permalink,
  productName,
  sellerId,
}: {
  analytics: AnalyticsData;
  buyerCurrencyDisplay?: BuyerCurrencyDisplay | undefined;
  disabled?: boolean | undefined;
  hasThirdPartyAnalytics: boolean;
  permalink: string;
  productName: string;
  sellerId?: string | undefined;
}) {
  const addThirdPartyAnalytics = useAddThirdPartyAnalytics();
  const { searchParams } = new URL(useOriginalLocation());

  useRunOnce(() => {
    if (disabled) return;

    if (sellerId) {
      startTrackingForSeller(sellerId, analytics);
      trackBuyerCurrencyDisplayView(sellerId, buyerCurrencyDisplay);
      trackProductEvent(sellerId, {
        permalink,
        action: "viewed",
        product_name: productName,
      });
    } else {
      trackBuyerCurrencyDisplayView(undefined, buyerCurrencyDisplay);
    }

    void incrementProductViews({ permalink, recommendedBy: searchParams.get("recommended_by") });
    if (hasThirdPartyAnalytics) addThirdPartyAnalytics({ permalink, location: "product" });
  });

  return null;
}
