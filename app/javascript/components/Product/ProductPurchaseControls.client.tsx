"use client";

import * as React from "react";

import type { Discount } from "$app/parsers/checkout";
import { type BuyerLocalCurrencyContext, formatBuyerLocalOrSetPrice } from "$app/utils/currency";

import { useLoggedInUser } from "$app/components/LoggedInUser";
import {
  applySelection,
  buyerLocalContextFor,
  ConfigurationSelector,
  type ConfigurationSelectorHandle,
  type PriceSelection,
  withConfiguredOncePerCartAmount,
} from "$app/components/Product/ConfigurationSelector";
import { CtaButton } from "$app/components/Product/CtaButton";
import { DiscountExpirationCountdown } from "$app/components/Product/DiscountExpirationCountdown";
import type { ProductData, ProductDiscount, Purchase } from "$app/components/Product/Interactive";
import { useProductState } from "$app/components/Product/ProductStateProvider.client";
import { SubscriptionChoiceModal } from "$app/components/Product/SubscriptionChoiceModal";
import { showAlert } from "$app/components/server-components/Alert";
import { Alert } from "$app/components/ui/Alert";

export const formatDiscountAmount = (discount: Discount, buyerLocalContext: BuyerLocalCurrencyContext) => {
  if (discount.type === "percent") {
    return discount.tiered && discount.min_percents !== undefined && discount.max_percents !== undefined
      ? discount.min_percents === discount.max_percents
        ? `${discount.max_percents}%`
        : `${discount.min_percents}%–${discount.max_percents}%`
      : `${discount.percents}%`;
  }

  return formatBuyerLocalOrSetPrice(discount.once_per_cart_amount_cents ?? discount.cents, buyerLocalContext, {
    symbolFormat: "long",
  });
};

export const ProductPurchaseControls = ({
  product,
  purchase,
  discountCode,
  selection,
  setSelection,
  ctaButtonRef,
  configurationSelectorRef,
  ctaLabel,
  availabilityNotice,
  membershipNotices,
  onDiscountExpiration,
}: {
  product: ProductData;
  purchase: Purchase | null;
  discountCode?: ProductDiscount | null | undefined;
  selection: PriceSelection;
  setSelection?: React.Dispatch<React.SetStateAction<PriceSelection>> | undefined;
  ctaButtonRef?: React.MutableRefObject<HTMLAnchorElement | null> | undefined;
  configurationSelectorRef?: React.MutableRefObject<ConfigurationSelectorHandle | null> | undefined;
  ctaLabel?: string | undefined;
  availabilityNotice: React.ReactNode;
  membershipNotices: React.ReactNode;
  onDiscountExpiration: () => void;
}) => {
  const [checkoutUrlForModal, setCheckoutUrlForModal] = React.useState<string | null>(null);
  const loggedInUser = useLoggedInUser();
  const selectionAttributes = applySelection(product, discountCode?.valid ? discountCode.discount : null, selection);
  const { priceCents, discountedPriceCents, pppDiscounted, isPWYW, maxQuantity } = selectionAttributes;

  React.useEffect(() => {
    if (maxQuantity !== null && selection.quantity > maxQuantity)
      setSelection?.({ ...selection, quantity: maxQuantity });
  }, [maxQuantity, selection.quantity]);

  const validate = () => {
    if (isPWYW && (selection.price.value === null || selection.price.value < discountedPriceCents)) {
      setSelection?.({ ...selection, price: { ...selection.price, error: true } });
      if (selection.price.value === null) {
        configurationSelectorRef?.current?.focusRequiredInput();
        showAlert("You must input an amount", "warning");
      } else if (selection.price.value < discountedPriceCents) {
        const formattedMinPrice = formatBuyerLocalOrSetPrice(
          discountedPriceCents,
          {
            currencyCode: product.currency_code,
            buyerCurrency: product.buyer_currency,
            buyerLocalCurrencyRate: product.buyer_local_currency_rate,
            buyerLocalCurrencySubunitToUnit: product.buyer_local_currency_subunit_to_unit,
          },
          { symbolFormat: "short" },
        );
        configurationSelectorRef?.current?.focusRequiredInput();
        showAlert(`Minimum price for this product is ${formattedMinPrice}.`, "error");
      }
      return false;
    }
    if (product.native_type === "call" && !selection.callStartTime) {
      showAlert("You must select a date and time for the call", "warning");
      return false;
    }
    return true;
  };

  return (
    <>
      {availabilityNotice}
      {discountCode ? (
        discountCode.valid ? (
          (discountedPriceCents < priceCents ||
            discountCode.discount.minimum_quantity ||
            (discountCode.discount.type === "fixed" && discountCode.discount.once_per_cart)) &&
          !pppDiscounted ? (
            <Alert role="status" variant="success">
              <div className="flex flex-col gap-4">
                {discountCode.discount.minimum_quantity
                  ? `Get ${formatDiscountAmount(discountCode.discount, buyerLocalContextFor(product))} off when you buy ${discountCode.discount.minimum_quantity} or more (Code ${discountCode.code.toUpperCase()})`
                  : `${formatDiscountAmount(discountCode.discount, buyerLocalContextFor(product))} off will be applied at checkout (Code ${discountCode.code.toUpperCase()})`}
                {discountCode.discount.duration_in_billing_cycles && product.is_recurring_billing ? (
                  <div>This discount will only apply to the first payment of your subscription.</div>
                ) : null}
                {discountCode.discount.minimum_amount_cents ? (
                  <div>
                    {(discountCode.discount.product_ids?.length ?? 0) === 1
                      ? `This discount will apply when you spend ${formatBuyerLocalOrSetPrice(
                          discountCode.discount.minimum_amount_cents,
                          buyerLocalContextFor(product),
                          { symbolFormat: "short" },
                        )} or more.`
                      : `This discount will apply when you spend ${formatBuyerLocalOrSetPrice(
                          discountCode.discount.minimum_amount_cents,
                          buyerLocalContextFor(product),
                          { symbolFormat: "short" },
                        )} or more in ${
                          !discountCode.discount.product_ids && product.seller ? `${product.seller.name}'s` : "selected"
                        } products.`}
                  </div>
                ) : null}
                {discountCode.discount.expires_at ? (
                  <DiscountExpirationCountdown
                    expiresAt={new Date(discountCode.discount.expires_at)}
                    onExpiration={onDiscountExpiration}
                  />
                ) : null}
              </div>
            </Alert>
          ) : null
        ) : (
          <Alert role="status" variant="danger">
            {discountCode.error_code === "sold_out"
              ? "Sorry, the discount code you wish to use has reached its usage limit."
              : discountCode.error_code === "invalid_offer"
                ? "Sorry, the discount code you wish to use is invalid."
                : discountCode.error_code === "not_existing_customer"
                  ? "Sorry, this discount code is only for existing customers."
                  : "Sorry, the discount code you wish to use is inactive."}
          </Alert>
        )
      ) : null}
      <ConfigurationSelector
        product={product}
        selection={selection}
        setSelection={setSelection}
        discount={discountCode?.valid ? withConfiguredOncePerCartAmount(discountCode.discount) : null}
        ref={configurationSelectorRef}
      />
      {product.ppp_details && pppDiscounted ? (
        <Alert role="status" variant="info">
          This product supports purchasing power parity. Because you're located in <b>{product.ppp_details.country}</b>,
          the price has been discounted by{" "}
          <b>
            {(Math.round((1 - discountedPriceCents / priceCents) * 100) / 100).toLocaleString(undefined, {
              style: "percent",
            })}
          </b>{" "}
          to{" "}
          <b>
            {formatBuyerLocalOrSetPrice(discountedPriceCents, buyerLocalContextFor(product), {
              symbolFormat: "long",
            })}
          </b>
          .
          {discountCode?.valid
            ? " This discount will be applied because it is greater than the offer code discount."
            : null}
        </Alert>
      ) : null}
      {membershipNotices}
      <CtaButton
        ref={ctaButtonRef}
        product={product}
        purchase={purchase}
        discountCode={discountCode ?? null}
        selection={selection}
        label={ctaLabel}
        showInstallmentPlanNotes
        onClick={(event) => {
          if (!validate()) {
            event.preventDefault();
            return;
          }
          if (
            loggedInUser &&
            purchase &&
            (purchase.membership || purchase.subscription_has_lapsed) &&
            product.is_recurring_billing
          ) {
            event.preventDefault();
            setCheckoutUrlForModal(event.currentTarget.href);
          }
        }}
      />
      {purchase && (purchase.membership || purchase.subscription_has_lapsed) && product.is_recurring_billing ? (
        <SubscriptionChoiceModal
          purchase={purchase}
          checkoutUrl={checkoutUrlForModal ?? ""}
          onClose={() => setCheckoutUrlForModal(null)}
        />
      ) : null}
    </>
  );
};

export const ProductPurchaseControlsFromState = ({
  product,
  purchase,
  ctaLabel,
  availabilityNotice,
  membershipNotices,
}: {
  product: ProductData;
  purchase: Purchase | null;
  ctaLabel?: string | undefined;
  availabilityNotice: React.ReactNode;
  membershipNotices: React.ReactNode;
}) => {
  const productState = useProductState();

  return (
    <ProductPurchaseControls
      product={product}
      purchase={purchase}
      discountCode={productState.discountCode}
      selection={productState.selection}
      setSelection={productState.setSelection}
      ctaButtonRef={productState.ctaButtonRef}
      configurationSelectorRef={productState.configurationSelectorRef}
      ctaLabel={ctaLabel}
      availabilityNotice={availabilityNotice}
      membershipNotices={membershipNotices}
      onDiscountExpiration={() => productState.setDiscountCode({ valid: false, error_code: "inactive" })}
    />
  );
};
