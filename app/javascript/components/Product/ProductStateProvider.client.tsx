"use client";

import * as React from "react";

import type { ConfigurationSelectorHandle, PriceSelection } from "$app/components/Product/ConfigurationSelector";
import { type ProductData, useSelectionFromUrl } from "$app/components/Product/Interactive";

type ProductState = {
  selection: PriceSelection;
  setSelection: React.Dispatch<React.SetStateAction<PriceSelection>>;
  ctaButtonRef: React.MutableRefObject<HTMLAnchorElement | null>;
  configurationSelectorRef: React.MutableRefObject<ConfigurationSelectorHandle | null>;
};

const ProductStateContext = React.createContext<ProductState | null>(null);

export const ProductStateProvider = ({ children, product }: { children: React.ReactNode; product: ProductData }) => {
  const [selection, setSelection] = useSelectionFromUrl(product);
  const ctaButtonRef = React.useRef<HTMLAnchorElement>(null);
  const configurationSelectorRef = React.useRef<ConfigurationSelectorHandle>(null);
  const state = React.useMemo(() => ({ selection, setSelection, ctaButtonRef, configurationSelectorRef }), [selection]);

  return <ProductStateContext.Provider value={state}>{children}</ProductStateContext.Provider>;
};

export const useProductState = () => {
  const state = React.useContext(ProductStateContext);
  if (!state) throw new Error("useProductState must be used within ProductStateProvider");
  return state;
};
