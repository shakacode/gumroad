import * as React from "react";

import type { ProductDiscount, ServerContent } from "$app/components/Product/Interactive";
import ProductArticle from "$app/components/Product/ProductArticle";
import {
  type ProductContentProps,
  ProductAvailabilityNotice,
  ProductBundleItemContent,
  ProductCoverImage,
  ProductDescriptionContent,
  ProductDetails,
  ProductMembershipNotices,
  ProductQuantityRemaining,
  ProductReceiptContent,
  ProductReviewsContent,
  ProductSellerAndRatings,
  ProductSellerReputation,
  ProductSalesNotice,
  ProductStreamingNotice,
  ProductTitle,
  productDescriptionNeedsClientEnhancement,
} from "$app/components/Product/ProductContent";
import { ProductFooter } from "$app/components/Product/ProductFooter";
import type { ProductInteractionPageProps } from "$app/components/Product/ProductPage.types";
import { ProductStateProvider } from "$app/components/Product/ProductStateProvider.client";
import ProductStickyCta from "$app/components/Product/ProductStickyCta.client";
import ProductPageShell, { type ProductGlobalProps } from "$app/components/PublicPages/ProductPageShell.client";

export type ProductPageProps = ProductInteractionPageProps & {
  discount_code: ProductDiscount;
  global: ProductGlobalProps;
  rsc_product_content: ProductContentProps;
};

export default function ProductPage({
  global,
  rsc_product_content: rscProductContent,
  ...productProps
}: ProductPageProps) {
  const { product, purchase } = productProps;
  const initialCover = product.covers.find(({ id }) => id === product.main_cover_id) ?? product.covers[0];
  const serverContent: ServerContent = {
    availabilityNotice: <ProductAvailabilityNotice content={rscProductContent} />,
    bundleItems: Object.fromEntries(
      product.bundle_products.map((bundleProduct) => [
        bundleProduct.id,
        <ProductBundleItemContent key={bundleProduct.id} product={bundleProduct} />,
      ]),
    ),
    description: <ProductDescriptionContent content={rscProductContent} />,
    descriptionNeedsClientEnhancement: productDescriptionNeedsClientEnhancement(rscProductContent.description_html),
    initialCover: initialCover
      ? {
          id: initialCover.id,
          content: <ProductCoverImage cover={initialCover} productName={product.name} />,
        }
      : null,
    membershipNotices: <ProductMembershipNotices content={rscProductContent} />,
    quantityRemaining: <ProductQuantityRemaining quantityRemaining={product.quantity_remaining} />,
    receipt: purchase ? (
      <ProductReceiptContent
        customViewContentButtonText={product.custom_view_content_button_text}
        isBundle={product.bundle_products.length > 0}
        isPreorder={product.preorder !== null}
        permalink={product.permalink}
        purchase={purchase}
      />
    ) : null,
    reviews: product.ratings?.count ? <ProductReviewsContent ratings={product.ratings} /> : null,
    salesNotice: (
      <ProductSalesNotice
        salesCount={product.sales_count}
        isMembership={product.recurrences !== null}
        isPreorder={product.preorder !== null}
        hasPaidPrice={product.price_cents > 0 || product.options.some((option) => option.price_difference_cents)}
        locale={global.locale}
      />
    ),
    title: <ProductTitle content={rscProductContent} />,
    sellerAndRatings: (
      <ProductSellerAndRatings content={rscProductContent} hideSellerByline={productProps.page_layout === "profile"} />
    ),
    details: <ProductDetails content={rscProductContent} />,
    sellerReputation: <ProductSellerReputation content={rscProductContent} />,
    streamingNotice: <ProductStreamingNotice content={rscProductContent} />,
  };

  return (
    <ProductPageShell global={global}>
      <ProductStateProvider product={product} initialDiscountCode={productProps.discount_code}>
        <ProductStickyCta product={product} purchase={purchase} cart={false} hasHero={false} />
        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-product-page p-4 lg:px-8 lg:py-16">
            <ProductArticle
              product={product}
              purchase={purchase}
              wishlists={productProps.wishlists}
              serverContent={serverContent}
            />
          </div>
        </section>
        <ProductFooter
          detectedCurrency={global.detected_buyer_currency}
          rootDomain={global.domain_settings.root_domain}
          shownCurrency={product.buyer_currency_display?.buyer_currency_shown}
        />
      </ProductStateProvider>
    </ProductPageShell>
  );
}
