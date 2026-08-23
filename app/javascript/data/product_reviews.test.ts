import { expect, it, vi } from "vitest";

vi.mock("$app/utils/request", () => ({
  ResponseError: class ResponseError extends Error {},
  request: vi.fn(),
}));

const productReviewsPath = vi.fn(() => "/product_reviews.json");
vi.stubGlobal("Routes", { product_reviews_path: productReviewsPath });

const { request } = vi.mocked(await import("$app/utils/request"));
const { getReviews } = await import("$app/data/product_reviews");

it("requests written reviews with an explicit JSON format", async () => {
  request.mockResolvedValue(
    new Response(JSON.stringify({ reviews: [], pagination: { page: 1, pages: 1 } }), {
      headers: { "content-type": "application/json" },
    }),
  );

  await getReviews("product-id", 1);

  expect(productReviewsPath).toHaveBeenCalledWith({ product_id: "product-id", page: 1, format: "json" });
  expect(request).toHaveBeenCalledWith({ method: "GET", url: "/product_reviews.json", accept: "json" });
});
