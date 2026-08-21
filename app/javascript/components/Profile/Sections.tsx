import * as React from "react";

import {
  FeaturedProductSection as SavedFeaturedProductSection,
  PostsSection as SavedPostsSection,
  ProductsSection as SavedProductsSection,
  RichTextSection as SavedRichTextSection,
  SubscribeSection as SavedSubscribeSection,
  WishlistsSection as SavedWishlistsSection,
} from "$app/data/profile_settings";
import { SearchResults } from "$app/data/search";
import { CreatorProfile } from "$app/parsers/profile";
import { CurrencyCode } from "$app/utils/currency";

import { CardGrid, useSearchReducer } from "$app/components/Product/CardGrid";
import { CoffeeProduct } from "$app/components/Product/CoffeeProduct";
import type { PriceSelection } from "$app/components/Product/ConfigurationSelector";
import type { Props as ProductProps } from "$app/components/Product/Interactive";
import { ProfileRichTextEnhancement } from "$app/components/Profile/ProfileRichTextEnhancement.client";
import { ProfileSectionFrame } from "$app/components/Profile/ProfileSectionFrame";
import { ProfileSubscribe } from "$app/components/Profile/ProfileSubscribe.client";
import { ProfileWishlists } from "$app/components/Profile/ProfileWishlists.client";
import { CardContent } from "$app/components/ui/Card";
import { Input } from "$app/components/ui/Input";
import type { CardWishlist } from "$app/components/Wishlist/Card";

type BaseSection = {
  id: string;
  header: string | null;
};

type ProductsSection = BaseSection &
  Pick<SavedProductsSection, "type" | "show_filters" | "default_product_sort"> & { search_results: SearchResults };

export type Post = { id: string; slug: string; name: string; published_at: string | null };
type PostsSection = BaseSection & {
  type: SavedPostsSection["type"];
  posts: Post[];
};

export type RichTextSection = BaseSection & Pick<SavedRichTextSection, "type" | "text">;

const ProfileRichTextSectionView = ({ section }: { section: RichTextSection }) => (
  <ProfileRichTextEnhancement content={section.text} />
);

type SubscribeSection = BaseSection & Pick<SavedSubscribeSection, "type" | "button_label">;

type FeaturedProductSection = BaseSection & Pick<SavedFeaturedProductSection, "type"> & { props: ProductProps | null };

type WishlistsSection = BaseSection & Pick<SavedWishlistsSection, "type"> & { wishlists: CardWishlist[] };

export type Section =
  | ProductsSection
  | PostsSection
  | RichTextSection
  | SubscribeSection
  | FeaturedProductSection
  | WishlistsSection;

const ProductsSectionView = ({
  section,
  creatorProfile,
  currencyCode,
}: {
  section: ProductsSection;
  creatorProfile: CreatorProfile;
  currencyCode: CurrencyCode;
}) => {
  const defaultParams = {
    sort: section.default_product_sort,
    user_id: creatorProfile.external_id,
    section_id: section.id,
  };
  const [state, dispatch] = useSearchReducer({
    params: defaultParams,
    results: section.search_results,
  });
  const [enteredQuery, setEnteredQuery] = React.useState("");

  return (
    <CardGrid
      hideFilters={!section.show_filters}
      state={state}
      dispatchAction={dispatch}
      title={
        state.results
          ? state.results.total > 0
            ? `1-${state.results.products.length} of ${state.results.total} products`
            : "No products found"
          : "Loading products..."
      }
      currencyCode={currencyCode}
      defaults={defaultParams}
      prependFilters={
        <CardContent>
          <Input
            aria-label="Search products"
            placeholder="Search products"
            value={enteredQuery}
            onChange={(e) => setEnteredQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                const { from: _, ...params } = state.params;
                dispatch({ type: "set-params", params: { ...params, query: enteredQuery } });
              }
            }}
            className="grow"
          />
        </CardContent>
      }
    />
  );
};

export type FeaturedProductRenderer = (options: {
  sectionId: string;
  props: ProductProps;
  selection: PriceSelection;
  setSelection: React.Dispatch<React.SetStateAction<PriceSelection>>;
}) => React.ReactNode;

export const FeaturedProductView = ({
  sectionId,
  props,
  renderProduct,
}: {
  sectionId: string;
  props: ProductProps;
  renderProduct: FeaturedProductRenderer;
}) => {
  const [selection, setSelection] = React.useState<PriceSelection>({
    recurrence: props.product.recurrences?.default ?? null,
    price: { error: false, value: null },
    quantity: 1,
    rent: false,
    optionId: null,
    callStartTime: null,
    payInInstallments: false,
  });
  return props.product.native_type === "coffee" ? (
    <CoffeeProduct {...props} />
  ) : (
    renderProduct({ sectionId, props, selection, setSelection })
  );
};

const FeaturedProductSectionView = ({
  section,
  renderFeaturedProduct,
}: {
  section: FeaturedProductSection;
  renderFeaturedProduct: FeaturedProductRenderer;
}) =>
  section.props ? (
    <FeaturedProductView sectionId={section.id} props={section.props} renderProduct={renderFeaturedProduct} />
  ) : null;

export type PageProps = {
  currency_code: CurrencyCode;
  creator_profile: CreatorProfile;
  sections: Section[];
};

export { ProfileSectionLayout as SectionLayout } from "$app/components/Profile/ProfileSectionFrame";

export const Section = ({
  section,
  creator_profile,
  currency_code,
  renderFeaturedProduct,
  postsContent,
}: {
  section: Section;
  renderFeaturedProduct: FeaturedProductRenderer;
  postsContent?: React.ReactNode;
} & PageProps) => (
  <ProfileSectionFrame id={section.id} header={section.header}>
    {section.type === "SellerProfileProductsSection" ? (
      <ProductsSectionView section={section} creatorProfile={creator_profile} currencyCode={currency_code} />
    ) : section.type === "SellerProfilePostsSection" ? (
      postsContent
    ) : section.type === "SellerProfileRichTextSection" ? (
      <ProfileRichTextSectionView section={section} />
    ) : section.type === "SellerProfileSubscribeSection" ? (
      <ProfileSubscribe creatorProfile={creator_profile} buttonLabel={section.button_label} />
    ) : section.type === "SellerProfileFeaturedProductSection" ? (
      <FeaturedProductSectionView key={section.id} section={section} renderFeaturedProduct={renderFeaturedProduct} />
    ) : (
      <ProfileWishlists wishlists={section.wishlists} />
    )}
  </ProfileSectionFrame>
);
