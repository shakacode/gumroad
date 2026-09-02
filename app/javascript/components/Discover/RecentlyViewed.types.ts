import type { CardProduct } from "$app/parsers/product";

export type RecentlyViewedProduct = CardProduct & { viewed_at: string };

export type RecentlyViewedProps = {
  products: RecentlyViewedProduct[];
  anonymous_key?: string | null;
};
