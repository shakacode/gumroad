// @vitest-environment happy-dom
/* eslint-disable @typescript-eslint/consistent-type-assertions -- Focused fixtures supply only fields read by each boundary. */
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Product as ProductData, ProductDiscount } from "$app/components/Product";
import { ProductBundle } from "$app/components/Product/ProductBundle.client";
import { ProductPrice } from "$app/components/Product/ProductPrice.client";
import {
  FeaturedProductStateProvider,
  ProductStateProvider,
  useProductState,
} from "$app/components/Product/ProductStateProvider.client";
import { useSelectionFromUrl } from "$app/components/Product/useSelectionFromUrl.client";

vi.mock("$app/components/Product/Thumbnail", () => ({ Thumbnail: () => <div data-testid="thumbnail" /> }));

const buildProduct = (overrides: Partial<ProductData> = {}) =>
  ({
    id: "product",
    name: "Product",
    seller: null,
    bundle_products: [],
    currency_code: "usd",
    installment_plan: null,
    is_legacy_subscription: false,
    is_multiseat_license: false,
    is_quantity_enabled: false,
    is_sales_limited: false,
    is_tiered_membership: false,
    long_url: "https://example.com/product",
    native_type: "digital",
    options: [],
    ppp_details: null,
    price_cents: 1_000,
    pwyw: null,
    quantity_remaining: null,
    recurrences: null,
    rental: null,
    ...overrides,
  }) as ProductData;

const buildOption = (overrides: Partial<ProductData["options"][number]> = {}) => ({
  id: "option",
  name: "Option",
  quantity_left: null,
  description: "",
  price_difference_cents: null,
  recurrence_price_values: null,
  is_pwyw: false,
  duration_in_minutes: null,
  ...overrides,
});

const product = buildProduct();
const soldOut = { valid: false, error_code: "sold_out" } satisfies ProductDiscount;
const existingCustomersOnly = { valid: false, error_code: "not_existing_customer" } satisfies ProductDiscount;
const validDiscount = {
  valid: true,
  code: "HALF",
  discount: {
    type: "percent",
    percents: 50,
    product_ids: null,
    expires_at: null,
    minimum_quantity: null,
    duration_in_billing_cycles: null,
    minimum_amount_cents: null,
  },
} satisfies ProductDiscount;

const DiscountConsumer = () => {
  const { discountCode, setDiscountCode } = useProductState();

  return (
    <button onClick={() => setDiscountCode({ valid: false, error_code: "inactive" })}>
      {discountCode?.valid === false ? discountCode.error_code : "valid"}
    </button>
  );
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("ProductStateProvider", () => {
  it("shares discount updates and resets them when server props change", async () => {
    const { rerender } = render(
      <ProductStateProvider product={product} initialDiscountCode={soldOut}>
        <DiscountConsumer />
      </ProductStateProvider>,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button").textContent).toBe("inactive");

    rerender(
      <ProductStateProvider product={product} initialDiscountCode={existingCustomersOnly}>
        <DiscountConsumer />
      </ProductStateProvider>,
    );

    await waitFor(() => expect(screen.getByRole("button").textContent).toBe("not_existing_customer"));
  });

  it("initializes featured products from their own defaults", () => {
    const featuredProduct = buildProduct({
      recurrences: { default: "monthly", enabled: [{ recurrence: "monthly", id: "monthly", price_cents: 1_000 }] },
    });
    const { result } = renderHook(() => useProductState(), {
      wrapper: ({ children }) => (
        <FeaturedProductStateProvider product={featuredProduct} initialDiscountCode={null}>
          {children}
        </FeaturedProductStateProvider>
      ),
    });

    expect(result.current.selection).toEqual({
      recurrence: "monthly",
      price: { error: false, value: null },
      quantity: 1,
      rent: false,
      optionId: null,
      callStartTime: null,
      payInInstallments: false,
    });
  });

  it("fails fast outside a product state provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => renderHook(() => useProductState())).toThrow(
      "useProductState must be used within ProductStateProvider",
    );
  });
});

describe("useSelectionFromUrl", () => {
  const configurableProduct = buildProduct({
    installment_plan: { number_of_installments: 3 },
    is_quantity_enabled: true,
    quantity_remaining: 5,
    recurrences: {
      default: "monthly",
      enabled: [
        { recurrence: "monthly", id: "monthly", price_cents: 1_000 },
        { recurrence: "yearly", id: "yearly", price_cents: 10_000 },
      ],
    },
    rental: { price_cents: 500, rent_only: true },
    options: [
      buildOption({ id: "sold", name: "Sold out", quantity_left: 0 }),
      buildOption({ id: "available", name: "Available", quantity_left: 3 }),
    ],
  });

  it("parses modern selection parameters and keeps the initial URL selection", () => {
    window.history.replaceState(
      {},
      "",
      "/product?recurrence=yearly&option=available&quantity=9&price=12.34&call_start_time=2026-08-24T10:00:00.000Z&pay_in_installments=true",
    );
    const { result, rerender } = renderHook(() => useSelectionFromUrl(configurableProduct));

    expect(result.current[0]).toEqual({
      recurrence: "yearly",
      rent: true,
      optionId: "available",
      quantity: 3,
      price: { value: 1_234, error: false },
      callStartTime: "2026-08-24T10:00:00.000Z",
      payInInstallments: true,
    });

    window.history.replaceState({}, "", "/product?option=sold&quantity=1");
    rerender();
    expect(result.current[0].optionId).toBe("available");
    expect(result.current[0].quantity).toBe(3);
  });

  it("supports legacy recurrence and variant parameters while preserving parsed-option clamping", () => {
    window.history.replaceState({}, "", "/product?yearly=true&variant=Sold%20out&quantity=9");
    const { result } = renderHook(() => useSelectionFromUrl(configurableProduct));

    expect(result.current[0].recurrence).toBe("yearly");
    expect(result.current[0].optionId).toBe("available");
    expect(result.current[0].quantity).toBe(0);
  });
});

describe("ProductPrice", () => {
  const selection = {
    recurrence: null,
    price: { error: false, value: null },
    quantity: 1,
    rent: false,
    optionId: null,
    callStartTime: null,
    payInInstallments: false,
  } as const;

  it.each([
    ["positive fixed price", buildProduct(), true],
    ["zero pay-what-you-want price", buildProduct({ price_cents: 0, pwyw: { suggested_price_cents: null } }), true],
    [
      "positive bundle child total",
      buildProduct({ price_cents: 0, bundle_products: [{ price: 1_000 }] as ProductData["bundle_products"] }),
      true,
    ],
    [
      "recurring price",
      buildProduct({
        recurrences: { default: "monthly", enabled: [{ recurrence: "monthly", id: "monthly", price_cents: 1_000 }] },
      }),
      false,
    ],
    ["configured option", buildProduct({ options: [buildOption()] }), false],
    ["rent-only price", buildProduct({ rental: { price_cents: 500, rent_only: true } }), false],
    ["zero fixed price", buildProduct({ price_cents: 0 }), false],
  ])("handles %s visibility", (_label, pricedProduct, visible) => {
    const { container } = render(<ProductPrice product={pricedProduct} selection={selection} />);

    expect(container.querySelector('[itemprop="offers"]') !== null).toBe(visible);
  });

  it("applies only valid discounts", () => {
    const { container, rerender } = render(
      <ProductPrice product={product} selection={selection} discountCode={validDiscount} />,
    );

    expect(container.querySelector("s")?.textContent).toBe("$10");
    expect(container.querySelector('[itemprop="price"]')?.textContent).toContain("$5");

    rerender(<ProductPrice product={product} selection={selection} discountCode={soldOut} />);
    expect(container.querySelector("s")).toBeNull();
    expect(container.querySelector('[itemprop="price"]')?.textContent).toContain("$10");
  });
});

describe("ProductBundle", () => {
  it("formats preprojected child totals with buyer-local and authoritative cross-currency subunits", () => {
    const bundleProduct = buildProduct({
      buyer_currency: "jpy",
      buyer_local_currency_rate: 1.441,
      buyer_local_currency_subunit_to_unit: 1,
      bundle_products: [
        {
          id: "same-currency",
          name: "Same currency",
          ratings: null,
          price: 1_000,
          currency_code: "usd",
          thumbnail_url: null,
          native_type: "digital",
          url: "https://example.com/same",
          quantity: 3,
          variant: null,
        },
        {
          id: "cross-currency",
          name: "Cross currency",
          ratings: null,
          price: 1_441,
          currency_code: "jpy",
          thumbnail_url: null,
          native_type: "digital",
          url: "https://example.com/cross",
          quantity: 4,
          variant: null,
        },
      ],
    });
    const selection = {
      recurrence: null,
      price: { error: false, value: null },
      quantity: 1,
      rent: false,
      optionId: null,
      callStartTime: null,
      payInInstallments: false,
    } as const;

    render(
      <ProductBundle
        product={bundleProduct}
        selection={selection}
        bundleItems={{ "same-currency": <span>First child</span>, "cross-currency": <span>Second child</span> }}
      />,
    );

    expect(screen.getByText("First child")).toBeTruthy();
    expect(screen.getByText("Second child")).toBeTruthy();
    expect(screen.getAllByLabelText("Price").map(({ textContent }) => textContent)).toEqual(["¥1,441", "¥1,441"]);
  });
});
