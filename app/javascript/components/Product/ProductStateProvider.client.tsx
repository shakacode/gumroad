"use client";

import * as React from "react";

import type { ConfigurationSelectorHandle, PriceSelection } from "$app/components/Product/ConfigurationSelector";
import type { ProductData, ProductDiscount } from "$app/components/Product/Interactive";
import { useSelectionFromUrl } from "$app/components/Product/useSelectionFromUrl.client";

type ProductState = {
  selection: PriceSelection;
  setSelection: React.Dispatch<React.SetStateAction<PriceSelection>>;
  ctaButtonRef: React.MutableRefObject<HTMLAnchorElement | null>;
  configurationSelectorRef: React.MutableRefObject<ConfigurationSelectorHandle | null>;
  discountCode: ProductDiscount;
  setDiscountCode: React.Dispatch<React.SetStateAction<ProductDiscount>>;
};

const ProductStateContext = React.createContext<ProductState | null>(null);

const ProductStateValues = ({
  children,
  initialDiscountCode,
  selection,
  setSelection,
}: {
  children: React.ReactNode;
  initialDiscountCode: ProductDiscount;
  selection: PriceSelection;
  setSelection: React.Dispatch<React.SetStateAction<PriceSelection>>;
}) => {
  const [discountCode, setDiscountCode] = React.useState(initialDiscountCode);
  const ctaButtonRef = React.useRef<HTMLAnchorElement>(null);
  const configurationSelectorRef = React.useRef<ConfigurationSelectorHandle>(null);

  React.useEffect(() => setDiscountCode(initialDiscountCode), [initialDiscountCode]);

  const state = React.useMemo(
    () => ({ selection, setSelection, ctaButtonRef, configurationSelectorRef, discountCode, setDiscountCode }),
    [discountCode, selection],
  );

  return <ProductStateContext.Provider value={state}>{children}</ProductStateContext.Provider>;
};

export const ProductStateProvider = ({
  children,
  initialDiscountCode,
  product,
}: {
  children: React.ReactNode;
  initialDiscountCode: ProductDiscount;
  product: ProductData;
}) => {
  const [selection, setSelection] = useSelectionFromUrl(product);

  return (
    <ProductStateValues initialDiscountCode={initialDiscountCode} selection={selection} setSelection={setSelection}>
      {children}
    </ProductStateValues>
  );
};

export const FeaturedProductStateProvider = ({
  children,
  initialDiscountCode,
  product,
}: {
  children: React.ReactNode;
  initialDiscountCode: ProductDiscount;
  product: ProductData;
}) => {
  const [selection, setSelection] = React.useState<PriceSelection>({
    recurrence: product.recurrences?.default ?? null,
    price: { error: false, value: null },
    quantity: 1,
    rent: false,
    optionId: null,
    callStartTime: null,
    payInInstallments: false,
  });

  return (
    <ProductStateValues initialDiscountCode={initialDiscountCode} selection={selection} setSelection={setSelection}>
      {children}
    </ProductStateValues>
  );
};

export const useProductState = () => {
  const state = React.useContext(ProductStateContext);
  if (!state) throw new Error("useProductState must be used within ProductStateProvider");
  return state;
};
