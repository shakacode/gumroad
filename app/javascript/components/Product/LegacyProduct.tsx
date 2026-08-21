import * as React from "react";

import { classNames } from "$app/utils/classNames";

import { AuthorByline } from "$app/components/Product/AuthorByline";
import { applySelection } from "$app/components/Product/ConfigurationSelector";
import { InteractiveProduct, RatingsSummary, type ServerContent } from "$app/components/Product/Interactive";
import { getStandalonePrice } from "$app/components/Product/pricing";
import {
  ProductAvailabilityNotice,
  ProductBundleItemContent,
  ProductDescriptionContent,
  ProductMembershipNotices,
  ProductReceiptContent,
  ProductReviewsContent,
  ProductSellerReputation,
  ProductStreamingNotice,
} from "$app/components/Product/ProductContent";
import { Card, CardContent } from "$app/components/ui/Card";

type Props = Omit<React.ComponentProps<typeof InteractiveProduct>, "serverContent">;

export const legacyProductContent = ({
  product,
  purchase,
  discountCode,
  selection,
}: Pick<Props, "product" | "purchase" | "discountCode" | "selection">): ServerContent => {
  let { basePriceCents } = applySelection(product, discountCode?.valid ? discountCode.discount : null, selection);
  if (product.bundle_products.length > 0) basePriceCents = getStandalonePrice(product);
  const showPrice =
    !product.recurrences &&
    product.options.length === 0 &&
    !product.rental?.rent_only &&
    (basePriceCents !== 0 || !!product.pwyw);
  const sellerByline = product.seller ? (
    <AuthorByline
      name={product.seller.name}
      profileUrl={product.seller.profile_url}
      avatarUrl={product.seller.avatar_url}
      isTopCreator={product.seller.is_verified}
    />
  ) : null;

  return {
    availabilityNotice: <ProductAvailabilityNotice content={{ ...product, show_price: showPrice }} />,
    bundleItems: Object.fromEntries(
      product.bundle_products.map((bundleProduct) => [
        bundleProduct.id,
        <ProductBundleItemContent key={bundleProduct.id} product={bundleProduct} />,
      ]),
    ),
    description: <ProductDescriptionContent content={{ ...product, show_price: showPrice }} />,
    descriptionNeedsClientEnhancement: true,
    initialCover: null,
    membershipNotices: <ProductMembershipNotices content={{ ...product, show_price: showPrice }} />,
    receipt: purchase ? (
      <ProductReceiptContent
        customViewContentButtonText={product.custom_view_content_button_text}
        isBundle={product.bundle_products.length > 0}
        isPreorder={product.preorder !== null}
        permalink={product.permalink}
        purchase={purchase}
      />
    ) : null,
    reviews: product.ratings && product.ratings.count > 0 ? <ProductReviewsContent ratings={product.ratings} /> : null,
    title: (
      <h1 itemProp="name" dir="auto">
        {product.name}
      </h1>
    ),
    sellerAndRatings: (
      <>
        {sellerByline ? (
          <div
            className={classNames(
              "flex flex-wrap items-center gap-2 px-6 py-4 outline outline-offset-0 outline-border",
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
      </>
    ),
    details:
      product.summary || product.attributes.length > 0 ? (
        <Card>
          {product.summary ? (
            <CardContent asChild>
              <p>{product.summary}</p>
            </CardContent>
          ) : null}
          {product.attributes.map(({ name, value }, index) => (
            <CardContent key={index}>
              <h5 className="grow font-bold">{name}</h5>
              <div>{value}</div>
            </CardContent>
          ))}
        </Card>
      ) : null,
    sellerReputation: <ProductSellerReputation content={{ ...product, show_price: showPrice }} />,
    streamingNotice: <ProductStreamingNotice content={{ ...product, show_price: showPrice }} />,
  };
};

export const Product = (props: Props) => <InteractiveProduct {...props} serverContent={legacyProductContent(props)} />;
