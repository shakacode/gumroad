// @vitest-environment happy-dom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductReviews } from "$app/components/Product/ProductReviews.client";

const mocks = vi.hoisted<{
  getReviews: ReturnType<typeof vi.fn>;
  load: (() => void) | null;
  loggedInUser: { id: string } | null;
  reviewThrows: boolean;
  showAlert: ReturnType<typeof vi.fn>;
}>(() => ({
  getReviews: vi.fn(),
  load: null,
  loggedInUser: { id: "seller-id" },
  reviewThrows: false,
  showAlert: vi.fn(),
}));

vi.mock("$app/components/Product/scheduleProductReviewsLoad", () => ({
  scheduleProductReviewsLoad: (load: () => void) => {
    mocks.load = load;
    return () => undefined;
  },
}));

vi.mock("$app/data/product_reviews", () => ({
  getReviews: mocks.getReviews,
}));

vi.mock("$app/components/LoggedInUser", () => ({
  useLoggedInUser: () => mocks.loggedInUser,
}));

vi.mock("$app/components/Review", () => ({
  Review: ({ review, canRespond }: { review: { message: string }; canRespond: boolean }) => {
    if (mocks.reviewThrows) throw new Error("Review rendering failed");
    return <div>{`${review.message} — ${canRespond ? "can respond" : "cannot respond"}`}</div>;
  },
}));

vi.mock("$app/components/server-components/Alert", () => ({
  showAlert: mocks.showAlert,
}));

vi.mock("$app/utils/request", () => ({
  assertResponseError: (error: unknown) => {
    if (!(error instanceof Error)) throw error;
  },
}));

afterEach(() => {
  cleanup();
  mocks.getReviews.mockReset();
  mocks.load = null;
  mocks.loggedInUser = { id: "seller-id" };
  mocks.reviewThrows = false;
  mocks.showAlert.mockReset();
  vi.restoreAllMocks();
});

describe("ProductReviews", () => {
  it("keeps server content visible while deferring the written-review enhancement", async () => {
    mocks.getReviews.mockResolvedValue({ reviews: [review()], pagination: { page: 1, pages: 1 } });
    render(
      <ProductReviews
        initialContent={<h3>Ratings</h3>}
        productId="product-id"
        seller={{ id: "seller-id", name: "Seller", avatar_url: "", profile_url: "", is_verified: false }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Ratings" })).toBeTruthy();
    expect(screen.queryByText(/Written review/u)).toBeNull();

    act(() => mocks.load?.());

    expect(await screen.findByText("Written review — can respond")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Ratings" })).toBeTruthy();
    expect(mocks.getReviews).toHaveBeenCalledWith("product-id", 1);
  });

  it("only gives response controls to the logged-in seller", async () => {
    mocks.loggedInUser = { id: "different-user" };
    mocks.getReviews.mockResolvedValue({ reviews: [review()], pagination: { page: 1, pages: 1 } });
    render(
      <ProductReviews
        initialContent={<h3>Ratings</h3>}
        productId="product-id"
        seller={{ id: "seller-id", name: "Seller", avatar_url: "", profile_url: "", is_verified: false }}
      />,
    );

    act(() => mocks.load?.());

    expect(await screen.findByText("Written review — cannot respond")).toBeTruthy();
  });

  it("keeps ratings visible when loading written reviews fails", async () => {
    mocks.getReviews.mockRejectedValue(new Error("Review request failed"));
    render(<ProductReviews initialContent={<h3>Ratings</h3>} productId="product-id" seller={null} />);

    act(() => mocks.load?.());

    await waitFor(() => expect(mocks.showAlert).toHaveBeenCalledWith("Review request failed", "error"));
    expect(screen.getByRole("heading", { name: "Ratings" })).toBeTruthy();
  });

  it("keeps ratings visible when the written-review enhancement fails", async () => {
    mocks.getReviews.mockResolvedValue({ reviews: [review()], pagination: { page: 1, pages: 1 } });
    mocks.reviewThrows = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<ProductReviews initialContent={<h3>Ratings</h3>} productId="product-id" seller={null} />);

    act(() => mocks.load?.());

    await waitFor(() => expect(mocks.getReviews).toHaveBeenCalledWith("product-id", 1));
    expect(screen.getByRole("heading", { name: "Ratings" })).toBeTruthy();
  });
});

const review = () => ({
  id: "review-id",
  rating: 5,
  message: "Written review",
  rater: { name: "Buyer", avatar_url: "" },
  purchase_id: "purchase-id",
  created_at: "2026-08-24T00:00:00Z",
  is_new: false,
  response: null,
  video: null,
});
