// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AnalyticsData } from "$app/parsers/product";

import ProductAnalytics from "$app/components/Product/ProductAnalytics.client";

const analyticsMocks = vi.hoisted(() => ({
  addThirdPartyAnalytics: vi.fn(),
  incrementProductViews: vi.fn(),
  startTrackingForSeller: vi.fn(),
  trackBuyerCurrencyDisplayView: vi.fn(),
  trackProductEvent: vi.fn(),
}));
const analytics: AnalyticsData = {
  facebook_pixel_id: null,
  free_sales: false,
  google_analytics_id: null,
  tiktok_pixel_id: null,
};

vi.mock("$app/components/useAddThirdPartyAnalytics", () => ({
  useAddThirdPartyAnalytics: () => analyticsMocks.addThirdPartyAnalytics,
}));
vi.mock("$app/components/useOriginalLocation", () => ({
  useOriginalLocation: () => "https://example.com/l/example?recommended_by=discover",
}));
vi.mock("$app/data/view_event", () => ({ incrementProductViews: analyticsMocks.incrementProductViews }));
vi.mock("$app/utils/user_analytics", () => ({
  startTrackingForSeller: analyticsMocks.startTrackingForSeller,
  trackBuyerCurrencyDisplayView: analyticsMocks.trackBuyerCurrencyDisplayView,
  trackProductEvent: analyticsMocks.trackProductEvent,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProductAnalytics", () => {
  it("records the product view without rendering content", () => {
    const { container } = render(
      <ProductAnalytics
        analytics={analytics}
        hasThirdPartyAnalytics
        permalink="example"
        productName="Example product"
        sellerId="seller-id"
      />,
    );

    expect(container.innerHTML).toBe("");
    expect(analyticsMocks.startTrackingForSeller).toHaveBeenCalledWith("seller-id", analytics);
    expect(analyticsMocks.trackBuyerCurrencyDisplayView).toHaveBeenCalledWith("seller-id", undefined);
    expect(analyticsMocks.trackProductEvent).toHaveBeenCalledWith("seller-id", {
      permalink: "example",
      action: "viewed",
      product_name: "Example product",
    });
    expect(analyticsMocks.incrementProductViews).toHaveBeenCalledWith({
      permalink: "example",
      recommendedBy: "discover",
    });
    expect(analyticsMocks.addThirdPartyAnalytics).toHaveBeenCalledWith({ permalink: "example", location: "product" });
  });

  it("does not record preview views", () => {
    render(
      <ProductAnalytics
        analytics={analytics}
        disabled
        hasThirdPartyAnalytics
        permalink="example"
        productName="Example product"
        sellerId="seller-id"
      />,
    );

    expect(analyticsMocks.startTrackingForSeller).not.toHaveBeenCalled();
    expect(analyticsMocks.incrementProductViews).not.toHaveBeenCalled();
    expect(analyticsMocks.addThirdPartyAnalytics).not.toHaveBeenCalled();
  });
});
