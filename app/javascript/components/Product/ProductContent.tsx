import * as React from "react";

import { COMMISSION_DEPOSIT_PROPORTION, type FreeTrial, type ProductNativeType } from "$app/parsers/product";
import type { SellerReputation } from "$app/parsers/profile";
import { classNames } from "$app/utils/classNames";

import { AuthorByline } from "$app/components/Product/AuthorByline";
import { getNotForSaleMessage } from "$app/components/Product/productAvailability";
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
  duration_in_months: number | null;
  free_trial: FreeTrial | null;
  is_compliance_blocked: boolean;
  is_published: boolean;
  native_type: ProductNativeType;
  quantity_remaining: number | null;
  seller_reputation?: SellerReputation | null;
  show_price: boolean;
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
