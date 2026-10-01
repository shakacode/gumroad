"use client";

import type { BuyerCurrencyDisplay } from "$app/parsers/product";
import { trackBuyerCurrencyDisplayView } from "$app/utils/user_analytics";

import { useRunOnce } from "$app/components/useRunOnce";

export const ProductCardAnalytics = ({
  sellerId,
  buyerCurrencyDisplay,
}: {
  sellerId: string | undefined;
  buyerCurrencyDisplay: BuyerCurrencyDisplay | undefined;
}) => {
  useRunOnce(() => trackBuyerCurrencyDisplayView(sellerId, buyerCurrencyDisplay));
  return null;
};
