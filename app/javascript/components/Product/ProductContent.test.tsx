// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  ProductAvailabilityNotice,
  ProductMembershipNotices,
  ProductSellerReputation,
  ProductStreamingNotice,
  type ProductContentProps,
} from "$app/components/Product/ProductContent";

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
  duration_in_months: null,
  free_trial: null,
  is_compliance_blocked: false,
  is_published: true,
  native_type: "digital",
  quantity_remaining: null,
  show_price: true,
  seller_reputation: { average: 4.8, count: 24, products_count: 3 },
  streamable: false,
} satisfies ProductContentProps;

afterEach(cleanup);

describe("ProductAvailabilityNotice", () => {
  it("renders an unavailable product warning as server content", () => {
    render(
      <ProductAvailabilityNotice
        content={{
          ...content,
          is_compliance_blocked: true,
        }}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("Sorry, this item is not available in your location.");
  });

  it("renders the commission deposit notice as server content", () => {
    render(<ProductAvailabilityNotice content={{ ...content, native_type: "commission" }} />);

    expect(screen.getByRole("status").textContent).toBe(
      "Secure your order with a 50% deposit today; the remaining balance will be charged upon completion.",
    );
  });
});

describe("ProductMembershipNotices", () => {
  it("renders fixed free-trial terms as server content", () => {
    render(
      <ProductMembershipNotices
        content={{
          ...content,
          free_trial: { duration: { amount: 1, unit: "week" } },
          duration_in_months: null,
        }}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("All memberships include a 1 week free trial");
  });

  it("renders a fixed membership duration as server content", () => {
    render(
      <ProductMembershipNotices
        content={{
          ...content,
          duration_in_months: 6,
          free_trial: null,
        }}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("This membership will automatically end after 6 months");
  });
});

describe("ProductStreamingNotice", () => {
  it("renders post-purchase streaming availability as server content", () => {
    render(
      <ProductStreamingNotice
        content={{
          ...content,
          streamable: true,
        }}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("Watch link provided after purchase");
  });
});

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
