"use client";

import * as React from "react";

const Context = React.createContext<{ productId: string; url: string } | null>(null);

// The RSC client loader resolves through React.lazy, which rejects a Provider object.
export const ProductVariantNavigationProvider = ({
  children,
  value,
}: React.ComponentProps<typeof Context.Provider>) => <Context.Provider value={value}>{children}</Context.Provider>;

export const useProductVariantNavigation = (productId: string) => {
  const navigation = React.useContext(Context);
  return navigation?.productId === productId ? navigation.url : null;
};
