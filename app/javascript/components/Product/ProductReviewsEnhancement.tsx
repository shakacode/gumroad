import * as React from "react";

import { getReviews, type Review } from "$app/data/product_reviews";
import { assertResponseError } from "$app/utils/request";

import { useLoggedInUser } from "$app/components/LoggedInUser";
import { PaginationProps } from "$app/components/Pagination";
import type { Seller } from "$app/components/Product/Interactive";
import { Review as ReviewComponent } from "$app/components/Review";
import { showAlert } from "$app/components/server-components/Alert";

const ProductReviewsEnhancement = ({ productId, seller }: { productId: string; seller: Seller | null }) => {
  const loggedInUser = useLoggedInUser();
  const [state, setState] = React.useState<{ reviews: Review[]; pagination: PaginationProps }>({
    reviews: [],
    pagination: { page: 0, pages: 1 },
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const loadPage = React.useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const { reviews, pagination } = await getReviews(productId, page);
        setState(({ reviews: previousReviews }) => ({
          pagination,
          reviews: [...previousReviews, ...reviews],
        }));
      } catch (error) {
        assertResponseError(error);
        showAlert(error.message, "error");
      }
      setIsLoading(false);
    },
    [productId],
  );

  React.useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  if (state.reviews.length === 0) return null;

  return (
    <section className="flex flex-col gap-4" style={{ marginTop: "var(--spacer-2)" }}>
      {state.reviews.map((review, index) => (
        <React.Fragment key={review.id}>
          <ReviewComponent review={review} seller={seller} canRespond={seller?.id === loggedInUser?.id} />
          {index === state.reviews.length - 1 ? null : <hr />}
        </React.Fragment>
      ))}
      {state.pagination.page < state.pagination.pages ? (
        <button
          className="cursor-pointer underline all-unset"
          onClick={() => void loadPage(state.pagination.page + 1)}
          disabled={isLoading}
        >
          Load more
        </button>
      ) : null}
    </section>
  );
};

export default ProductReviewsEnhancement;
