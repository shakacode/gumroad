import * as React from "react";

import {
  FeaturedProductSection as SavedFeaturedProductSection,
  PostsSection as SavedPostsSection,
  RichTextSection as SavedRichTextSection,
  SubscribeSection as SavedSubscribeSection,
  WishlistsSection as SavedWishlistsSection,
} from "$app/data/profile_settings";
import { CreatorProfile } from "$app/parsers/profile";
import { CurrencyCode } from "$app/utils/currency";

import { CoffeeProduct } from "$app/components/Product/CoffeeProduct";
import type { PriceSelection } from "$app/components/Product/ConfigurationSelector";
import type { Props as ProductProps } from "$app/components/Product/Interactive";
import { ProfileProducts, type ProfileProductsSection } from "$app/components/Profile/ProfileProducts.client";
import { ProfileRichTextEnhancement } from "$app/components/Profile/ProfileRichTextEnhancement.client";
import { ProfileSectionFrame } from "$app/components/Profile/ProfileSectionFrame";
import { ProfileSubscribe } from "$app/components/Profile/ProfileSubscribe.client";
import { ProfileWishlists } from "$app/components/Profile/ProfileWishlists.client";
import type { CardWishlist } from "$app/components/Wishlist/Card";

type BaseSection = {
  id: string;
  header: string | null;
};

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
  | ProfileProductsSection
  | PostsSection
  | RichTextSection
  | SubscribeSection
  | FeaturedProductSection
  | WishlistsSection;

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
      <ProfileProducts section={section} creatorProfile={creator_profile} currencyCode={currency_code} />
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
