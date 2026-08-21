import * as React from "react";

import type { Props as ProductProps, ServerContent } from "$app/components/Product/Interactive";
import ProductAnalytics from "$app/components/Product/ProductAnalytics.client";
import { ProductBundleFromState } from "$app/components/Product/ProductBundle.client";
import ProductDescription from "$app/components/Product/ProductDescription.client";
import { ProductEditButton } from "$app/components/Product/ProductEditButton.client";
import { ProductLicenseKeyLookup } from "$app/components/Product/ProductLicenseKeyLookup.client";
import { ProductMedia } from "$app/components/Product/ProductMedia.client";
import { ProductPreorderNotice } from "$app/components/Product/ProductPreorderNotice.client";
import { ProductPriceFromState } from "$app/components/Product/ProductPrice.client";
import { ProductPurchaseControlsFromState } from "$app/components/Product/ProductPurchaseControls.client";
import { ProductReviews } from "$app/components/Product/ProductReviews.client";
import { ProductSecondaryActionsFromState } from "$app/components/Product/ProductSecondaryActions.client";

type ProductArticleProps = Pick<ProductProps, "product" | "purchase" | "wishlists"> & {
  ctaLabel?: string | undefined;
  serverContent: ServerContent;
};

export default function ProductArticle({ product, purchase, wishlists, ctaLabel, serverContent }: ProductArticleProps) {
  return (
    <>
      <ProductEditButton product={product} />
      <article className="relative grid rounded border border-border bg-background lg:grid-cols-[2fr_1fr]">
        <ProductAnalytics
          analytics={product.analytics}
          buyerCurrencyDisplay={product.buyer_currency_display}
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
            <ProductPriceFromState product={product} />
            {serverContent.sellerAndRatings}
          </section>
          {purchase !== null ? (
            serverContent.receipt
          ) : product.is_licensed && !product.can_edit ? (
            <ProductLicenseKeyLookup />
          ) : null}
          <ProductBundleFromState product={product} bundleItems={serverContent.bundleItems} />
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
            <ProductPurchaseControlsFromState
              product={product}
              purchase={purchase}
              ctaLabel={ctaLabel}
              availabilityNotice={serverContent.availabilityNotice}
              membershipNotices={serverContent.membershipNotices}
            />
            {serverContent.salesNotice}
            <ProductPreorderNotice releaseDate={product.preorder?.release_date ?? null} />
            {serverContent.streamingNotice}
            {serverContent.details}
            <ProductSecondaryActionsFromState product={product} wishlists={wishlists} />
          </section>
          {product.ratings && product.ratings.count > 0 ? (
            <ProductReviews initialContent={serverContent.reviews} productId={product.id} seller={product.seller} />
          ) : null}
          {serverContent.sellerReputation}
        </section>
      </article>
    </>
  );
}
