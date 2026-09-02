import * as React from "react";

import type { Product as ProductData, ProductDiscount, Purchase } from "$app/components/Product";
import {
  applySelection,
  buyerLocalPriceCentsForSelection,
  type ConfigurationSelectorHandle,
  type PriceSelection,
} from "$app/components/Product/ConfigurationSelector";
import { CtaButton } from "$app/components/Product/CtaButton";
import { PriceTag } from "$app/components/Product/PriceTag";
import { getBundleComparisonPriceCents } from "$app/components/Product/pricing";
import { ProductRatingsSummary } from "$app/components/Product/ProductRatingsSummary";
import { showAlert } from "$app/components/server-components/Alert";

export const CtaBar = ({
  product,
  purchase,
  discountCode,
  ctaButtonRef,
  configurationSelectorRef,
  ctaLabel,
  selection,
  hasHero,
}: {
  product: ProductData;
  purchase: Purchase | null;
  discountCode?: ProductDiscount | null;
  ctaButtonRef: React.RefObject<HTMLAnchorElement>;
  configurationSelectorRef: React.RefObject<ConfigurationSelectorHandle>;
  ctaLabel?: string | undefined;
  selection: PriceSelection;
  hasHero: boolean;
}) => {
  const selectionAttributes = applySelection(product, discountCode?.valid ? discountCode.discount : null, selection);
  let { priceCents } = selectionAttributes;
  const {
    discountedPriceCents,
    isPWYW,
    hasRentOption,
    hasMultipleRecurrences,
    hasConfigurableQuantity,
    selectedOption,
  } = selectionAttributes;

  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (!ctaButtonRef.current) return;
    new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.5 },
    ).observe(ctaButtonRef.current);
  }, [ctaButtonRef.current]);

  // Same comparison rule as the main price tag: only a tier that adds nothing to
  // the bundle's price can honestly be compared against the standalone sum.
  const bundleComparisonPriceCents = getBundleComparisonPriceCents(product, selectedOption);
  if (bundleComparisonPriceCents !== null) priceCents = bundleComparisonPriceCents;

  return (
    <section
      aria-label="Product information bar"
      className="fixed inset-x-0 bottom-0 order-1 translate-y-full border-0 bg-background lg:top-0 lg:bottom-auto lg:order-none lg:-translate-y-full"
      style={{
        padding: 0,
        // CSS owns the hidden side so SSR cannot choose a mobile position for a desktop viewport from the user agent.
        translate: visible ? "0 0" : undefined,
        transition: "translate var(--transition-duration)",
        flexShrink: 0,
        boxShadow: visible
          ? "0 var(--border-width) rgb(var(--color)), 0 calc(-1 * var(--border-width)) rgb(var(--color))"
          : undefined,
        zIndex: "var(--z-index-menubar)",
        marginTop: hasHero ? "var(--border-width)" : undefined,
      }}
    >
      <div className="mx-auto flex max-w-product-page items-center justify-between gap-2 p-4 lg:gap-4 lg:px-8">
        <PriceTag
          currencyCode={product.currency_code}
          oldPrice={discountedPriceCents < priceCents ? priceCents : undefined}
          price={discountedPriceCents}
          url={product.long_url}
          recurrence={
            product.recurrences
              ? {
                  id: selection.recurrence ?? product.recurrences.default,
                  duration_in_months: product.duration_in_months,
                }
              : undefined
          }
          isPayWhatYouWant={isPWYW}
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
        <h3 className="hidden flex-1 lg:block">{product.name}</h3>
        {product.ratings != null && product.ratings.count > 0 ? (
          <ProductRatingsSummary className="hidden lg:flex" ratings={product.ratings} />
        ) : null}
        <div className="flex items-center gap-2">
          <CtaButton
            product={product}
            purchase={purchase}
            discountCode={discountCode ?? null}
            selection={selection}
            label={ctaLabel}
            onClick={(evt) => {
              if (
                isPWYW ||
                product.options.length > 1 ||
                hasRentOption ||
                hasMultipleRecurrences ||
                hasConfigurableQuantity
              ) {
                evt.preventDefault();
                ctaButtonRef.current?.scrollIntoView(false);
                configurationSelectorRef.current?.focusRequiredInput();
                if (isPWYW && selection.price.value === null) showAlert("You must input an amount", "warning");
              }
            }}
          />
        </div>
      </div>
    </section>
  );
};
