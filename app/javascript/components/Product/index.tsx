import * as React from "react";

import { InteractiveProduct, type ProductData } from "$app/components/Product/Interactive";
import { Product as LegacyProduct, legacyProductContent } from "$app/components/Product/LegacyProduct";

export * from "$app/components/Product/Interactive";

export type Product = ProductData;
export const Product = ({ hideSellerByline, ...props }: React.ComponentProps<typeof LegacyProduct>) => (
  <InteractiveProduct {...props} serverContent={legacyProductContent({ ...props, hideSellerByline })} />
);
