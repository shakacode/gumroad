"use client";

import * as React from "react";

import type { Product } from "$app/components/Product";
import { Covers } from "$app/components/Product/Covers";
import { useOnChange } from "$app/components/useOnChange";

type InitialCover = { id: string; content: React.ReactNode } | null;

export const ProductMedia = ({
  covers,
  initialCover,
  mainCoverId,
  productName,
  prioritizeCover = true,
}: {
  covers: Product["covers"];
  initialCover: InitialCover;
  mainCoverId: string | null;
  productName: string;
  prioritizeCover?: boolean;
}) => {
  const [activeCoverId, setActiveCoverId] = React.useState(mainCoverId);
  useOnChange(() => setActiveCoverId(mainCoverId), [mainCoverId]);

  if (covers.length === 0) return null;

  return (
    <Covers
      covers={covers}
      activeCoverId={activeCoverId}
      setActiveCoverId={setActiveCoverId}
      initialCover={initialCover}
      productName={productName}
      prioritizeActiveCover={prioritizeCover}
      className={activeCoverId ? "" : "pb-[25%]"}
    />
  );
};
