import * as React from "react";

import { Discount } from "$app/parsers/checkout";
import { ProductNativeType } from "$app/parsers/product";
import {
  BuyerLocalCurrencyContext,
  CurrencyCode,
  currencyCodeList,
  formatBuyerLocalOrSetPrice,
  formatPriceCentsWithoutCurrencySymbol,
  formatPriceCentsWithoutCurrencySymbolAndComma,
  getMinPriceCents,
} from "$app/utils/currency";
import { fetchWithOneRetry } from "$app/utils/lazy_chunk";
import { applyOfferCodeToCents } from "$app/utils/offer-code";
import { formatInstallmentPaymentSchedule } from "$app/utils/price";
import { isSingleChargeDuration, recurrenceNames, recurrenceLabels, RecurrenceId } from "$app/utils/recurringPricing";

import { Breaklines } from "$app/components/Breaklines";
import { Button } from "$app/components/Button";
import { NumberInput } from "$app/components/NumberInput";
import { PriceInput } from "$app/components/PriceInput";
import { TypeSafeOptionSelect } from "$app/components/TypeSafeOptionSelect";
import { Alert } from "$app/components/ui/Alert";
import { Fieldset, FieldsetTitle } from "$app/components/ui/Fieldset";
import { Input } from "$app/components/ui/Input";
import { Label } from "$app/components/ui/Label";
import { Pill } from "$app/components/ui/Pill";
import { Tab, Tabs } from "$app/components/ui/Tabs";

const importCallDateAndTimeSelector = () => import("$app/components/Product/CallDateAndTimeSelector");
const CallDateAndTimeSelector = React.lazy(() => fetchWithOneRetry(importCallDateAndTimeSelector));

class CallDateAndTimeSelectorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? (
      <Alert role="alert" variant="danger">
        Appointment times could not be loaded.{" "}
        <Button onClick={() => window.location.reload()}>Reload and try again</Button>
      </Alert>
    ) : (
      this.props.children
    );
  }
}

const PWYWInput = React.forwardRef<
  HTMLInputElement,
  {
    currencyCode: CurrencyCode;
    cents: number | null;
    onChange: (newCents: number | null) => void;
    onBlur: () => void;
    suggestedPriceCents: number | null;
    hasError: boolean;
    hideLabel?: boolean;
    buyerLocal?: { currencyCode: CurrencyCode; rate: number } | null;
  }
>(({ currencyCode, cents, onChange, suggestedPriceCents, hasError, onBlur, hideLabel, buyerLocal }, ref) => {
  const uid = React.useId();

  // The buyer enters and sees their local currency, but selection.price.value (`cents`) stays in
  // the seller's set currency — the amount actually charged — so we convert only at this boundary.
  const inputCurrency = buyerLocal?.currencyCode ?? currencyCode;
  const toInputCents = (setCents: number | null) =>
    buyerLocal && setCents != null ? Math.round(setCents * buyerLocal.rate) : setCents;
  const toSetCents = (inputCents: number | null) =>
    buyerLocal && inputCents != null ? Math.round(inputCents / buyerLocal.rate) : inputCents;

  // Track the entered value in the input currency so set<->local round-trip rounding doesn't make
  // the field jitter while typing; resync only when the set price changes from outside this input.
  const [inputCents, setInputCents] = React.useState<number | null>(() => toInputCents(cents));
  const lastEmittedSetCents = React.useRef<number | null>(cents);
  React.useEffect(() => {
    if (cents !== lastEmittedSetCents.current) {
      lastEmittedSetCents.current = cents;
      setInputCents(toInputCents(cents));
    }
  }, [cents]);

  const handleChange = (newInputCents: number | null) => {
    setInputCents(newInputCents);
    const setCents = toSetCents(newInputCents);
    lastEmittedSetCents.current = setCents;
    onChange(setCents);
  };

  // Don't wrap this lone input in a flex <fieldset>+<legend>: that hides it from VoiceOver,
  // and aria-label="Price" would override the visible name and collide with the price display.
  return (
    <div className="flex flex-col gap-2">
      {!hideLabel ? (
        <Label htmlFor={uid} className="text-base leading-snug font-bold">
          Name a fair price:
        </Label>
      ) : null}
      <Fieldset state={hasError ? "danger" : undefined} style={{ display: "block" }}>
        <PriceInput
          id={uid}
          currencyCode={inputCurrency}
          cents={inputCents}
          onChange={handleChange}
          placeholder={`${formatPriceCentsWithoutCurrencySymbol(inputCurrency, toInputCents(suggestedPriceCents) || 0)}+`}
          hasError={hasError}
          onBlur={() => {
            const minPriceCents = getMinPriceCents(currencyCode);
            if (cents && cents < minPriceCents) onChange(minPriceCents);
            onBlur();
          }}
          ref={ref}
          {...(hideLabel ? { ariaLabel: "Name a fair price" } : {})}
        />
      </Fieldset>
    </div>
  );
});
PWYWInput.displayName = "PWYWInput";

export type PriceSelection = {
  rent: boolean;
  optionId: string | null;
  price: { error: boolean; value: number | null };
  quantity: number;
  recurrence: RecurrenceId | null;
  callStartTime: string | null;
  payInInstallments: boolean;
};

export type Option = {
  id: string;
  name: string;
  quantity_left: number | null;
  description: string;
  price_difference_cents: number | null;
  recurrence_price_values:
    | {
        [key in RecurrenceId]?: { price_cents: number; suggested_price_cents: number | null };
      }
    | null;
  is_pwyw: boolean;
  duration_in_minutes: number | null;
  status?: string | undefined;
};

export type Rental = { price_cents: number; rent_only: boolean };

export type PurchasingPowerParityDetails = { country: string; factor: number; minimum_price: number };

export type Recurrences = {
  default: RecurrenceId;
  enabled: { recurrence: RecurrenceId; price_cents: number; id: string }[];
};

export type Product = {
  permalink: string;
  rental: Rental | null;
  options: Option[];
  currency_code: CurrencyCode;
  price_cents: number;
  installment_plan: { number_of_installments: number } | null;
  is_tiered_membership: boolean;
  is_legacy_subscription: boolean;
  is_quantity_enabled: boolean;
  is_multiseat_license: boolean;
  quantity_remaining: number | null;
  recurrences: Recurrences | null;
  duration_in_months?: number | null;
  pwyw: { suggested_price_cents: number | null } | null;
  ppp_details: PurchasingPowerParityDetails | null;
  native_type: ProductNativeType;
  hide_sold_out_variants?: boolean;
  buyer_currency?: string | null;
  buyer_local_currency_rate?: number | null;
  buyer_local_currency_subunit_to_unit?: number | null;
};

export const buyerLocalContextFor = (product: Product): BuyerLocalCurrencyContext => ({
  currencyCode: product.currency_code,
  buyerCurrency: product.buyer_currency,
  buyerLocalCurrencyRate: product.buyer_local_currency_rate,
  buyerLocalCurrencySubunitToUnit: product.buyer_local_currency_subunit_to_unit,
});

export const getMaxQuantity = (product: Product, option: Option | null) =>
  option?.quantity_left != null && product.quantity_remaining !== null
    ? Math.min(option.quantity_left, product.quantity_remaining)
    : (option?.quantity_left ?? product.quantity_remaining);

export const hasMetDiscountConditions = (discount: Discount | null, quantity: number) =>
  quantity >= (discount?.minimum_quantity ?? 0);

export const buyerLocalPriceCentsForSelection = (
  buyerLocalPriceCents: number | null | undefined,
  discount: Discount | null,
  quantity: number,
) =>
  discount?.type === "fixed" && discount.once_per_cart && hasMetDiscountConditions(discount, quantity) && quantity > 1
    ? null
    : buyerLocalPriceCents;

export const computeDiscountedPrice = (
  priceCents: number,
  discount: Discount | null,
  product: Product,
): { value: number; ppp: boolean } => {
  const discountedPrice = { value: discount ? applyOfferCodeToCents(discount, priceCents) : priceCents, ppp: false };
  if (product.ppp_details && priceCents !== 0) {
    const pppDiscountedPrice = Math.max(
      Math.round(product.ppp_details.factor * priceCents),
      product.ppp_details.minimum_price,
    );
    if (pppDiscountedPrice < discountedPrice.value) return { value: pppDiscountedPrice, ppp: true };
  }
  return discountedPrice;
};

const applyOncePerCartDiscountToTotal = (priceCents: number, discount: Discount, currencyCode: CurrencyCode) => {
  const discountedTotal = applyOfferCodeToCents(discount, priceCents);
  return discountedTotal > 0 ? Math.max(discountedTotal, getMinPriceCents(currencyCode)) : 0;
};

export const computeSelectionDiscountedPrice = (
  priceCents: number,
  discount: Discount | null,
  product: Product,
  quantity: number,
) => {
  if (discount?.type !== "fixed" || !discount.once_per_cart) {
    return computeDiscountedPrice(priceCents, discount, product);
  }

  const pppDiscountedPrice = computeDiscountedPrice(priceCents, null, product);
  const discountTotal = applyOncePerCartDiscountToTotal(priceCents * quantity, discount, product.currency_code);
  if (pppDiscountedPrice.ppp && pppDiscountedPrice.value * quantity < discountTotal) {
    return pppDiscountedPrice;
  }

  if (quantity === 1) return { value: discountTotal, ppp: false };

  // The product page quotes one unit, while this discount applies to the cart total.
  return { value: priceCents, ppp: false };
};

export const withConfiguredOncePerCartAmount = (discount: Discount): Discount =>
  discount.type === "fixed" && discount.once_per_cart
    ? { ...discount, cents: discount.once_per_cart_amount_cents ?? discount.cents }
    : discount;

export const applySelection = (
  product: Product,
  discount: Discount | null,
  selection: PriceSelection,
  { preserveOncePerCartAllocation = false }: { preserveOncePerCartAllocation?: boolean } = {},
) => {
  const basePriceCents = !product.is_legacy_subscription
    ? selection.rent && product.rental
      ? product.rental.price_cents
      : product.price_cents
    : (product.recurrences?.enabled.find(({ recurrence }) => recurrence === selection.recurrence)?.price_cents ?? 0);
  const selectedOption = product.options.find(({ id }) => id === selection.optionId) ?? null;
  const maxQuantity = getMaxQuantity(product, selectedOption);
  const priceCents = basePriceCents + (selectedOption ? computeOptionPrice(selectedOption, selection.recurrence) : 0);
  const applicableDiscount =
    discount && hasMetDiscountConditions(discount, selection.quantity)
      ? preserveOncePerCartAllocation
        ? discount
        : withConfiguredOncePerCartAmount(discount)
      : null;
  const discountedPrice = computeSelectionDiscountedPrice(priceCents, applicableDiscount, product, selection.quantity);
  const discountedTotalCents =
    applicableDiscount?.type === "fixed" && applicableDiscount.once_per_cart && !discountedPrice.ppp
      ? applyOncePerCartDiscountToTotal(priceCents * selection.quantity, applicableDiscount, product.currency_code)
      : discountedPrice.value * selection.quantity;
  return {
    selectedOption,
    basePriceCents,
    priceCents,
    discountedPriceCents: discountedPrice.value,
    discountedTotalCents,
    pppDiscounted: discountedPrice.ppp,
    isPWYW: product.is_tiered_membership ? (selectedOption?.is_pwyw ?? false) : !!product.pwyw,
    maxQuantity,
    hasOptions: product.options.length > 0,
    hasRentOption: product.rental && !product.rental.rent_only,
    hasMultipleRecurrences: product.recurrences && product.recurrences.enabled.length > 1,
    hasConfigurableQuantity:
      product.is_multiseat_license || (product.is_quantity_enabled && (maxQuantity === null || maxQuantity > 1)),
  };
};

export const computeOptionPrice = (option: Option, selectedRecurrence: RecurrenceId | null) =>
  (selectedRecurrence !== null ? (option.recurrence_price_values?.[selectedRecurrence]?.price_cents ?? 0) : 0) +
  (option.price_difference_cents ?? 0);

export const OptionRadioButton = ({
  disabled,
  selected,
  onClick,
  priceCents,
  name,
  description,
  quantityLeft,
  currencyCode,
  isPWYW,
  status,
  discount,
  recurrence,
  product,
  quantity = 1,
  hidePrice,
}: {
  disabled?: boolean;
  selected: boolean;
  onClick?: () => void;
  priceCents: number | null;
  name: string;
  description: string;
  quantityLeft?: number | null;
  currencyCode: CurrencyCode;
  isPWYW: boolean;
  status?: string | undefined;
  discount: Discount | null;
  recurrence?: RecurrenceId | null;
  product: Product;
  quantity?: number;
  hidePrice?: boolean | undefined;
}) => {
  priceCents ??= 0;
  const { value: discountedPriceCents } = computeSelectionDiscountedPrice(priceCents, discount, product, quantity);
  const buyerLocalContext = buyerLocalContextFor(product);
  // aria-label overrides the button's content for screen readers, so everything
  // rendered inside (price, stock, description) must be re-exposed via
  // aria-describedby or it is never announced.
  const uid = React.useId();
  const priceId = hidePrice ? undefined : `${uid}-price`;
  const quantityLeftId = quantityLeft != null ? `${uid}-quantity-left` : undefined;
  const descriptionId = description ? `${uid}-description` : undefined;
  const describedBy = [priceId, quantityLeftId, descriptionId].filter(Boolean).join(" ") || undefined;
  return (
    <Tab isSelected={selected} asChild className={recurrence ? "flex-col" : undefined}>
      <Button
        role="radio"
        aria-checked={selected}
        disabled={disabled}
        aria-label={name}
        aria-describedby={describedBy}
        onClick={onClick}
        itemProp="offer"
        itemType="https://schema.org/Offer"
        itemScope
        className="items-start justify-start text-left"
      >
        {status ? (
          <Alert role="status" variant="info">
            {status}
          </Alert>
        ) : null}
        {hidePrice ? null : (
          <Pill id={priceId} className="shrink-0">
            {discountedPriceCents < priceCents ? (
              <>
                <s>{formatBuyerLocalOrSetPrice(priceCents, buyerLocalContext)}</s>{" "}
              </>
            ) : null}
            {formatBuyerLocalOrSetPrice(discountedPriceCents, buyerLocalContext)}
            {isPWYW ? "+" : null}
            {recurrence
              ? // A fixed-length membership lasting one recurrence period charges
                // once, so "a year" would wrongly suggest a recurring charge.
                ` ${isSingleChargeDuration(recurrence, product.duration_in_months ?? null) ? "once" : recurrenceLabels[recurrence]}`
              : null}
            <div itemProp="price" className="hidden">
              {formatPriceCentsWithoutCurrencySymbolAndComma(currencyCode, discountedPriceCents)}
            </div>
            <div itemProp="priceCurrency" className="hidden">
              {currencyCode}
            </div>
          </Pill>
        )}
        <div>
          <h4>{name}</h4>
          {quantityLeft != null ? <small id={quantityLeftId} className="block">{`${quantityLeft} left`}</small> : null}
          {description ? (
            <div id={descriptionId}>
              <Breaklines text={description} />
            </div>
          ) : null}
        </div>
      </Button>
    </Tab>
  );
};

const PaymentOptionSelector = ({
  product,
  selection,
  onChange,
}: {
  product: Product;
  selection: PriceSelection;
  onChange: (selection: Partial<PriceSelection>) => void;
}) => {
  if (!product.installment_plan) return null;

  const fullPriceCents = selection.price.value ?? product.price_cents;

  return (
    <section>
      <h4 className="mb-2">Payment option</h4>
      <Tabs variant="buttons" role="radiogroup">
        <Tab isSelected={!selection.payInInstallments} asChild>
          <Button
            role="radio"
            aria-checked={!selection.payInInstallments}
            onClick={() => onChange({ payInInstallments: false })}
            className="items-start justify-start text-left"
          >
            <div>
              <strong>Pay in full</strong>
              <p>One-time payment</p>
            </div>
          </Button>
        </Tab>

        <Tab isSelected={selection.payInInstallments} asChild>
          <Button
            role="radio"
            aria-checked={selection.payInInstallments}
            onClick={() => onChange({ payInInstallments: true })}
            className="items-start justify-start text-left"
          >
            <div>
              <strong>Pay in {product.installment_plan.number_of_installments} installments</strong>
              <p>
                {formatInstallmentPaymentSchedule(
                  fullPriceCents,
                  buyerLocalContextFor(product),
                  product.installment_plan.number_of_installments,
                )}
              </p>
            </div>
          </Button>
        </Tab>
      </Tabs>
    </section>
  );
};

export type ConfigurationSelectorHandle = {
  focusRequiredInput: () => void;
};

export const ConfigurationSelector = React.forwardRef<
  ConfigurationSelectorHandle,
  {
    product: Product;
    selection: PriceSelection;
    setSelection?: React.Dispatch<React.SetStateAction<PriceSelection>> | undefined;
    discount: Discount | null;
    discountForSelection?: ((selection: PriceSelection) => Discount | null) | undefined;
    hidePrices?: boolean;
    initialSelection?: PriceSelection;
    pwywMinimumPriceCents?: number;
    showInstallmentPlan?: boolean;
  }
>((props, ref) => {
  const {
    product,
    selection,
    setSelection,
    discount,
    discountForSelection,
    hidePrices,
    initialSelection,
    pwywMinimumPriceCents,
    showInstallmentPlan = false,
  } = props;
  const update = (update: Partial<PriceSelection> | ((selection: PriceSelection) => Partial<PriceSelection>)) =>
    setSelection?.((prevSelection) => ({
      ...prevSelection,
      ...(typeof update === "function" ? update(prevSelection) : update),
    }));
  const previewDiscount = (previewSelection: PriceSelection) =>
    discountForSelection ? discountForSelection(previewSelection) : discount;

  const selectedOption = product.options.find(({ id }) => id === selection.optionId) ?? null;
  const {
    basePriceCents,
    discountedPriceCents,
    isPWYW,
    maxQuantity,
    hasOptions,
    hasRentOption,
    hasMultipleRecurrences,
    hasConfigurableQuantity,
  } = applySelection(product, discount, selection);
  const suggestedPriceCents = Math.max(
    (selectedOption && selection.recurrence
      ? selectedOption.recurrence_price_values?.[selection.recurrence]?.suggested_price_cents
      : product.pwyw?.suggested_price_cents) ?? 0,
    pwywMinimumPriceCents ?? discountedPriceCents,
  );
  const usePreexistingPrice =
    initialSelection &&
    selection.recurrence === initialSelection.recurrence &&
    selection.optionId === initialSelection.optionId &&
    selection.quantity === initialSelection.quantity;

  const quantityInputUID = React.useId();

  const pwywInputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => ({
    focusRequiredInput: () => pwywInputRef.current?.focus(),
  }));
  const buyerCurrencyCode = currencyCodeList.find((code) => code === product.buyer_currency) ?? null;
  const pwywInput = (
    <PWYWInput
      currencyCode={product.currency_code}
      cents={usePreexistingPrice ? initialSelection.price.value : selection.price.value}
      onChange={(newPriceCents) => update({ price: { value: newPriceCents, error: false } })}
      onBlur={() =>
        update(({ price }) => ({
          price: { ...price, error: (price.value ?? 0) < (pwywMinimumPriceCents ?? discountedPriceCents) },
        }))
      }
      suggestedPriceCents={suggestedPriceCents}
      hasError={selection.price.error}
      hideLabel={product.native_type === "coffee"}
      buyerLocal={
        buyerCurrencyCode && product.buyer_local_currency_rate != null
          ? { currencyCode: buyerCurrencyCode, rate: product.buyer_local_currency_rate }
          : null
      }
      ref={pwywInputRef}
    />
  );

  if (product.native_type === "coffee") {
    if (product.options.length === 1) return pwywInput;
    return (
      <>
        <Tabs
          variant="buttons"
          role="radiogroup"
          className="md:grid-flow-row"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(6rem, 100%), 1fr))" }}
        >
          {product.options.map((option) => {
            const isSelected = selection.optionId === option.id;
            return (
              <Tab key={option.id} isSelected={isSelected} asChild>
                <Button
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() =>
                    setSelection?.({
                      ...selection,
                      optionId: option.id,
                      price: { value: option.price_difference_cents ?? 100, error: false },
                    })
                  }
                  className="justify-center"
                >
                  {formatBuyerLocalOrSetPrice(option.price_difference_cents ?? 0, buyerLocalContextFor(product), {
                    symbolFormat: "short",
                  })}
                </Button>
              </Tab>
            );
          })}
          <Tab isSelected={selection.optionId === null} asChild>
            <Button
              role="radio"
              aria-checked={selection.optionId === null}
              onClick={() => setSelection?.({ ...selection, optionId: null, price: { value: null, error: false } })}
              className="justify-center"
            >
              Other
            </Button>
          </Tab>
        </Tabs>
        {selection.optionId === null ? pwywInput : null}
      </>
    );
  }

  return (
    <>
      {hasMultipleRecurrences && product.recurrences ? (
        <TypeSafeOptionSelect
          aria-label="Recurrence"
          value={selection.recurrence ?? ""}
          onChange={(recurrence) => update({ recurrence: recurrence || null, price: { value: null, error: false } })}
          options={product.recurrences.enabled.map(({ recurrence }) => ({
            id: recurrence,
            label: recurrenceNames[recurrence],
          }))}
        />
      ) : null}
      {hasRentOption && product.rental ? (
        <Tabs
          variant="buttons"
          role="radiogroup"
          className="md:grid-flow-row"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(15rem, 100%), 1fr))" }}
          itemProp="offers"
          itemType="https://schema.org/AggregateOffer"
          itemScope
        >
          <OptionRadioButton
            selected={selection.rent}
            onClick={() => update({ rent: true })}
            priceCents={hasOptions ? null : product.rental.price_cents}
            name="Rent"
            description="Your rental will be available for 30 days. Once started, you’ll have 72 hours to watch it as much as you’d like!"
            currencyCode={product.currency_code}
            isPWYW={!!product.pwyw}
            discount={previewDiscount({ ...selection, rent: true })}
            product={product}
            quantity={selection.quantity}
            hidePrice={hidePrices}
          />
          <OptionRadioButton
            selected={!selection.rent}
            onClick={() => update({ rent: false })}
            priceCents={hasOptions ? null : product.price_cents}
            name="Buy"
            description="Watch as many times as you want, forever."
            currencyCode={product.currency_code}
            isPWYW={!!product.pwyw}
            discount={previewDiscount({ ...selection, rent: false })}
            product={product}
            quantity={selection.quantity}
            hidePrice={hidePrices}
          />
        </Tabs>
      ) : null}
      {hasOptions && hasRentOption ? <hr /> : null}
      {hasOptions ? (
        <Tabs
          variant="buttons"
          role="radiogroup"
          className="md:grid-flow-row"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(15rem, 100%), 1fr))" }}
          itemProp="offers"
          itemType="https://schema.org/AggregateOffer"
          itemScope
        >
          {product.options
            .filter((option) => !(product.hide_sold_out_variants && option.quantity_left === 0))
            .map((option) => (
              <OptionRadioButton
                key={option.id}
                disabled={
                  option.quantity_left === 0 ||
                  (product.is_tiered_membership &&
                    !!selection.recurrence &&
                    !option.recurrence_price_values?.[selection.recurrence])
                }
                selected={option.id === selection.optionId}
                onClick={() => {
                  if (option.id === selection.optionId) return;
                  update({ optionId: option.id, price: { value: null, error: false } });
                }}
                priceCents={basePriceCents + computeOptionPrice(option, selection.recurrence)}
                name={option.name}
                description={option.description}
                quantityLeft={option.quantity_left}
                currencyCode={product.currency_code}
                isPWYW={product.is_tiered_membership ? option.is_pwyw : !!product.pwyw}
                status={option.status}
                discount={previewDiscount({
                  ...selection,
                  optionId: option.id,
                  price: { value: null, error: false },
                })}
                recurrence={selection.recurrence}
                product={product}
                quantity={selection.quantity}
                hidePrice={hidePrices}
              />
            ))}
          <div itemProp="offerCount" className="hidden">
            {product.options.length}
          </div>
          <div itemProp="lowPrice" className="hidden">
            {formatPriceCentsWithoutCurrencySymbol(
              product.currency_code,
              Math.min(
                ...product.options.map((option) => basePriceCents + computeOptionPrice(option, selection.recurrence)),
              ),
            )}
          </div>
          <div itemProp="priceCurrency" className="hidden">
            {product.currency_code}
          </div>
        </Tabs>
      ) : null}
      {isPWYW ? pwywInput : null}
      {product.native_type === "call" && selectedOption ? (
        <CallDateAndTimeSelectorBoundary>
          <React.Suspense fallback={<div role="status">Loading appointment times…</div>}>
            <CallDateAndTimeSelector
              product={product}
              selectedOption={selectedOption}
              selectedStartTime={selection.callStartTime}
              onChange={({ callStartTime }) =>
                update({ callStartTime: callStartTime ? callStartTime.toISOString() : null })
              }
            />
          </React.Suspense>
        </CallDateAndTimeSelectorBoundary>
      ) : null}
      {hasConfigurableQuantity ? (
        <Fieldset>
          <FieldsetTitle>
            <Label htmlFor={quantityInputUID}>{product.is_multiseat_license ? "Seats" : "Quantity"}</Label>
          </FieldsetTitle>
          <NumberInput onChange={(quantity) => update({ quantity: quantity ?? 0 })} value={selection.quantity}>
            {(props) => <Input type="number" id={quantityInputUID} {...props} min={1} max={maxQuantity ?? undefined} />}
          </NumberInput>
        </Fieldset>
      ) : null}
      {showInstallmentPlan && product.installment_plan ? (
        <PaymentOptionSelector product={product} selection={selection} onChange={update} />
      ) : null}
    </>
  );
});
ConfigurationSelector.displayName = "ConfigurationSelector";
