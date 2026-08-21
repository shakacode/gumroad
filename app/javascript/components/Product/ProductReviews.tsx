import * as React from "react";

import { fetchWithOneRetry } from "$app/utils/lazy_chunk";

import type { Seller } from "$app/components/Product/Interactive";
import { scheduleProductReviewsLoad } from "$app/components/Product/scheduleProductReviewsLoad";

const importProductReviewsEnhancement = () => import("$app/components/Product/ProductReviewsEnhancement");
const ProductReviewsEnhancement = React.lazy(() => fetchWithOneRetry(importProductReviewsEnhancement));

class ProductReviewsEnhancementBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export const ProductReviews = ({
  initialContent,
  productId,
  seller,
}: {
  initialContent: React.ReactNode;
  productId: string;
  seller: Seller | null;
}) => {
  const [shouldLoadWrittenReviews, setShouldLoadWrittenReviews] = React.useState(false);

  React.useEffect(() => scheduleProductReviewsLoad(() => setShouldLoadWrittenReviews(true)), []);

  return (
    <section className="grid gap-4 p-6 not-first:border-t">
      {initialContent}
      {shouldLoadWrittenReviews ? (
        <ProductReviewsEnhancementBoundary>
          <React.Suspense fallback={null}>
            <ProductReviewsEnhancement productId={productId} seller={seller} />
          </React.Suspense>
        </ProductReviewsEnhancementBoundary>
      ) : null}
    </section>
  );
};
