"use client";

import * as React from "react";

import { useProductHydration } from "$app/components/PublicPages/ProductHydration.client";
import { Alert } from "$app/components/ui/Alert";

export const ProductSalesNotice = ({
  salesCount,
  isMembership,
  isPreorder,
  hasPaidPrice,
  locale,
}: {
  salesCount: number | null;
  isMembership: boolean;
  isPreorder: boolean;
  hasPaidPrice: boolean;
  locale?: string | undefined;
}) => {
  const snapshot = useProductHydration();
  return salesCount !== null ? (
    <Alert role="status" variant="info">
      <strong>{salesCount.toLocaleString(locale ?? snapshot?.locale)}</strong>{" "}
      {isMembership ? "member" : isPreorder ? "pre-order" : hasPaidPrice ? "sale" : "download"}
      {salesCount === 1 ? "" : "s"}
    </Alert>
  ) : null;
};
