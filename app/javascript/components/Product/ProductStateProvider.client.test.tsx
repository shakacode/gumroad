// @vitest-environment happy-dom
/* eslint-disable @typescript-eslint/consistent-type-assertions -- The mocked selection hook does not read the product fixture. */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProductData, ProductDiscount } from "$app/components/Product/Interactive";
import {
  FeaturedProductStateProvider,
  ProductStateProvider,
  useProductState,
} from "$app/components/Product/ProductStateProvider.client";

vi.mock("$app/components/Product/useSelectionFromUrl.client", () => ({
  useSelectionFromUrl: () => [{ price: { error: false, value: null }, quantity: 1 }, vi.fn()],
}));

const product = {} as ProductData;
const soldOut = { valid: false, error_code: "sold_out" } satisfies ProductDiscount;
const existingCustomersOnly = { valid: false, error_code: "not_existing_customer" } satisfies ProductDiscount;

const DiscountConsumer = () => {
  const { discountCode, setDiscountCode } = useProductState();

  return (
    <button onClick={() => setDiscountCode({ valid: false, error_code: "inactive" })}>
      {discountCode?.valid === false ? discountCode.error_code : "valid"}
    </button>
  );
};

const SelectionConsumer = () => {
  const { selection } = useProductState();

  return <div>{`${selection.recurrence}:${selection.quantity}:${selection.optionId ?? "none"}`}</div>;
};

afterEach(cleanup);

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
    const featuredProduct = {
      recurrences: { default: "monthly" },
    } as ProductData;

    render(
      <FeaturedProductStateProvider product={featuredProduct} initialDiscountCode={null}>
        <SelectionConsumer />
      </FeaturedProductStateProvider>,
    );

    expect(screen.getByText("monthly:1:none")).toBeTruthy();
  });
});
