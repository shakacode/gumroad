import * as React from "react";

import { Wishlist } from "$app/data/wishlists";
import { Discount } from "$app/parsers/checkout";
import {
  AnalyticsData,
  AssetPreview,
  BuyerCurrencyDisplay,
  CustomButtonTextOption,
  FreeTrial,
  ProductNativeType,
  Ratings,
  RatingsWithPercentages,
} from "$app/parsers/product";
import type { SellerReputation } from "$app/parsers/profile";
import { CurrencyCode } from "$app/utils/currency";

import {
  ConfigurationSelectorHandle,
  Option,
  PriceSelection,
  PurchasingPowerParityDetails,
  Recurrences,
  Rental,
} from "$app/components/Product/ConfigurationSelector";
import ProductAnalytics from "$app/components/Product/ProductAnalytics.client";
import { ProductBundle } from "$app/components/Product/ProductBundle.client";
import ProductDescription, { type PublicFile } from "$app/components/Product/ProductDescription.client";
import { ProductLicenseKeyLookup } from "$app/components/Product/ProductLicenseKeyLookup.client";
import { ProductMedia } from "$app/components/Product/ProductMedia.client";
import { ProductPreorderNotice } from "$app/components/Product/ProductPreorderNotice.client";
import { ProductPrice } from "$app/components/Product/ProductPrice.client";
import { ProductPurchaseControls } from "$app/components/Product/ProductPurchaseControls.client";
import { ProductRefundPolicy } from "$app/components/Product/ProductRefundPolicy.client";
import { ProductReviews } from "$app/components/Product/ProductReviews.client";
import { ProductSecondaryActions } from "$app/components/Product/ProductSecondaryActions.client";
import { InstallmentPlan } from "$app/components/ProductEdit/state";
import type { Review as FormReview } from "$app/components/ReviewForm";

export type Seller = { id: string; name: string; avatar_url: string; profile_url: string; is_verified: boolean };

export type RefundPolicy = {
  title: string;
  fine_print: string | null;
  updated_at: string;
};

export type { PublicFile } from "$app/components/Product/ProductDescription.client";
export { formatDiscountAmount } from "$app/components/Product/ProductPurchaseControls.client";
export { ProductRatingsSummary as RatingsSummary } from "$app/components/Product/ProductRatingsSummary";
export { useSelectionFromUrl } from "$app/components/Product/useSelectionFromUrl.client";

export type ProductData = {
  id: string;
  name: string;
  seller: Seller | null;
  collaborating_user: Seller | null;
  covers: AssetPreview[];
  main_cover_id: string | null;
  quantity_remaining: number | null;
  currency_code: CurrencyCode;
  long_url: string;
  duration_in_months: number | null;
  is_sales_limited: boolean;
  price_cents: number;
  buyer_currency?: string;
  buyer_local_currency_rate?: number;
  buyer_local_currency_subunit_to_unit?: number;
  buyer_local_price_cents?: number;
  buyer_local_original_price_cents?: number;
  buyer_currency_display?: BuyerCurrencyDisplay;
  pwyw: { suggested_price_cents: number | null } | null;
  installment_plan: InstallmentPlan | null;
  ratings: RatingsWithPercentages | null;
  // Present only while seller_reputation_summary is on for the seller. Always
  // excludes this product's own reviews (hence "other products" in the copy).
  seller_reputation?: SellerReputation | null;
  is_legacy_subscription: boolean;
  is_tiered_membership: boolean;
  is_recurring_billing: boolean;
  is_physical: boolean;
  custom_view_content_button_text: string | null;
  custom_button_text_option: "" | CustomButtonTextOption | null;
  permalink: string;
  preorder: { release_date: string } | null;
  description_html: string | null;
  is_compliance_blocked: boolean;
  is_published: boolean;
  is_stream_only: boolean;
  streamable: boolean;
  is_quantity_enabled: boolean;
  is_multiseat_license: boolean;
  is_licensed: boolean;
  hide_sold_out_variants?: boolean;
  native_type: ProductNativeType;
  sales_count: number | null;
  summary: string | null;
  attributes: { name: string; value: string }[];
  free_trial: FreeTrial | null;
  rental: Rental | null;
  recurrences: Recurrences | null;
  options: Option[];
  analytics: AnalyticsData;
  has_third_party_analytics: boolean;
  ppp_details: PurchasingPowerParityDetails | null;
  can_edit: boolean;
  refund_policy: RefundPolicy | null;
  bundle_products: {
    id: string;
    name: string;
    ratings: Ratings | null;
    price: number;
    currency_code: CurrencyCode;
    thumbnail_url: string | null;
    native_type: ProductNativeType;
    url: string;
    quantity: number;
    variant: string | null;
  }[];
  public_files: PublicFile[];
};
export type Purchase = {
  id: string;
  email_digest: string;
  created_at: string;
  review: FormReview | null;
  should_show_receipt: boolean;
  was_paid: boolean;
  is_gift_receiver_purchase: boolean;
  content_url: string | null;
  show_view_content_button_on_product_page: boolean;
  total_price_including_tax_and_shipping: string;
  subscription_has_lapsed: boolean;
  membership: { tier_name: string | null; tier_description: string | null; manage_url: string } | null;
  // Present only for licensed products, and only when the backend could identify the
  // visitor (signed-in purchaser, or an HMAC'd receipt/review link). Purchases matched
  // by the browser cookie alone never carry the key — Link#purchase_info_for_product_page
  // strips it, because a cookie identifies a browser rather than a person. Optional
  // rather than nullable because the strip removes the key entirely.
  license_key?: string | null;
};
export type ProductDiscount =
  | {
      valid: false;
      error_code:
        | "sold_out"
        | "invalid_offer"
        | "inactive"
        | "unmet_minimum_purchase_quantity"
        | "not_existing_customer";
    }
  | { valid: true; code: string; discount: Discount }
  | null;

export type WishlistForProduct = Wishlist & {
  selections_in_wishlist: { variant_id: string | null; recurrence: string | null; rent: boolean; quantity: number }[];
};

export type Props = {
  product: ProductData;
  purchase: Purchase | null;
  discount_code: ProductDiscount | null;
  wishlists: WishlistForProduct[];
};

export type ServerContent = {
  availabilityNotice: React.ReactNode;
  bundleItems: Record<string, React.ReactNode>;
  description: React.ReactNode;
  descriptionNeedsClientEnhancement: boolean;
  initialCover: { id: string; content: React.ReactNode } | null;
  membershipNotices: React.ReactNode;
  quantityRemaining: React.ReactNode;
  receipt: React.ReactNode;
  reviews: React.ReactNode;
  salesNotice: React.ReactNode;
  streamingNotice: React.ReactNode;
  title: React.ReactNode;
  sellerAndRatings: React.ReactNode;
  details: React.ReactNode;
  sellerReputation: React.ReactNode;
};

export const InteractiveProduct = ({
  product,
  purchase,
  discountCode: initialDiscountCode,
  setDiscountCode,
  ctaLabel,
  selection,
  setSelection,
  ctaButtonRef,
  configurationSelectorRef,
  wishlists = [],
  disableAnalytics,
  serverContent,
}: {
  product: ProductData;
  purchase: Purchase | null;
  discountCode?: ProductDiscount | null;
  setDiscountCode?: React.Dispatch<React.SetStateAction<ProductDiscount>>;
  ctaLabel?: string | undefined;
  selection: PriceSelection;
  setSelection?: React.Dispatch<React.SetStateAction<PriceSelection>>;
  ctaButtonRef?: React.MutableRefObject<HTMLAnchorElement | null>;
  configurationSelectorRef?: React.MutableRefObject<ConfigurationSelectorHandle | null>;
  wishlists?: WishlistForProduct[];
  disableAnalytics?: boolean;
  serverContent: ServerContent;
}) => {
  const [localDiscountCode, setLocalDiscountCode] = React.useState(initialDiscountCode);
  const discountCode = setDiscountCode ? initialDiscountCode : localDiscountCode;

  React.useEffect(() => {
    if (!setDiscountCode) setLocalDiscountCode(initialDiscountCode);
  }, [initialDiscountCode, setDiscountCode]);

  return (
    <article className="relative grid rounded border border-border bg-background lg:grid-cols-[2fr_1fr]">
      <ProductAnalytics
        analytics={product.analytics}
        buyerCurrencyDisplay={product.buyer_currency_display}
        disabled={disableAnalytics}
        hasThirdPartyAnalytics={product.has_third_party_analytics}
        permalink={product.permalink}
        productName={product.name}
        sellerId={product.seller?.id}
      />
      <ProductMedia
        covers={product.covers}
        initialCover={serverContent.initialCover}
        mainCoverId={product.main_cover_id}
        productName={product.name}
      />
      {serverContent.quantityRemaining}
      <section className="lg:border-r">
        <header className="grid gap-4 p-6 not-first:border-t">
          {/* dir="auto" lets an RTL product name (Hebrew, Arabic) render right-to-left
              instead of inheriting the document's LTR base direction, which misplaces
              neutral characters like quotes and digits (gumroad-private#1259; same
              rationale as the description fix in #6138). */}
          {serverContent.title}
        </header>
        <section className="grid grid-cols-[auto_1fr] gap-[1px] border-t border-border p-0 sm:grid-cols-[auto_auto_minmax(max-content,1fr)]">
          <ProductPrice product={product} selection={selection} discountCode={discountCode} />
          {serverContent.sellerAndRatings}
        </section>
        {purchase !== null ? (
          serverContent.receipt
        ) : product.is_licensed && !product.can_edit ? (
          <ProductLicenseKeyLookup />
        ) : null}
        <ProductBundle
          product={product}
          selection={selection}
          discountCode={discountCode}
          bundleItems={serverContent.bundleItems}
        />
        <section className="border-t border-border p-6">
          <ProductDescription
            descriptionHtml={product.description_html}
            initialContent={serverContent.description}
            needsClientEnhancement={serverContent.descriptionNeedsClientEnhancement}
            publicFiles={product.public_files}
          />
        </section>
      </section>
      <section>
        <section className="grid gap-4 p-6 not-first:border-t">
          <ProductPurchaseControls
            product={product}
            purchase={purchase}
            discountCode={discountCode}
            selection={selection}
            setSelection={setSelection}
            ctaButtonRef={ctaButtonRef}
            configurationSelectorRef={configurationSelectorRef}
            ctaLabel={ctaLabel}
            availabilityNotice={serverContent.availabilityNotice}
            membershipNotices={serverContent.membershipNotices}
            onDiscountExpiration={() => {
              const inactiveDiscount = { valid: false, error_code: "inactive" } as const;
              if (setDiscountCode) setDiscountCode(inactiveDiscount);
              else setLocalDiscountCode(inactiveDiscount);
            }}
          />
          {serverContent.salesNotice}
          <ProductPreorderNotice releaseDate={product.preorder?.release_date ?? null} />
          {serverContent.streamingNotice}
          {serverContent.details}
          <ProductSecondaryActions product={product} selection={selection} wishlists={wishlists} />
          {product.refund_policy ? (
            <ProductRefundPolicy refundPolicy={product.refund_policy} permalink={product.permalink} />
          ) : null}
        </section>
        {product.ratings && product.ratings.count > 0 ? (
          <ProductReviews initialContent={serverContent.reviews} productId={product.id} seller={product.seller} />
        ) : null}
        {serverContent.sellerReputation}
      </section>
    </article>
  );
};
