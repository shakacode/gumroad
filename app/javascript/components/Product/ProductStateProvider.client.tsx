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

export const useProductState = () => {
  const state = React.useContext(ProductStateContext);
  if (!state) throw new Error("useProductState must be used within ProductStateProvider");
  return state;
};
