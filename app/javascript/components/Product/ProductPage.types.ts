import type { ReactNode } from "react";

import type { Props as ProductProps } from "$app/components/Product/Interactive";
import type { PageProps as SectionsProps } from "$app/components/Profile/Sections";

export type ProductInteractionPageProps = Omit<ProductProps, "discount_code"> & {
  main_section_index: number;
  page_layout: string | null;
} & SectionsProps;

export type ProductInteractionsProps = Pick<
  ProductInteractionPageProps,
  "main_section_index" | "product" | "purchase" | "sections"
> & {
  cart?: boolean;
  hasHero?: boolean;
  productArticle: ReactNode;
  serverProfileSections: Record<string, ReactNode>;
};
