// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  ProductAvailabilityNotice,
  ProductBundleItemContent,
  ProductDescriptionContent,
  ProductMembershipNotices,
  ProductReceiptContent,
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
  description_html: null,
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

describe("ProductBundleItemContent", () => {
  it("renders bundle item text as server content", () => {
    render(
      <ProductBundleItemContent
        product={{
          name: "Bundle guide",
          native_type: "digital",
          quantity: 2,
          ratings: { average: 4.75, count: 8 },
          url: "https://example.com/bundle-guide",
          variant: "Extended edition",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "Bundle guide" })).toBeTruthy();
    expect(screen.getByLabelText("Rating").textContent).toContain("4.8 (8)");
    expect(screen.getByText("Qty: 2")).toBeTruthy();
    expect(screen.getByText("Version:").parentElement?.textContent).toBe("Version: Extended edition");
  });
});

describe("ProductReceiptContent", () => {
  it("renders purchased bundle ownership copy as server content", () => {
    render(
      <ProductReceiptContent
        customViewContentButtonText="Read bundle"
        isBundle
        isPreorder={false}
        permalink="bundle"
        purchase={{
          id: "purchase-id",
          email_digest: "digest",
          created_at: "2020-01-01T00:00:00Z",
          review: null,
          should_show_receipt: true,
          was_paid: true,
          is_gift_receiver_purchase: false,
          content_url: "https://example.com/content",
          show_view_content_button_on_product_page: true,
          total_price_including_tax_and_shipping: "$10",
          subscription_has_lapsed: false,
          membership: null,
          license_key: "LICENSE-KEY",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "You've purchased this bundle" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Read bundle" }).getAttribute("href")).toBe("https://example.com/content");
    expect(screen.getByRole("heading", { name: "License key" })).toBeTruthy();
    expect(screen.getByText("LICENSE-KEY")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
  });

  it("renders membership receipt details with its client management action", () => {
    render(
      <ProductReceiptContent
        customViewContentButtonText={null}
        isBundle={false}
        isPreorder={false}
        permalink="membership"
        purchase={{
          id: "purchase-id",
          email_digest: "digest",
          created_at: "2020-01-01T00:00:00Z",
          review: null,
          should_show_receipt: true,
          was_paid: true,
          is_gift_receiver_purchase: false,
          content_url: null,
          show_view_content_button_on_product_page: false,
          total_price_including_tax_and_shipping: "$10",
          subscription_has_lapsed: true,
          membership: {
            tier_name: "Supporter",
            tier_description: null,
            manage_url: "https://example.com/manage",
          },
          license_key: null,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Supporter" })).toBeTruthy();
    expect(screen.getByText("$10")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Restart membership" }).getAttribute("href")).toBe(
      "https://example.com/manage",
    );
  });
});

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

describe("ProductDescriptionContent", () => {
  it("renders the trusted product description as server content", () => {
    render(
      <ProductDescriptionContent
        content={{
          ...content,
          description_html: "<p>Server <strong>description</strong></p>",
        }}
      />,
    );

    expect(screen.getByText("description").tagName).toBe("STRONG");
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
