"use client";

import * as React from "react";

import type { Product as ProductData } from "$app/components/Product";
import { getMaxQuantity, type PriceSelection } from "$app/components/Product/ConfigurationSelector";
import { useOriginalLocation } from "$app/components/useOriginalLocation";

export const useSelectionFromUrl = (product: ProductData) => {
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
    const optionId =
      parsedOption && parsedOption.quantity_left !== 0
        ? parsedOption.id
        : (product.options.find(({ quantity_left }) => quantity_left !== 0)?.id ?? null);
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
      price: { value: parsedPrice >= 0 ? parsedPrice * 100 : null, error: false },
      callStartTime: isNaN(parsedCallStartTime.getTime()) ? null : parsedCallStartTime.toISOString(),
      payInInstallments: parsedPayInInstallments,
    };
  });
};
