// @vitest-environment happy-dom
import { act, fireEvent } from "@testing-library/react";
import * as React from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import {
  ConfigurationSelector,
  type PriceSelection,
  type Product,
} from "$app/components/Product/ConfigurationSelector";
import { ProductHydrationProvider } from "$app/components/PublicPages/ProductHydration.client";

const product: Product = {
  id: "early-input",
  permalink: "guide",
  rental: null,
  options: [],
  currency_code: "usd",
  price_cents: 1_200,
  installment_plan: null,
  is_tiered_membership: false,
  is_legacy_subscription: false,
  is_quantity_enabled: true,
  is_multiseat_license: false,
  quantity_remaining: 5,
  recurrences: null,
  pwyw: { suggested_price_cents: 1_200 },
  ppp_details: null,
  native_type: "digital",
};
const initialSelection: PriceSelection = {
  rent: false,
  optionId: null,
  price: { value: null, error: false },
  quantity: 1,
  recurrence: null,
  callStartTime: null,
  payInInstallments: false,
};
const roots: Root[] = [];
afterEach(async () => {
  await act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

const hydrateEditedInput = async (
  selector: string,
  value: string,
  overrides: Partial<Product> = {},
  price: number | null = null,
) => {
  const Harness = () => {
    const [selection, setSelection] = React.useState({ ...initialSelection, price: { value: price, error: false } });
    return (
      <ProductHydrationProvider value={{ locale: "en-US", timeZone: "UTC", referenceTime: 0 }}>
        <ConfigurationSelector
          product={{ ...product, ...overrides }}
          selection={selection}
          setSelection={setSelection}
          discount={null}
        />
        <output>{JSON.stringify(selection)}</output>
      </ProductHydrationProvider>
    );
  };
  const container = document.createElement("div");
  container.innerHTML = renderToString(<Harness />);
  document.body.append(container);
  const input = container.querySelector<HTMLInputElement>(selector);
  if (!input) throw new Error("Missing server-rendered input");
  input.value = value;
  await act(async () => {
    roots.push(
      hydrateRoot(
        container,
        <React.StrictMode>
          <Harness />
        </React.StrictMode>,
      ),
    );
  });
  return {
    input,
    selection: (): PriceSelection => JSON.parse(container.querySelector("output")?.textContent ?? "null"),
  };
};

describe("purchase inputs edited before hydration", () => {
  it("keeps quantity in both the input and purchase state, then accepts later edits", async () => {
    const { input, selection } = await hydrateEditedInput('input[type="number"]', "2");
    expect(input.value).toBe("2");
    expect(selection().quantity).toBe(2);
    fireEvent.change(input, { target: { value: "3" } });
    expect(selection().quantity).toBe(3);
  });

  it.each([
    ["usd", null, "25", 2_500],
    ["usd", 1_234, "", null],
    ["jpy", null, "25", 25],
  ] as const)("keeps an early %s price edit (%s to %s)", async (currency_code, initialPrice, value, expected) => {
    const { input, selection } = await hydrateEditedInput(
      'input[inputmode="decimal"]',
      value,
      { currency_code },
      initialPrice,
    );
    expect(input.value).toBe(value);
    expect(selection().price.value).toBe(expected);
  });

  it("converts an early buyer-local amount into the seller currency", async () => {
    const { selection } = await hydrateEditedInput('input[inputmode="decimal"]', "25", {
      buyer_currency: "eur",
      buyer_local_currency_rate: 2,
    });
    expect(selection().price.value).toBe(1_250);
  });
});
