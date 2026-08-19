// @vitest-environment happy-dom
/* eslint-disable @typescript-eslint/consistent-type-assertions -- Minimal fixtures keep this test focused on the bar's layout behavior. */
import { act, cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Product } from "$app/components/Product";
import type { PriceSelection } from "$app/components/Product/ConfigurationSelector";

import { CtaBar } from "./Layout";

const mocks = vi.hoisted(() => ({ isDesktop: true }));

vi.mock("$app/components/Product", () => ({
  Product: () => null,
  RatingsSummary: () => null,
  useSelectionFromUrl: vi.fn(),
}));
vi.mock("$app/components/Product/ConfigurationSelector", () => ({
  applySelection: () => ({
    priceCents: 1_000,
    discountedPriceCents: 1_000,
    isPWYW: false,
    hasRentOption: false,
    hasMultipleRecurrences: false,
    hasConfigurableQuantity: false,
    selectedOption: null,
  }),
  buyerLocalPriceCentsForSelection: () => null,
}));
vi.mock("$app/components/Product/CtaButton", () => ({ CtaButton: () => <a href="#checkout">Buy</a> }));
vi.mock("$app/components/Product/PriceTag", () => ({ PriceTag: () => null }));
vi.mock("$app/components/Product/pricing", () => ({ getBundleComparisonPriceCents: () => null }));
vi.mock("$app/components/useIsAboveBreakpoint", () => ({
  useIsAboveBreakpoint: () => mocks.isDesktop,
}));

let intersectionCallback: IntersectionObserverCallback;

class FakeIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
  }

  observe() {}
}

const product = {
  buyer_currency: null,
  buyer_local_currency_rate: null,
  buyer_local_currency_subunit_to_unit: null,
  buyer_local_original_price_cents: null,
  currency_code: "usd",
  is_sales_limited: false,
  long_url: "https://example.com/l/guide",
  name: "Guide",
  options: [],
  ratings: null,
  recurrences: null,
  seller: null,
} as unknown as Product;

const selection = { price: { value: null }, quantity: 1 } as PriceSelection;
const ctaButtonRef = { current: document.createElement("a") };
const configurationSelectorRef = { current: null };

const renderCtaBar = () =>
  render(
    <CtaBar
      product={product}
      purchase={null}
      ctaButtonRef={ctaButtonRef}
      configurationSelectorRef={configurationSelectorRef}
      selection={selection}
      hasHero={false}
    />,
  );

describe("CtaBar", () => {
  beforeEach(() => {
    mocks.isDesktop = true;
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(cleanup);

  it("moves the desktop bar without changing its layout dimensions", () => {
    renderCtaBar();
    const bar = screen.getByRole("region", { name: "Product information bar" });

    expect(bar.style.transform).toBe("translateY(-100%)");
    expect(bar.style.height).toBe("");

    act(() =>
      intersectionCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver),
    );

    expect(bar.style.transform).toBe("translateY(0)");
    expect(bar.style.height).toBe("");
  });

  it("hides the mobile bar below the viewport", () => {
    mocks.isDesktop = false;
    renderCtaBar();

    expect(screen.getByRole("region", { name: "Product information bar" }).style.transform).toBe("translateY(100%)");
  });
});
