"use client";

import * as React from "react";

import { Covers } from "$app/components/Product/Covers";
import type { ProductData, ServerContent } from "$app/components/Product/Interactive";
import { useOnChange } from "$app/components/useOnChange";

export const ProductMedia = ({
  covers,
  initialCover,
  mainCoverId,
  productName,
}: {
  covers: ProductData["covers"];
  initialCover: ServerContent["initialCover"];
  mainCoverId: string | null;
  productName: string;
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
      className={activeCoverId ? "" : "pb-[25%]"}
    />
  );
};
