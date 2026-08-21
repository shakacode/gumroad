// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  ProductAvailabilityNotice,
  ProductBundleItemContent,
  ProductCoverImage,
  ProductDescriptionContent,
  ProductMembershipNotices,
  ProductReceiptContent,
  ProductReviewsContent,
  ProductSellerReputation,
  ProductStreamingNotice,
  type ProductContentProps,
  productDescriptionNeedsClientEnhancement,
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

describe("ProductCoverImage", () => {
  it("renders the initial image cover as server content", () => {
    const { container } = render(
      <ProductCoverImage
        cover={{
          type: "image",
          filetype: "png",
          id: "cover-1",
          url: "https://example.com/cover.png",
          original_url: "https://example.com/cover-original.png",
          thumbnail: null,
          width: 1005,
          height: 565,
          native_width: 1920,
          native_height: 1080,
        }}
        productName="A guide"
      />,
    );

    const image = container.querySelector("img");
    expect(image?.getAttribute("src")).toBe("https://example.com/cover.png");
    expect(image?.getAttribute("alt")).toBe("A guide");
  });

  it("leaves video covers to the client player", () => {
    const { container } = render(
      <ProductCoverImage
        cover={{
          type: "video",
          filetype: "mp4",
          id: "cover-1",
          url: "https://example.com/cover.mp4",
          original_url: "https://example.com/cover-original.mp4",
          thumbnail: null,
          width: 1005,
          height: 565,
          native_width: 1920,
          native_height: 1080,
        }}
        productName="A guide"
      />,
    );

    expect(container.innerHTML).toBe("");
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
  it("keeps static HTML entirely on the server", () => {
    expect(
      productDescriptionNeedsClientEnhancement(
        '<h2>Guide</h2><p><a href="/more" target="_blank" rel="noopener noreferrer nofollow">Read more</a></p>',
      ),
    ).toBe(false);
  });

  it.each([
    '<a href="/more">Read more</a>',
    '<a href="/more" target="_blank">Read more</a>',
    '<a href="/more" target="_blank" rel="noopener noreferrer">Read more</a>',
  ])("enhances descriptions containing an unnormalized link: %s", (descriptionHtml) => {
    expect(productDescriptionNeedsClientEnhancement(descriptionHtml)).toBe(true);
  });

  it.each(["public-file-embed", "review-card", "upsell-card"])(
    "enhances descriptions containing <%s> nodes on the client",
    (tag) => {
      expect(productDescriptionNeedsClientEnhancement(`<p>Before</p><${tag} id="item-1"></${tag}>`)).toBe(true);
    },
  );

  it("recognizes mixed-case and self-closing enhancement nodes", () => {
    expect(productDescriptionNeedsClientEnhancement("<Review-Card />")).toBe(true);
  });

  it("enhances code blocks to preserve their copy action", () => {
    expect(productDescriptionNeedsClientEnhancement('<pre><code class="language-ruby">puts :hello</code></pre>')).toBe(
      true,
    );
  });

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

describe("ProductReviewsContent", () => {
  it("renders the ratings summary and histogram as server content", () => {
    render(<ProductReviewsContent ratings={{ average: 4.8, count: 238, percentages: [0, 1, 3, 11, 85] }} />);

    expect(screen.getByRole("heading", { name: "Ratings" })).toBeTruthy();
    expect(screen.getByText("4.8").parentElement?.textContent).toContain("238 ratings");
    expect(screen.getByRole("meter", { name: "5 stars" }).getAttribute("value")).toBe("0.85");
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
