"use client";

import { parseISO } from "date-fns";
import * as React from "react";

import { formatDate } from "$app/utils/date";

import { Alert } from "$app/components/ui/Alert";

export const ProductPreorderNotice = ({ releaseDate }: { releaseDate: string | null }) =>
  releaseDate ? (
    <Alert role="status" variant="info">
      Available on {formatDate(parseISO(releaseDate))}
    </Alert>
  ) : null;
