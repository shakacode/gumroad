"use client";

import * as React from "react";

import type { Product as ProductData } from "$app/components/Product";
import { getMaxQuantity, type Option, type PriceSelection, type Recurrences, type Rental } from "$app/components/Product/ConfigurationSelector";
import { initialOptionId } from "$app/components/Product/purchaseReadiness";
import { useOriginalLocation } from "$app/components/useOriginalLocation";

// The subset of product data that useSelectionFromUrl reads, so the RSC
// Flight payload serializes only these fields instead of the full product.
export type SelectionProductConfig = Pick<ProductData, "installment_plan" | "is_quantity_enabled" | "is_multiseat_license" | "quantity_remaining" | "native_type"> & {
  options: Option[];
  recurrences: Recurrences | null;
  rental: Rental | null;
  pwyw: { suggested_price_cents: number | null; default_price_cents?: number | null } | null;
};

export const useSelectionFromUrl = (product: SelectionProductConfig) => {
  const { searchParams } = new URL(useOriginalLocation());
  return React.useState<PriceSelection>(() => {
    const recurrence =
      product.recurrences?.enabled.find(
        // support legacy ?yearly=true parameters
        ({ recurrence }) => recurrence === searchParams.get("recurrence") || searchParams.get(recurrence),
      )?.recurrence ??
      product.recurrences?.default ??
      null;
    const parsedOption = product.options.find(
      // support legacy variant=name parameter
      ({ id, name }) => id === searchParams.get("option") || name === searchParams.get("variant"),
    );
    const parsedQuantity = Number(searchParams.get("quantity"));
    const optionId = initialOptionId(product, searchParams);
    const parsedPrice = Number(searchParams.get("price") ?? undefined);
    const parsedCallStartTime = new Date(searchParams.get("call_start_time") ?? "");
    const parsedPayInInstallments = searchParams.get("pay_in_installments") === "true" && !!product.installment_plan;
    return {
      recurrence,
      rent: product.rental?.rent_only ?? false,
      optionId,
      quantity:
        (product.is_quantity_enabled || product.is_multiseat_license) && parsedQuantity > 0
          ? Math.min(parsedQuantity, getMaxQuantity(product, parsedOption ?? null) ?? Infinity)
          : 1,
      price: {
        value:
          parsedPrice >= 0
            ? parsedPrice * 100
            : searchParams.has("price")
              ? null
              : (product.pwyw?.default_price_cents ?? null),
        error: false,
      },
      callStartTime: isNaN(parsedCallStartTime.getTime()) ? null : parsedCallStartTime.toISOString(),
      payInInstallments: parsedPayInInstallments,
    };
  });
};
