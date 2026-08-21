"use client";

import * as React from "react";

import {
  applySelection,
  buyerLocalPriceCentsForSelection,
  type PriceSelection,
} from "$app/components/Product/ConfigurationSelector";
import type { ProductData, ProductDiscount } from "$app/components/Product/Interactive";
import { PriceTag } from "$app/components/Product/PriceTag";
import { getBundleComparisonPriceCents, getStandalonePrice } from "$app/components/Product/pricing";

export const ProductPrice = ({
  product,
  selection,
  discountCode,
}: {
  product: ProductData;
  selection: PriceSelection;
  discountCode?: ProductDiscount | null | undefined;
}) => {
  const selectionAttributes = applySelection(product, discountCode?.valid ? discountCode.discount : null, selection);
  let { basePriceCents } = selectionAttributes;
  const { discountedPriceCents, selectedOption } = selectionAttributes;
  const isBundle = product.bundle_products.length > 0;
  if (isBundle) basePriceCents = getStandalonePrice(product);
  const comparisonPriceCents = isBundle ? getBundleComparisonPriceCents(product, selectedOption) : basePriceCents;
  const showPrice =
    !product.recurrences &&
    product.options.length === 0 &&
    !product.rental?.rent_only &&
    (basePriceCents !== 0 || product.pwyw);

  if (!showPrice) return null;

  return (
    <div className="px-6 py-4 outline outline-offset-0 outline-border">
      <PriceTag
        currencyCode={product.currency_code}
        oldPrice={
          comparisonPriceCents !== null && discountedPriceCents < comparisonPriceCents
            ? comparisonPriceCents
            : undefined
        }
        price={discountedPriceCents}
        url={product.long_url}
        isPayWhatYouWant={!!product.pwyw}
        isSalesLimited={product.is_sales_limited}
        creatorName={product.seller?.name}
        buyerCurrency={product.buyer_currency}
        buyerLocalCurrencyRate={product.buyer_local_currency_rate}
        buyerLocalCurrencySubunitToUnit={product.buyer_local_currency_subunit_to_unit}
        buyerLocalPriceCents={buyerLocalPriceCentsForSelection(
          product.buyer_local_price_cents,
          discountCode?.valid ? discountCode.discount : null,
          selection.quantity,
        )}
        buyerLocalOriginalPriceCents={product.buyer_local_original_price_cents}
      />
    </div>
  );
};
