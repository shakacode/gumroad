// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ProductCoverImage,
  ProductReceiptContent,
  productDescriptionNeedsClientEnhancement,
} from "$app/components/Product/ProductContent";
import { ProductFooter } from "$app/components/Product/ProductFooter";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.cookie = "gumroad_buyer_currency=; path=/; max-age=0";
});

describe("ProductCoverImage", () => {
  it("renders a hydration-stable initial image for the multi-cover carousel", () => {
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
    expect(image?.getAttribute("srcset")).toBe(
      "https://example.com/cover.png 1005w, https://example.com/cover-original.png 1920w",
    );
    expect(image?.getAttribute("sizes")).toBe("(min-width: 75.25rem) 73.25rem, calc(100vw - 2rem)");
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
});

describe("ProductFooter", () => {
  it("uses the server-detected currency when no buyer cookie exists", () => {
    vi.stubGlobal("Routes", { root_url: () => "https://gumroad.test/" });

    render(<ProductFooter rootDomain="gumroad.test" detectedCurrency="cad" shownCurrency="cad" />);

    expect(screen.getByRole<HTMLSelectElement>("combobox").value).toBe("cad");
    expect(screen.getByRole("option", { name: "CAD$ (Canadian Dollars) — detected" })).toBeTruthy();
  });
});
