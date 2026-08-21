import { Archive } from "@boxicons/react";
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
import { fetchWithOneRetry } from "$app/utils/lazy_chunk";

import { CardGrid, useSearchReducer } from "$app/components/Product/CardGrid";
import { CoffeeProduct } from "$app/components/Product/CoffeeProduct";
import type { PriceSelection } from "$app/components/Product/ConfigurationSelector";
import type { Props as ProductProps } from "$app/components/Product/Interactive";
import { FollowForm } from "$app/components/Profile/FollowForm";
import { ProfileSectionFrame } from "$app/components/Profile/ProfileSectionFrame";
import { CardContent } from "$app/components/ui/Card";
import { Input } from "$app/components/ui/Input";
import { Card as WishlistCard, CardGrid as WishlistCardGrid, CardWishlist } from "$app/components/Wishlist/Card";

const importProfileRichText = () => import("$app/components/Profile/ProfileRichText.client");
const ProfileRichText = React.lazy(() => fetchWithOneRetry(importProfileRichText));
const CLIENT_RICH_TEXT_NODES = new Set(["codeBlock", "raw", "reviewCard", "upsellCard"]);

export const profileRichTextNeedsClientEnhancement = (node: unknown): boolean => {
  if (typeof node !== "object" || node === null) return false;
  if ("type" in node && typeof node.type === "string" && CLIENT_RICH_TEXT_NODES.has(node.type)) return true;
  return "content" in node && Array.isArray(node.content) && node.content.some(profileRichTextNeedsClientEnhancement);
};

export class ProfileRichTextLoadBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}

const ProfileRichTextSectionView = ({
  section,
  serverContent,
}: {
  section: RichTextSection;
  serverContent?: React.ReactNode;
}) => {
  if (serverContent != null && !profileRichTextNeedsClientEnhancement(section.text)) return serverContent;

  return (
    <ProfileRichTextLoadBoundary fallback={serverContent}>
      <React.Suspense fallback={serverContent ?? null}>
        <ProfileRichText section={section} fallback={serverContent ?? null} />
      </React.Suspense>
    </ProfileRichTextLoadBoundary>
  );
};

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

export const SubscribeView = ({
  creatorProfile,
  buttonLabel,
}: {
  creatorProfile: CreatorProfile;
  buttonLabel: string;
}) => (
  <div style={{ maxWidth: "500px" }}>
    <FollowForm creatorProfile={creatorProfile} buttonLabel={buttonLabel} buttonColor="primary" />
  </div>
);

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

export const WishlistsView = ({ wishlists }: { wishlists: CardWishlist[] }) =>
  wishlists.length > 0 ? (
    <WishlistCardGrid>
      {wishlists.map((wishlist) => (
        <WishlistCard key={wishlist.id} wishlist={wishlist} hideSeller />
      ))}
    </WishlistCardGrid>
  ) : (
    <div className="flex h-full flex-col content-center gap-4 text-center">
      <h1>
        <Archive pack="filled" className="size-5" />
      </h1>
      No wishlists selected
    </div>
  );

export const WishlistsSectionView = ({ section }: { section: WishlistsSection }) => (
  <WishlistsView wishlists={section.wishlists} />
);

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

const SubscribeSectionView = ({
  section,
  creatorProfile,
}: {
  section: SubscribeSection;
  creatorProfile: CreatorProfile;
}) => <SubscribeView creatorProfile={creatorProfile} buttonLabel={section.button_label} />;

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
  richTextServerContent,
}: {
  section: Section;
  renderFeaturedProduct: FeaturedProductRenderer;
  postsContent?: React.ReactNode;
  richTextServerContent?: React.ReactNode;
} & PageProps) => (
  <ProfileSectionFrame id={section.id} header={section.header}>
    {section.type === "SellerProfileProductsSection" ? (
      <ProductsSectionView section={section} creatorProfile={creator_profile} currencyCode={currency_code} />
    ) : section.type === "SellerProfilePostsSection" ? (
      postsContent
    ) : section.type === "SellerProfileRichTextSection" ? (
      <ProfileRichTextSectionView section={section} serverContent={richTextServerContent} />
    ) : section.type === "SellerProfileSubscribeSection" ? (
      <SubscribeSectionView key={section.id} section={section} creatorProfile={creator_profile} />
    ) : section.type === "SellerProfileFeaturedProductSection" ? (
      <FeaturedProductSectionView key={section.id} section={section} renderFeaturedProduct={renderFeaturedProduct} />
    ) : (
      <WishlistsSectionView key={section.id} section={section} />
    )}
  </ProfileSectionFrame>
);
