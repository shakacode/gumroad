import { Star } from "@boxicons/react";
import { differenceInYears, parseISO } from "date-fns";
import * as React from "react";

import {
  type AssetPreview,
  COMMISSION_DEPOSIT_PROPORTION,
  type FreeTrial,
  type ProductNativeType,
  type RatingsWithPercentages,
} from "$app/parsers/product";
import type { SellerReputation } from "$app/parsers/profile";
import { classNames } from "$app/utils/classNames";
import { formatOrderOfMagnitude } from "$app/utils/formatOrderOfMagnitude";
import { variantLabel } from "$app/utils/labels";

import { AuthorByline } from "$app/components/Product/AuthorByline";
import type { Purchase } from "$app/components/Product/Interactive";
import { getNotForSaleMessage } from "$app/components/Product/productAvailability";
import {
  ProductReceiptCopyLicenseKeyAction,
  ProductReceiptMembershipAction,
  ProductReceiptReviewAction,
  ProductReceiptViewContentAction,
} from "$app/components/Product/ProductReceiptActions.client";
import { Ribbon } from "$app/components/Product/Ribbon";
import { RatingStars } from "$app/components/RatingStars";
import { Alert } from "$app/components/ui/Alert";
import { Card, CardContent } from "$app/components/ui/Card";

type Seller = {
  name: string;
  avatar_url: string;
  profile_url: string;
  is_verified: boolean;
};

export type ProductContentProps = {
  name: string;
  seller: Seller | null;
  collaborating_user: Seller | null;
  ratings: { average: number; count: number } | null;
  summary: string | null;
  attributes: { name: string; value: string }[];
  description_html: string | null;
  duration_in_months: number | null;
  free_trial: FreeTrial | null;
  is_compliance_blocked: boolean;
  is_published: boolean;
  native_type: ProductNativeType;
  quantity_remaining: number | null;
  seller_reputation?: SellerReputation | null;
  show_price: boolean;
  streamable: boolean;
};

type BundleProduct = {
  name: string;
  native_type: ProductNativeType;
  quantity: number;
  ratings: { average: number; count: number } | null;
  url: string;
  variant: string | null;
};

export const ProductCoverImage = ({ cover, productName }: { cover: AssetPreview; productName: string }) =>
  cover.type === "image" && cover.native_width && cover.native_height ? (
    <img className="max-h-full w-full object-contain" src={cover.url} alt={productName} itemProp="image" />
  ) : null;

export const ProductQuantityRemaining = ({ quantityRemaining }: { quantityRemaining: number | null }) =>
  quantityRemaining !== null ? <Ribbon>{quantityRemaining} left</Ribbon> : null;

export const ProductSalesNotice = ({
  salesCount,
  isMembership,
  isPreorder,
  hasPaidPrice,
  locale,
}: {
  salesCount: number | null;
  isMembership: boolean;
  isPreorder: boolean;
  hasPaidPrice: boolean;
  locale?: string | undefined;
}) =>
  salesCount !== null ? (
    <Alert role="status" variant="info">
      <strong>{salesCount.toLocaleString(locale)}</strong>{" "}
      {isMembership ? "member" : isPreorder ? "pre-order" : hasPaidPrice ? "sale" : "download"}
      {salesCount === 1 ? "" : "s"}
    </Alert>
  ) : null;

export const ProductBundleItemContent = ({ product }: { product: BundleProduct }) => (
  <>
    <a className="line-clamp-2 text-base font-medium no-underline sm:text-lg" href={product.url}>
      <h4 className="font-bold">{product.name}</h4>
    </a>
    {product.ratings ? (
      <div className="line-clamp-1 flex shrink-0 items-center gap-1" aria-label="Rating">
        <Star pack="filled" className="size-5" />
        {`${product.ratings.average.toFixed(1)} (${product.ratings.count})`}
      </div>
    ) : null}
    <span className="sr-only">Qty: {product.quantity}</span>
    {product.variant ? (
      <footer className="mt-auto flex flex-col gap-x-4 gap-y-1 text-sm sm:flex-wrap">
        <span className="line-clamp-1">
          <strong>{variantLabel(product.native_type)}:</strong> {product.variant}
        </span>
      </footer>
    ) : null}
  </>
);

type ProductReceiptContentProps = {
  customViewContentButtonText: string | null;
  isBundle: boolean;
  isPreorder: boolean;
  permalink: string;
  purchase: Purchase;
};

export const ProductReceiptContent = ({
  customViewContentButtonText,
  isBundle,
  isPreorder,
  permalink,
  purchase,
}: ProductReceiptContentProps) => {
  if (!purchase.should_show_receipt) return null;

  const ownershipCopy = isBundle
    ? purchase.is_gift_receiver_purchase
      ? "You've received this bundle as a gift"
      : purchase.was_paid
        ? "You've purchased this bundle"
        : "You already own this bundle"
    : purchase.is_gift_receiver_purchase
      ? "You've received this product as a gift"
      : purchase.was_paid
        ? "You've purchased this product"
        : "You already own this product";
  const viewContentAction = purchase.show_view_content_button_on_product_page ? (
    <ProductReceiptViewContentAction href={purchase.content_url ?? ""} permalink={permalink}>
      {customViewContentButtonText ?? "View content"}
    </ProductReceiptViewContentAction>
  ) : null;

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
              {viewContentAction}
            </CardContent>
          </>
        ) : (
          <CardContent asChild>
            <li>
              <h3 className="grow">{ownershipCopy}</h3>
              {viewContentAction}
            </li>
          </CardContent>
        )}
        {purchase.license_key ? (
          <CardContent>
            <div className="grid grow gap-1">
              <h5 className="font-bold">License key</h5>
              <div className="break-all">{purchase.license_key}</div>
            </div>
            <ProductReceiptCopyLicenseKeyAction licenseKey={purchase.license_key} />
          </CardContent>
        ) : null}
        {!isPreorder && differenceInYears(new Date(), parseISO(purchase.created_at)) < 1 ? (
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

export const ProductTitle = ({ content }: { content: ProductContentProps }) => (
  <h1 itemProp="name" dir="auto">
    {content.name}
  </h1>
);

export const ProductAvailabilityNotice = ({ content }: { content: ProductContentProps }) => {
  const notForSaleMessage = getNotForSaleMessage(content);

  if (notForSaleMessage)
    return (
      <Alert role="status" variant="warning">
        {notForSaleMessage}
      </Alert>
    );

  if (content.native_type === "commission")
    return (
      <Alert role="status" variant="info">
        Secure your order with a {`${COMMISSION_DEPOSIT_PROPORTION * 100}%`} deposit today; the remaining balance will
        be charged upon completion.
      </Alert>
    );

  return null;
};

export const ProductDescriptionContent = ({ content }: { content: ProductContentProps }) => (
  <div className="rich-text" dir="auto" dangerouslySetInnerHTML={{ __html: content.description_html ?? "" }} />
);

export const ProductReviewsContent = ({ ratings }: { ratings: RatingsWithPercentages }) => (
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
        AggregateRating nests under the Product. This section has no Product itemscope ancestor. */}
    <section className="grid grid-cols-[auto_1fr_auto] gap-3" aria-label="Ratings histogram">
      {([4, 3, 2, 1, 0] as const).map((rating) => {
        const label = `${rating + 1} ${rating === 0 ? "star" : "stars"}`;
        const percentage = ratings.percentages[rating];

        return (
          <React.Fragment key={rating}>
            <div>{label}</div>
            <meter
              aria-label={label}
              value={percentage / 100}
              className="h-[1lh] w-full appearance-none rounded border border-border bg-none [&::-moz-meter-bar]:rounded [&::-moz-meter-bar]:[background:var(--color-accent)] [&::-webkit-meter-bar]:contents [&::-webkit-meter-inner-element]:contents [&::-webkit-meter-optimum-value]:rounded [&::-webkit-meter-optimum-value]:[background:var(--color-accent)]"
            />
            <div>{`${percentage}%`}</div>
          </React.Fragment>
        );
      })}
    </section>
  </>
);

export const productDescriptionNeedsClientEnhancement = (descriptionHtml: string | null) => {
  const html = descriptionHtml ?? "";

  if (/<(?:pre|public-file-embed|review-card|upsell-card)(?=[\s/>])/iu.test(html)) return true;

  return [...html.matchAll(/<a(?=[\s>])(?:(?:"[^"]*"|'[^']*'|[^'">])*)>/giu)].some(([tag]) => {
    if (!/\btarget\s*=\s*(["'])_blank\1/iu.test(tag)) return true;

    const rel = /\brel\s*=\s*(["'])([^"']*)\1/iu.exec(tag)?.[2];
    const relValues = new Set(rel?.toLowerCase().split(/\s+/u));
    return !["noopener", "noreferrer", "nofollow"].every((value) => relValues.has(value));
  });
};

export const ProductMembershipNotices = ({ content }: { content: ProductContentProps }) => (
  <>
    {content.free_trial ? (
      <Alert role="status" variant="info">
        All memberships include a {content.free_trial.duration.amount} {content.free_trial.duration.unit} free trial
      </Alert>
    ) : null}
    {content.duration_in_months ? (
      <Alert role="status" variant="info">
        This membership will automatically end after{" "}
        {content.duration_in_months === 1 ? "one month" : `${content.duration_in_months} months`}
      </Alert>
    ) : null}
  </>
);

export const ProductStreamingNotice = ({ content }: { content: ProductContentProps }) =>
  content.streamable ? (
    <Alert role="status" variant="info">
      Watch link provided after purchase
    </Alert>
  ) : null;

export const ProductSellerAndRatings = ({ content }: { content: ProductContentProps }) => {
  const { seller, collaborating_user: collaboratingUser, ratings, show_price: showPrice } = content;

  return (
    <>
      {seller ? (
        <div
          className={classNames(
            "flex flex-wrap items-center gap-2 px-6 py-4 outline outline-offset-0 outline-border",
            !showPrice && "col-span-full sm:col-auto",
            showPrice && !(ratings != null && ratings.count > 0) && "sm:col-[2/-1]",
          )}
        >
          <AuthorByline
            name={seller.name}
            profileUrl={seller.profile_url}
            avatarUrl={seller.avatar_url}
            isTopCreator={seller.is_verified}
          />
          {collaboratingUser ? (
            <>
              {" "}
              with{" "}
              <AuthorByline
                name={collaboratingUser.name}
                profileUrl={collaboratingUser.profile_url}
                avatarUrl={collaboratingUser.avatar_url}
              />
            </>
          ) : null}
        </div>
      ) : null}
      {ratings != null && ratings.count > 0 ? (
        <div className="flex items-center px-6 py-4 outline outline-offset-0 outline-border max-sm:col-span-full">
          <div className="flex shrink-0 items-center">
            <RatingStars rating={ratings.average} />
            <span className="rating-number ml-1">
              {ratings.count} {ratings.count === 1 ? "rating" : "ratings"}
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
};

export const ProductDetails = ({ content }: { content: ProductContentProps }) => {
  if (!content.summary && content.attributes.length === 0) return null;

  return (
    <Card>
      {content.summary ? (
        <CardContent asChild>
          <p>{content.summary}</p>
        </CardContent>
      ) : null}
      {content.attributes.map(({ name, value }, index) => (
        <CardContent key={index}>
          <h5 className="grow font-bold">{name}</h5>
          <div>{value}</div>
        </CardContent>
      ))}
    </Card>
  );
};

export const ProductSellerReputation = ({ content }: { content: ProductContentProps }) => {
  const { ratings, seller, seller_reputation: reputation } = content;
  if (!reputation) return null;

  return (
    <section className="grid gap-2 p-6 not-first:border-t" aria-label="Creator rating">
      {ratings == null || ratings.count === 0 ? <div>This product has no reviews yet.</div> : null}
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
};
