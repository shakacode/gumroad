// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BuyerCurrencyDisplay } from "$app/parsers/product";

import { ProductCardAnalytics } from "$app/components/Product/ProductCardAnalytics.client";

const analyticsMocks = vi.hoisted(() => ({ trackBuyerCurrencyDisplayView: vi.fn() }));

vi.mock("$app/utils/user_analytics", () => ({
  trackBuyerCurrencyDisplayView: analyticsMocks.trackBuyerCurrencyDisplayView,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProductCardAnalytics", () => {
  it("records the initial currency display without rendering content", () => {
    const buyerCurrencyDisplay: BuyerCurrencyDisplay = {
      product_id: "product-id",
      buyer_currency_shown: "eur",
      product_currency: "usd",
      buyer_local_price_cents: 1200,
      rate: 0.92,
      display_mode: "buyer_local",
    };
    const { container, rerender } = render(
      <ProductCardAnalytics sellerId="seller-id" buyerCurrencyDisplay={buyerCurrencyDisplay} />,
    );

    rerender(<ProductCardAnalytics sellerId="other-seller" buyerCurrencyDisplay={undefined} />);

    expect(container.innerHTML).toBe("");
    expect(analyticsMocks.trackBuyerCurrencyDisplayView).toHaveBeenCalledOnce();
    expect(analyticsMocks.trackBuyerCurrencyDisplayView).toHaveBeenCalledWith("seller-id", buyerCurrencyDisplay);
  });
});
