"use client";

import * as React from "react";

export type ProductHydrationSnapshot = { locale: string; timeZone: string; referenceTime: number };

const Context = React.createContext<ProductHydrationSnapshot | undefined>(undefined);
export const ProductHydrationProvider = Context.Provider;

const subscribe = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;

// Each streamed island uses the request's snapshot until its own hydration completes.
export const useProductHydration = () => {
  const snapshot = React.useContext(Context);
  const hydrated = React.useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  return hydrated ? undefined : snapshot;
};
