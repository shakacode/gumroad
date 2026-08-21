import type { Props as ProductProps } from "$app/components/Product/Interactive";
import type { PageProps as SectionsProps } from "$app/components/Profile/Sections";

export type ProductInteractionPageProps = Omit<ProductProps, "discount_code"> & {
  main_section_index: number;
  page_layout: string | null;
} & SectionsProps;
