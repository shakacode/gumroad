// @vitest-environment happy-dom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductReviews } from "$app/components/Product/ProductReviews.client";

const scheduler = vi.hoisted<{ load: (() => void) | null }>(() => ({ load: null }));

vi.mock("$app/components/Product/scheduleProductReviewsLoad", () => ({
  scheduleProductReviewsLoad: (load: () => void) => {
    scheduler.load = load;
    return () => undefined;
  },
}));

vi.mock("$app/components/Product/ProductReviewsEnhancement", () => ({
  default: () => <div>Written reviews</div>,
}));

afterEach(() => {
  cleanup();
  scheduler.load = null;
});

describe("ProductReviews", () => {
  it("keeps server content visible while deferring the written-review enhancement", async () => {
    render(<ProductReviews initialContent={<h3>Ratings</h3>} productId="product-id" seller={null} />);

    expect(screen.getByRole("heading", { name: "Ratings" })).toBeTruthy();
    expect(screen.queryByText("Written reviews")).toBeNull();

    act(() => scheduler.load?.());

    await waitFor(() => expect(screen.getByText("Written reviews")).toBeTruthy());
    expect(screen.getByRole("heading", { name: "Ratings" })).toBeTruthy();
  });
});
