import * as React from "react";

import { incrementProductViews } from "$app/data/view_event";
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
import { SellerReputation } from "$app/parsers/profile";
import { BuyerLocalCurrencyContext, CurrencyCode, formatBuyerLocalOrSetPrice } from "$app/utils/currency";
import { startTrackingForSeller, trackBuyerCurrencyDisplayView, trackProductEvent } from "$app/utils/user_analytics";

import {
  applySelection,
  ConfigurationSelectorHandle,
  Option,
  PriceSelection,
  PurchasingPowerParityDetails,
  Recurrences,
  Rental,
} from "$app/components/Product/ConfigurationSelector";
import { getStandalonePrice } from "$app/components/Product/pricing";
import { ProductBundle } from "$app/components/Product/ProductBundle.client";
import {
  ProductAvailabilityNotice,
  ProductBundleItemContent,
  ProductDescriptionContent,
  ProductDetails,
  ProductMembershipNotices,
  ProductQuantityRemaining,
  ProductReceiptContent,
  ProductReviewsContent,
  ProductSalesNotice,
  ProductSellerAndRatings,
  ProductSellerReputation,
  ProductStreamingNotice,
  ProductTitle,
} from "$app/components/Product/ProductContent";
import ProductDescription from "$app/components/Product/ProductDescription.client";
import { ProductLicenseKeyLookup } from "$app/components/Product/ProductLicenseKeyLookup.client";
import { ProductMedia } from "$app/components/Product/ProductMedia.client";
import { ProductPreorderNotice } from "$app/components/Product/ProductPreorderNotice.client";
import { ProductPrice } from "$app/components/Product/ProductPrice.client";
import { ProductPurchaseControls } from "$app/components/Product/ProductPurchaseControls.client";
import { ProductRatingsSummary as RatingsSummary } from "$app/components/Product/ProductRatingsSummary";
import { ProductRefundPolicy } from "$app/components/Product/ProductRefundPolicy.client";
import { ProductReviews } from "$app/components/Product/ProductReviews.client";
import { ProductSecondaryActions } from "$app/components/Product/ProductSecondaryActions.client";
import { InstallmentPlan } from "$app/components/ProductEdit/state";
import { Review as FormReview } from "$app/components/ReviewForm";
import { useAddThirdPartyAnalytics } from "$app/components/useAddThirdPartyAnalytics";
import { useOriginalLocation } from "$app/components/useOriginalLocation";
import { useRunOnce } from "$app/components/useRunOnce";

export type Seller = { id: string; name: string; avatar_url: string; profile_url: string; is_verified: boolean };

type RefundPolicy = {
  title: string;
  fine_print: string | null;
  updated_at: string;
};

export type PublicFile = {
  id: string;
  name: string;
  extension: string | null;
  file_size: number | null;
  url: string | null;
};

export type Product = {
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

export { getNotForSaleMessage } from "$app/components/Product/productAvailability";

export type WishlistForProduct = Wishlist & {
  selections_in_wishlist: { variant_id: string | null; recurrence: string | null; rent: boolean; quantity: number }[];
};

export const formatDiscountAmount = (discount: Discount, buyerLocalContext: BuyerLocalCurrencyContext) => {
  if (discount.type === "percent") {
    return discount.tiered && discount.min_percents !== undefined && discount.max_percents !== undefined
      ? discount.min_percents === discount.max_percents
        ? `${discount.max_percents}%`
        : `${discount.min_percents}%–${discount.max_percents}%`
      : `${discount.percents}%`;
  }

  return formatBuyerLocalOrSetPrice(discount.once_per_cart_amount_cents ?? discount.cents, buyerLocalContext, {
    symbolFormat: "long",
  });
};

export { useSelectionFromUrl } from "$app/components/Product/useSelectionFromUrl.client";

export type Props = {
  product: Product;
  purchase: Purchase | null;
  discount_code: ProductDiscount | null;
  wishlists: WishlistForProduct[];
};

export const Product = ({
  product,
  purchase,
  discountCode: initialDiscountCode,
  ctaLabel,
  selection,
  setSelection,
  ctaButtonRef,
  configurationSelectorRef,
  wishlists = [],
  disableAnalytics,
  hideSellerByline,
}: {
  product: Product;
  purchase: Purchase | null;
  discountCode?: ProductDiscount | null;
  ctaLabel?: string | undefined;
  selection: PriceSelection;
  setSelection?: React.Dispatch<React.SetStateAction<PriceSelection>>;
  ctaButtonRef?: React.MutableRefObject<HTMLAnchorElement | null>;
  configurationSelectorRef?: React.MutableRefObject<ConfigurationSelectorHandle | null>;
  wishlists?: WishlistForProduct[];
  disableAnalytics?: boolean;
  // The storefront-wrapped product page renders the profile header directly above, which
  // already shows the same avatar and name — the byline is redundant there.
  hideSellerByline?: boolean | undefined;
}) => {
  const [discountCode, setDiscountCode] = React.useState(initialDiscountCode);

  React.useEffect(() => {
    setDiscountCode(initialDiscountCode);
  }, [initialDiscountCode]);

  const selectionAttributes = applySelection(product, discountCode?.valid ? discountCode.discount : null, selection);
  let { basePriceCents } = selectionAttributes;
  const addThirdPartyAnalytics = useAddThirdPartyAnalytics();

  const { searchParams } = new URL(useOriginalLocation());
  useRunOnce(() => {
    if (disableAnalytics) return;
    if (product.seller) {
      startTrackingForSeller(product.seller.id, product.analytics);
      trackBuyerCurrencyDisplayView(product.seller.id, product.buyer_currency_display);
      trackProductEvent(product.seller.id, {
        permalink: product.permalink,
        action: "viewed",
        product_name: product.name,
      });
    } else {
      trackBuyerCurrencyDisplayView(undefined, product.buyer_currency_display);
    }
    void incrementProductViews({ permalink: product.permalink, recommendedBy: searchParams.get("recommended_by") });
    if (product.has_third_party_analytics)
      addThirdPartyAnalytics({ permalink: product.permalink, location: "product" });
  });

  const isBundle = product.bundle_products.length > 0;
  if (isBundle) basePriceCents = getStandalonePrice(product);
  const showPrice =
    !product.recurrences &&
    product.options.length === 0 &&
    !product.rental?.rent_only &&
    (basePriceCents !== 0 || product.pwyw);

  const productContent = { ...product, show_price: !!showPrice };

  return (
    <article className="relative grid rounded border border-border bg-background lg:grid-cols-[2fr_1fr]">
      <ProductMedia
        covers={product.covers}
        initialCover={null}
        mainCoverId={product.main_cover_id}
        productName={product.name}
      />
      <ProductQuantityRemaining quantityRemaining={product.quantity_remaining} />
      <section className="lg:border-r">
        <header className="grid gap-4 p-6 not-first:border-t">
          <ProductTitle content={productContent} />
        </header>
        {/* Stack on mobile: an inflated price in an auto track leaves the name ~1ch
            wide, and overflow-wrap:anywhere then stacks it one character at a time. */}
        <section className="grid grid-cols-1 gap-[1px] border-t border-border p-0 sm:grid-cols-[auto_auto_minmax(max-content,1fr)]">
          <ProductPrice product={product} selection={selection} discountCode={discountCode} />
          <ProductSellerAndRatings content={productContent} hideSellerByline={hideSellerByline} />
        </section>
        {purchase !== null ? (
          <ProductReceiptContent
            purchase={purchase}
            permalink={product.permalink}
            isPreorder={product.preorder !== null}
            isBundle={isBundle}
            customViewContentButtonText={product.custom_view_content_button_text}
          />
        ) : !product.can_edit ? (
          <ProductLicenseKeyLookup
            isLicensed={product.is_licensed}
            hasDownload={!product.is_physical && product.native_type !== "call" && product.native_type !== "commission"}
          />
        ) : null}
        <ProductBundle
          product={product}
          selection={selection}
          discountCode={discountCode}
          bundleItems={Object.fromEntries(
            product.bundle_products.map((bundleProduct) => [
              bundleProduct.id,
              <ProductBundleItemContent key={bundleProduct.id} product={bundleProduct} />,
            ]),
          )}
        />
        <section className="border-t border-border p-6">
          <ProductDescription
            descriptionHtml={product.description_html}
            initialContent={<ProductDescriptionContent content={productContent} />}
            needsClientEnhancement
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
            availabilityNotice={<ProductAvailabilityNotice content={productContent} />}
            membershipNotices={<ProductMembershipNotices content={productContent} />}
            onDiscountExpiration={() => setDiscountCode({ valid: false, error_code: "inactive" })}
          />
          <ProductSalesNotice
            salesCount={product.sales_count}
            isMembership={product.recurrences !== null}
            isPreorder={product.preorder !== null}
            hasPaidPrice={product.price_cents > 0 || product.options.some((option) => option.price_difference_cents)}
          />
          <ProductPreorderNotice releaseDate={product.preorder?.release_date ?? null} />
          <ProductStreamingNotice content={productContent} />
          <ProductDetails content={productContent} />
          <ProductSecondaryActions product={product} selection={selection} wishlists={wishlists} />
          {product.refund_policy ? (
            <ProductRefundPolicy refundPolicy={product.refund_policy} permalink={product.permalink} />
          ) : null}
        </section>
        {product.ratings && product.ratings.count > 0 ? (
          <ProductReviews
            initialContent={<ProductReviewsContent ratings={product.ratings} />}
            productId={product.id}
            seller={product.seller}
          />
        ) : null}
        <ProductSellerReputation content={productContent} />
      </section>
    </article>
  );
};

export { RatingsSummary };
