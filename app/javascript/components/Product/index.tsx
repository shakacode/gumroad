import type { ProductData } from "$app/components/Product/Interactive";
import { Product as LegacyProduct } from "$app/components/Product/LegacyProduct";

export * from "$app/components/Product/Interactive";

export type Product = ProductData;
export const Product = LegacyProduct;
