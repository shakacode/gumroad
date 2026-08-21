"use client";

import * as React from "react";

import { formatBuyerLocalOrSetPrice, formatPriceCentsWithCurrencySymbol } from "$app/utils/currency";

import { CartItem, CartItemEnd, CartItemList, CartItemMain, CartItemMedia } from "$app/components/CartItemList";
import { applySelection, type PriceSelection } from "$app/components/Product/ConfigurationSelector";
import type { ProductData, ProductDiscount, ServerContent } from "$app/components/Product/Interactive";
import { getBundleComparisonPriceCents } from "$app/components/Product/pricing";
import { useProductState } from "$app/components/Product/ProductStateProvider.client";
import { Thumbnail } from "$app/components/Product/Thumbnail";

export const ProductBundle = ({
  product,
  selection,
  discountCode,
  bundleItems,
}: {
  product: ProductData;
  selection: PriceSelection;
  discountCode?: ProductDiscount | null | undefined;
  bundleItems: ServerContent["bundleItems"];
}) => {
  if (product.bundle_products.length === 0) return null;

  const { discountedPriceCents, selectedOption } = applySelection(
    product,
    discountCode?.valid ? discountCode.discount : null,
    selection,
  );
  const comparisonPriceCents = getBundleComparisonPriceCents(product, selectedOption);

  return (
    <section className="grid gap-4 border-t border-border p-6">
      <h2>This bundle contains...</h2>
      <CartItemList>
        {product.bundle_products.map((bundleProduct) => {
          const price =
            bundleProduct.currency_code === product.currency_code
              ? formatBuyerLocalOrSetPrice(bundleProduct.price, {
                  currencyCode: product.currency_code,
                  buyerCurrency: product.buyer_currency,
                  buyerLocalCurrencyRate: product.buyer_local_currency_rate,
                  buyerLocalCurrencySubunitToUnit: product.buyer_local_currency_subunit_to_unit,
                })
              : formatPriceCentsWithCurrencySymbol(bundleProduct.currency_code, bundleProduct.price, {
                  symbolFormat: "long",
                });

          return (
            <CartItem key={bundleProduct.id} isBundleItem>
              <CartItemMedia className="h-28 w-28">
                <Thumbnail url={bundleProduct.thumbnail_url} nativeType={bundleProduct.native_type} />
              </CartItemMedia>
              <CartItemMain className="h-28">{bundleItems[bundleProduct.id]}</CartItemMain>
              <CartItemEnd className="flex-row items-start gap-4 p-4">
                <span className="current-price" aria-label="Price">
                  {comparisonPriceCents !== null && discountedPriceCents < comparisonPriceCents ? (
                    <s>{price}</s>
                  ) : (
                    price
                  )}
                </span>
              </CartItemEnd>
            </CartItem>
          );
        })}
      </CartItemList>
    </section>
  );
};

export const ProductBundleFromState = ({
  product,
  bundleItems,
}: {
  product: ProductData;
  bundleItems: ServerContent["bundleItems"];
}) => {
  const { selection, discountCode } = useProductState();

  return (
    <ProductBundle product={product} selection={selection} discountCode={discountCode} bundleItems={bundleItems} />
  );
};
