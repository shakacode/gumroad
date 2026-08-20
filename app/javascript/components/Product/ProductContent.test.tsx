// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ProductSellerReputation, type ProductContentProps } from "$app/components/Product/ProductContent";

const content = {
  name: "A guide",
  seller: {
    name: "Seller",
    avatar_url: "https://example.com/avatar.png",
    profile_url: "https://example.com/seller",
    is_verified: false,
  },
  collaborating_user: null,
  ratings: null,
  summary: null,
  attributes: [],
  show_price: true,
  seller_reputation: { average: 4.8, count: 24, products_count: 3 },
} satisfies ProductContentProps;

afterEach(cleanup);

describe("ProductSellerReputation", () => {
  it("renders an unreviewed product's creator rating as server content", () => {
    render(<ProductSellerReputation content={content} />);

    expect(screen.getByText("This product has no reviews yet.")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Creator rating" }).textContent).toContain(
      "Creator rating: 4.8 from 24 verified reviews across 3 other products.",
    );
    expect(screen.getByRole("link", { name: "24 verified reviews" }).getAttribute("href")).toBe(
      "https://example.com/seller",
    );
  });
});
