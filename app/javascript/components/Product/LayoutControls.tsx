import * as React from "react";

import type { Product as ProductData, ProductDiscount, Purchase } from "$app/components/Product";
import {
  applySelection,
  buyerLocalPriceCentsForSelection,
  type ConfigurationSelectorHandle,
  type PriceSelection,
} from "$app/components/Product/ConfigurationSelector";
import { PriceTag } from "$app/components/Product/PriceTag";
import { getBundleComparisonPriceCents } from "$app/components/Product/pricing";
import { ProductRatingsSummary } from "$app/components/Product/ProductRatingsSummary";
import { PurchaseButton } from "$app/components/Product/PurchaseButton";
import { needsOptionChoice } from "$app/components/Product/purchaseReadiness";
import { useIsAboveBreakpoint } from "$app/components/useIsAboveBreakpoint";

export const CtaBar = ({
  product,
  purchase,
  discountCode,
  ctaButtonRef,
  configurationSelectorRef,
  ctaLabel,
  selection,
  setSelection,
  hasHero,
}: {
  product: ProductData;
  purchase: Purchase | null;
  discountCode?: ProductDiscount | null;
  ctaButtonRef: React.RefObject<HTMLAnchorElement | null>;
  configurationSelectorRef: React.RefObject<ConfigurationSelectorHandle | null>;
  ctaLabel?: string | undefined;
  selection: PriceSelection;
  setSelection: React.Dispatch<React.SetStateAction<PriceSelection>>;
  hasHero: boolean;
}) => {
  const selectionAttributes = applySelection(product, discountCode?.valid ? discountCode.discount : null, selection);
  let { priceCents } = selectionAttributes;
  const { discountedPriceCents, isPWYW, selectedOption } = selectionAttributes;

  const [visible, setVisible] = React.useState(false);
  const ref = React.useRef<null | HTMLDivElement>(null);
  const isDesktop = useIsAboveBreakpoint("lg");

  React.useEffect(() => {
    if (!ctaButtonRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.5 },
    );
    observer.observe(ctaButtonRef.current);
    return () => observer.disconnect();
  }, [ctaButtonRef]);

  const [height, setHeight] = React.useState(0);
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const updateHeight = () => setHeight(element.getBoundingClientRect().height);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // On mobile the bar is fixed to the bottom of the viewport, so the page has to reserve its height
  // at the end of the document or the footer's links sit underneath it. Desktop has the bar at the
  // top, so nothing is reserved there. The footer consumes this variable.
  React.useEffect(() => {
    const { style } = document.documentElement;
    style.setProperty("--product-cta-bar-height", visible && !isDesktop ? `${height}px` : "0px");
    return () => {
      style.removeProperty("--product-cta-bar-height");
    };
  }, [isDesktop, visible, height]);

  // Paid bundle tiers have no standalone price comparison.
  const bundleComparisonPriceCents = getBundleComparisonPriceCents(product, selectedOption);
  if (bundleComparisonPriceCents !== null) priceCents = bundleComparisonPriceCents;

  return (
    <section
      aria-label="Product information bar"
      className="fixed inset-x-0 bottom-0 order-1 translate-y-full border-0 bg-background lg:top-0 lg:bottom-auto lg:order-none lg:-translate-y-full"
      style={{
        padding: 0,
        overflow: "hidden",
        height: visible ? height : 0,
        translate: visible ? "0 0" : undefined,
        transition: "translate var(--transition-duration)",
        flexShrink: 0,
        order: isDesktop ? undefined : 1,
        boxShadow: visible
          ? "0 var(--border-width) rgb(var(--color)), 0 calc(-1 * var(--border-width)) rgb(var(--color))"
          : undefined,
        zIndex: "var(--z-index-menubar)",
        marginTop: hasHero ? "var(--border-width)" : undefined,
      }}
    >
      <div
        ref={ref}
        className="mx-auto flex max-w-product-page items-center justify-between gap-2 p-4 max-sm:flex-col max-sm:items-stretch lg:gap-4 lg:px-8"
      >
        {needsOptionChoice(product, selection) ? null : (
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
        )}
        <h3 className="hidden flex-1 lg:block">{product.name}</h3>
        {product.ratings != null && product.ratings.count > 0 ? (
          <ProductRatingsSummary className="hidden lg:flex" ratings={product.ratings} />
        ) : null}
        <div className="flex shrink-0 items-center gap-2 max-sm:flex-col max-sm:items-stretch">
          <PurchaseButton
            product={product}
            purchase={purchase}
            discountCode={discountCode ?? null}
            selection={selection}
            label={ctaLabel}
            setSelection={setSelection}
            configurationSelectorRef={configurationSelectorRef}
          />
        </div>
      </div>
    </section>
  );
};
