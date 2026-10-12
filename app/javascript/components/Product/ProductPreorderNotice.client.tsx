"use client";

import { parseISO } from "date-fns";
import * as React from "react";

import { formatDate } from "$app/utils/date";

import { useProductHydration } from "$app/components/PublicPages/ProductHydration.client";
import { Alert } from "$app/components/ui/Alert";

export const ProductPreorderNotice = ({ releaseDate }: { releaseDate: string | null }) => {
  const snapshot = useProductHydration();
  if (!releaseDate) return null;
  const date = parseISO(releaseDate);
  return (
    <Alert role="status" variant="info">
      Available on{" "}
      {snapshot
        ? date.toLocaleString(snapshot.locale, { dateStyle: "long", timeStyle: "short", timeZone: snapshot.timeZone })
        : formatDate(date)}
    </Alert>
  );
};
