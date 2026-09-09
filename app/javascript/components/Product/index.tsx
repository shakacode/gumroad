import { Star } from "@boxicons/react";
import { differenceInYears, parseISO } from "date-fns";
import * as React from "react";

import { trackUserProductAction } from "$app/data/user_action_event";
import { incrementProductViews } from "$app/data/view_event";
import { Wishlist } from "$app/data/wishlists";
import { Discount } from "$app/parsers/checkout";
import {
  AnalyticsData,
  AssetPreview,
  BuyerCurrencyDisplay,
  COMMISSION_DEPOSIT_PROPORTION,
  CustomButtonTextOption,
  FreeTrial,
  ProductNativeType,
  Ratings,
  RatingsWithPercentages,
} from "$app/parsers/product";
import { SellerReputation } from "$app/parsers/profile";
import { classNames } from "$app/utils/classNames";
import { BuyerLocalCurrencyContext, CurrencyCode, formatBuyerLocalOrSetPrice } from "$app/utils/currency";
import { formatDate } from "$app/utils/date";
import { formatOrderOfMagnitude } from "$app/utils/formatOrderOfMagnitude";
import { variantLabel } from "$app/utils/labels";
import { startTrackingForSeller, trackBuyerCurrencyDisplayView, trackProductEvent } from "$app/utils/user_analytics";

import { CartItemFooter, CartItemTitle } from "$app/components/CartItemList";
import { Modal } from "$app/components/Modal";
import { AuthorByline } from "$app/components/Product/AuthorByline";
import {
  applySelection,
  ConfigurationSelectorHandle,
  Option,
  PriceSelection,
  PurchasingPowerParityDetails,
  Recurrences,
  Rental,
} from "$app/components/Product/ConfigurationSelector";
import { Covers as CoversComponent } from "$app/components/Product/Covers";
import { getStandalonePrice } from "$app/components/Product/pricing";
import { ProductBundle } from "$app/components/Product/ProductBundle.client";
import ProductDescription from "$app/components/Product/ProductDescription.client";
import { ProductLicenseKeyLookup } from "$app/components/Product/ProductLicenseKeyLookup.client";
import { ProductPrice } from "$app/components/Product/ProductPrice.client";
import { ProductPurchaseControls } from "$app/components/Product/ProductPurchaseControls.client";
import { ProductRatingsSummary as RatingsSummary } from "$app/components/Product/ProductRatingsSummary";
import {
  ProductReceiptCopyLicenseKeyAction,
  ProductReceiptMembershipAction,
  ProductReceiptReviewAction,
  ProductReceiptViewContentAction,
} from "$app/components/Product/ProductReceiptActions.client";
import { ProductReviews } from "$app/components/Product/ProductReviews.client";
import { ProductSecondaryActions } from "$app/components/Product/ProductSecondaryActions.client";
import { Ribbon } from "$app/components/Product/Ribbon";
import { InstallmentPlan } from "$app/components/ProductEdit/state";
import { RatingStars } from "$app/components/RatingStars";
import { Review as FormReview } from "$app/components/ReviewForm";
import { Alert } from "$app/components/ui/Alert";
import { Card, CardContent } from "$app/components/ui/Card";
import { useAddThirdPartyAnalytics } from "$app/components/useAddThirdPartyAnalytics";
import { useOnChange } from "$app/components/useOnChange";
import { useOriginalLocation } from "$app/components/useOriginalLocation";
import { useUserAgentInfo } from "$app/components/UserAgent";
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

export const getNotForSaleMessage = (product: Product) =>
  product.is_compliance_blocked
    ? "Sorry, this item is not available in your location."
    : product.quantity_remaining === 0
      ? "Sold out, please go back and pick another option."
      : !product.is_published
        ? "This product is not currently for sale."
        : null;

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
  const notForSaleMessage = getNotForSaleMessage(product);
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
  // What the price tag and the contents list below strike through as the
  // "original price". Usually the same standalone sum, but on a bundle tier
  // that costs extra there is no honest comparison to draw, so this is null
  // and nothing is struck through. Kept separate from basePriceCents, which
  // also drives whether the price tag renders at all.

  // The storefront-wrapped page's profile header already shows the seller, but not a
  // collaborator — keep the byline when there is one so the "with X" context survives.
  const sellerByline =
    product.seller && !(hideSellerByline && !product.collaborating_user) ? (
      <AuthorByline
        name={product.seller.name}
        profileUrl={product.seller.profile_url}
        avatarUrl={product.seller.avatar_url}
        isTopCreator={product.seller.is_verified}
      />
    ) : null;

  const showPrice =
    !product.recurrences &&
    product.options.length === 0 &&
    !product.rental?.rent_only &&
    (basePriceCents !== 0 || product.pwyw);

  return (
    <article className="relative grid rounded border border-border bg-background lg:grid-cols-[2fr_1fr]">
      <Covers covers={product.covers} mainCoverId={product.main_cover_id} productName={product.name} />
      {product.quantity_remaining !== null ? <Ribbon>{product.quantity_remaining} left</Ribbon> : null}
      <section className="lg:border-r">
        <header className="grid gap-4 p-6 not-first:border-t">
          {/* dir="auto" lets an RTL product name (Hebrew, Arabic) render right-to-left
              instead of inheriting the document's LTR base direction, which misplaces
              neutral characters like quotes and digits (gumroad-private#1259; same
              rationale as the description fix in #6138).
              wrap-break-word overrides the inherited global overflow-wrap: anywhere, which
              splits titles mid-word in narrow in-app browsers. */}
          <h1 itemProp="name" dir="auto" className="wrap-break-word">
            {product.name}
          </h1>
        </header>
        {/* Stack on mobile: an inflated price in an auto track leaves the name ~1ch
            wide, and overflow-wrap:anywhere then stacks it one character at a time. */}
        <section className="grid grid-cols-1 gap-[1px] border-t border-border p-0 sm:grid-cols-[auto_auto_minmax(max-content,1fr)]">
          <ProductPrice product={product} selection={selection} discountCode={discountCode} />
          {sellerByline ? (
            <div
              className={classNames(
                "flex min-w-0 flex-wrap items-center gap-2 px-6 py-4 outline outline-offset-0 outline-border",
                !showPrice && "col-span-full sm:col-auto",
                showPrice && !(product.ratings != null && product.ratings.count > 0) && "sm:col-[2/-1]",
              )}
            >
              {product.collaborating_user ? (
                <>
                  {sellerByline} with{" "}
                  <AuthorByline
                    name={product.collaborating_user.name}
                    profileUrl={product.collaborating_user.profile_url}
                    avatarUrl={product.collaborating_user.avatar_url}
                  />
                </>
              ) : (
                sellerByline
              )}
            </div>
          ) : null}
          {product.ratings != null && product.ratings.count > 0 ? (
            <div className="flex items-center px-6 py-4 outline outline-offset-0 outline-border max-sm:col-span-full">
              <RatingsSummary ratings={product.ratings} />
            </div>
          ) : null}
        </section>
        {purchase !== null ? (
          <ExistingPurchaseCard
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
              <>
                <CartItemTitle asChild>
                  <a href={bundleProduct.url}>
                    <h4 className="font-bold wrap-break-word">{bundleProduct.name}</h4>
                  </a>
                </CartItemTitle>
                {bundleProduct.ratings ? (
                  <div className="line-clamp-1 flex shrink-0 items-center gap-1" aria-label="Rating">
                    <Star pack="filled" className="size-5" />
                    {`${bundleProduct.ratings.average.toFixed(1)} (${bundleProduct.ratings.count})`}
                  </div>
                ) : null}
                <span className="sr-only">Qty: {bundleProduct.quantity}</span>
                {bundleProduct.variant ? (
                  <CartItemFooter>
                    <span className="line-clamp-1">
                      <strong>{variantLabel(bundleProduct.native_type)}:</strong> {bundleProduct.variant}
                    </span>
                  </CartItemFooter>
                ) : null}
              </>,
            ]),
          )}
        />
        <section className="border-t border-border p-6">
          <ProductDescription
            descriptionHtml={product.description_html}
            initialContent={
              <div
                className="rich-text"
                dir="auto"
                dangerouslySetInnerHTML={{ __html: product.description_html ?? "" }}
              />
            }
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
            availabilityNotice={
              notForSaleMessage ? (
                <Alert role="status" variant="warning">
                  {notForSaleMessage}
                </Alert>
              ) : product.native_type === "commission" ? (
                <Alert role="status" variant="info">
                  Secure your order with a {`${COMMISSION_DEPOSIT_PROPORTION * 100}%`} deposit today; the remaining
                  balance will be charged upon completion.
                </Alert>
              ) : null
            }
            membershipNotices={
              <>
                {product.free_trial ? (
                  <Alert role="status" variant="info">
                    All memberships include a {product.free_trial.duration.amount} {product.free_trial.duration.unit}{" "}
                    free trial
                  </Alert>
                ) : null}
                {product.duration_in_months ? (
                  <Alert role="status" variant="info">
                    This membership will automatically end after{" "}
                    {product.duration_in_months === 1 ? "one month" : `${product.duration_in_months} months`}
                  </Alert>
                ) : null}
              </>
            }
            onDiscountExpiration={() => setDiscountCode({ valid: false, error_code: "inactive" })}
          />
          {product.sales_count !== null ? (
            <Alert role="status" variant="info">
              <strong>{product.sales_count.toLocaleString()}</strong>{" "}
              {product.recurrences
                ? "member"
                : product.preorder
                  ? "pre-order"
                  : product.price_cents > 0 || product.options.some((option) => option.price_difference_cents)
                    ? "sale"
                    : "download"}
              {product.sales_count === 1 ? "" : "s"}
            </Alert>
          ) : null}
          {product.preorder ? (
            <Alert role="status" variant="info">
              Available on {formatDate(parseISO(product.preorder.release_date))}
            </Alert>
          ) : null}
          {product.streamable ? (
            <Alert role="status" variant="info">
              Watch link provided after purchase
            </Alert>
          ) : null}
          {product.summary || product.attributes.length > 0 ? (
            <Card>
              {product.summary ? (
                <CardContent asChild>
                  <p>{product.summary}</p>
                </CardContent>
              ) : null}
              {product.attributes.map(({ name, value }, idx) => (
                <CardContent key={idx}>
                  <h5 className="grow font-bold">{name}</h5>
                  <div>{value}</div>
                </CardContent>
              ))}
            </Card>
          ) : null}
          <ProductSecondaryActions product={product} selection={selection} wishlists={wishlists} />
          {product.refund_policy ? (
            <RefundPolicyInfo refundPolicy={product.refund_policy} permalink={product.permalink} />
          ) : null}
        </section>
        {product.ratings ? <Reviews ratings={product.ratings} productId={product.id} seller={product.seller} /> : null}
        {product.seller_reputation ? (
          <SellerReputationSection
            reputation={product.seller_reputation}
            hasOwnReviews={product.ratings != null && product.ratings.count > 0}
            seller={product.seller}
          />
        ) : null}
      </section>
    </article>
  );
};

const Covers = ({
  covers,
  mainCoverId,
  productName,
}: {
  covers: AssetPreview[];
  mainCoverId: string | null;
  productName: string;
}) => {
  const [activeCoverId, setActiveCoverId] = React.useState(mainCoverId);
  useOnChange(() => setActiveCoverId(mainCoverId), [mainCoverId]);

  if (covers.length === 0) return null;

  return (
    <CoversComponent
      covers={covers}
      activeCoverId={activeCoverId}
      setActiveCoverId={setActiveCoverId}
      productName={productName}
      className={activeCoverId ? "" : "pb-[25%]"}
    />
  );
};

const ExistingPurchaseCard = ({
  permalink,
  isPreorder,
  isBundle,
  customViewContentButtonText,
  purchase,
}: {
  permalink: string;
  isPreorder: boolean;
  isBundle: boolean;
  customViewContentButtonText: string | null;
  purchase: Purchase;
}) => {
  const viewContentButton = purchase.show_view_content_button_on_product_page ? (
    <ProductReceiptViewContentAction href={purchase.content_url ?? ""} permalink={permalink}>
      {customViewContentButtonText ?? "View content"}
    </ProductReceiptViewContentAction>
  ) : null;

  const allowRating = differenceInYears(new Date(), parseISO(purchase.created_at)) < 1;

  if (!purchase.should_show_receipt) return null;

  return (
    <section className="border-t border-border p-6">
      <Card>
        {purchase.membership ? (
          <>
            <CardContent>
              <h5 className="grow font-bold">{purchase.membership.tier_name}</h5>
              {purchase.total_price_including_tax_and_shipping}
            </CardContent>
            <CardContent>
              <ProductReceiptMembershipAction
                href={purchase.membership.manage_url}
                permalink={permalink}
                subscriptionHasLapsed={purchase.subscription_has_lapsed}
              />
              {viewContentButton}
            </CardContent>
          </>
        ) : (
          <CardContent asChild>
            <li>
              <h3 className="grow">
                {isBundle
                  ? purchase.is_gift_receiver_purchase
                    ? "You've received this bundle as a gift"
                    : purchase.was_paid
                      ? "You've purchased this bundle"
                      : "You already own this bundle"
                  : purchase.is_gift_receiver_purchase
                    ? "You've received this product as a gift"
                    : purchase.was_paid
                      ? "You've purchased this product"
                      : "You already own this product"}
              </h3>
              {viewContentButton}
            </li>
          </CardContent>
        )}
        {purchase.license_key ? <LicenseKeyRow licenseKey={purchase.license_key} /> : null}
        {!isPreorder && allowRating ? (
          <ProductReceiptReviewAction
            permalink={permalink}
            purchaseId={purchase.id}
            review={purchase.review}
            purchaseEmailDigest={purchase.email_digest}
            className="flex flex-wrap items-center justify-between gap-4 p-4"
          />
        ) : null}
      </Card>
    </section>
  );
};

// Shows the buyer's license key inline in the "you already own this" card so a returning
// buyer does not have to open the content page (or email the seller) to find it. Only
// rendered when the backend included the key, which it does only for identified visitors.
const LicenseKeyRow = ({ licenseKey }: { licenseKey: string }) => (
  <CardContent>
    <div className="grid grow gap-1">
      <h5 className="font-bold">License key</h5>
      <div className="break-all">{licenseKey}</div>
    </div>
    <ProductReceiptCopyLicenseKeyAction licenseKey={licenseKey} />
  </CardContent>
);

export const RatingsHistogramRow = ({ rating, percentage }: { rating: number; percentage: number }) => {
  const formattedPercentage = `${percentage}%`;
  const label = `${rating} ${rating === 1 ? "star" : "stars"}`;
  return (
    <>
      <div>{label}</div>
      <meter
        aria-label={label}
        value={percentage / 100}
        className="h-[1lh] w-full appearance-none rounded border border-border bg-none [&::-moz-meter-bar]:rounded [&::-moz-meter-bar]:[background:var(--color-accent)] [&::-webkit-meter-bar]:contents [&::-webkit-meter-inner-element]:contents [&::-webkit-meter-optimum-value]:rounded [&::-webkit-meter-optimum-value]:[background:var(--color-accent)]"
      />
      <div>{formattedPercentage}</div>
    </>
  );
};

const Reviews = ({
  productId,
  ratings,
  seller,
}: {
  productId: string;
  ratings: RatingsWithPercentages;
  seller: Seller | null;
}) => {
  if (ratings.count === 0) return null;

  return (
    <ProductReviews
      productId={productId}
      seller={seller}
      initialContent={
        <>
          <header className="flex items-center justify-between">
            <h3>Ratings</h3>
            <div className="flex shrink-0 items-center gap-1">
              <Star pack="filled" className="size-5" />
              <div className="rating-average">{ratings.average}</div>(
              {`${formatOrderOfMagnitude(ratings.count, 1)} ${ratings.count === 1 ? "rating" : "ratings"}`})
            </div>
          </header>
          {/* Rating markup lives in the page's JSON-LD (Product::StructuredData), where the
          AggregateRating nests under the Product. Do not re-add microdata here: this section
          has no itemscope Product ancestor, so an itemscope block becomes a standalone
          top-level AggregateRating that Google's Rich Results Test flags as
          "Missing field itemReviewed" (gumroad-private#1875). */}
          <section className="grid grid-cols-[auto_1fr_auto] gap-3" aria-label="Ratings histogram">
            {([4, 3, 2, 1, 0] as const).map((rating) => (
              <RatingsHistogramRow rating={rating + 1} percentage={ratings.percentages[rating]} key={rating} />
            ))}
          </section>
        </>
      }
    />
  );
};

// Labelled creator context, never the product's own rating: the two copy
// states keep an unreviewed product visibly unreviewed, and the count links
// through to the seller's profile so the aggregate's composition is inspectable.
const SellerReputationSection = ({
  reputation,
  hasOwnReviews,
  seller,
}: {
  reputation: SellerReputation;
  hasOwnReviews: boolean;
  seller: Seller | null;
}) => (
  <section className="grid gap-2 p-6 not-first:border-t" aria-label="Creator rating">
    {!hasOwnReviews ? <div>This product has no reviews yet.</div> : null}
    <div className="flex flex-wrap items-center gap-1">
      <RatingStars rating={reputation.average} />
      <span>
        Creator rating: {reputation.average} from{" "}
        {seller ? (
          <a href={seller.profile_url}>
            {reputation.count} verified {reputation.count === 1 ? "review" : "reviews"}
          </a>
        ) : (
          `${reputation.count} verified ${reputation.count === 1 ? "review" : "reviews"}`
        )}{" "}
        across {reputation.products_count} other products.
      </span>
    </div>
  </section>
);

export { RatingsSummary };

const RefundPolicyInfo = ({ refundPolicy, permalink }: { refundPolicy: RefundPolicy; permalink: string }) => {
  const HASH = "#refund-policy";
  const [viewingRefundPolicy, setViewingRefundPolicy] = React.useState(false);
  const userAgentInfo = useUserAgentInfo();

  useRunOnce(() => {
    setViewingRefundPolicy(window.location.hash === HASH);
  });

  React.useEffect(() => {
    if (viewingRefundPolicy) {
      void trackUserProductAction({
        name: "product_refund_policy_fine_print_view",
        permalink,
        isModal: true,
      });
    }
  }, [viewingRefundPolicy]);

  const formattedDate = parseISO(refundPolicy.updated_at).toLocaleString(userAgentInfo.locale, { dateStyle: "medium" });
  const lastUpdated = `Last updated ${formattedDate}`;

  const handleCloseModal = () => {
    setViewingRefundPolicy(false);
    window.history.replaceState(window.history.state, "", window.location.href.split("#")[0]);
  };
  return (
    <>
      <div className="text-center">
        {refundPolicy.fine_print ? (
          <a href={HASH} onClick={() => setViewingRefundPolicy(true)}>
            {refundPolicy.title}
          </a>
        ) : (
          refundPolicy.title
        )}
      </div>
      {refundPolicy.fine_print ? (
        <Modal
          open={viewingRefundPolicy}
          onClose={handleCloseModal}
          title={refundPolicy.title}
          footer={<p>{lastUpdated}</p>}
        >
          <div className="flex flex-col gap-4">
            <div
              dangerouslySetInnerHTML={{
                __html: refundPolicy.fine_print,
              }}
              style={{ display: "contents" }}
            ></div>
          </div>
        </Modal>
      ) : null}
    </>
  );
};
