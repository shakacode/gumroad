// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getRemainingCallAvailabilities } from "$app/data/call_availabilities";

import {
  ConfigurationSelector,
  type PriceSelection,
  type Product,
} from "$app/components/Product/ConfigurationSelector";
import { ProductHydrationProvider } from "$app/components/PublicPages/ProductHydration.client";

vi.mock("$app/data/call_availabilities", () => ({
  getRemainingCallAvailabilities: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const durationOption = {
  id: "duration-30",
  name: "30 minutes",
  quantity_left: null,
  description: "",
  price_difference_cents: 0,
  recurrence_price_values: null,
  is_pwyw: false,
  duration_in_minutes: 30,
};

const callProduct: Product = {
  id: "product-id",
  permalink: "call-product",
  rental: null,
  options: [durationOption],
  currency_code: "usd",
  price_cents: 1000,
  installment_plan: null,
  is_tiered_membership: false,
  is_legacy_subscription: false,
  is_quantity_enabled: false,
  is_multiseat_license: false,
  quantity_remaining: null,
  recurrences: null,
  pwyw: null,
  ppp_details: null,
  native_type: "call",
};

const initialSelection: PriceSelection = {
  rent: false,
  optionId: durationOption.id,
  price: { error: false, value: null },
  quantity: 1,
  recurrence: null,
  callStartTime: null,
  payInInstallments: false,
};

const octoberFirstAfternoon = {
  start_time: new Date(2024, 9, 1, 13, 0, 0),
  end_time: new Date(2024, 9, 1, 15, 0, 0),
};
const octoberSecondAfternoon = {
  start_time: new Date(2024, 9, 2, 13, 0, 0),
  end_time: new Date(2024, 9, 2, 15, 0, 0),
};

const renderCallSelector = () => {
  const selections: PriceSelection[] = [];
  const Harness = () => {
    const [selection, setSelection] = React.useState(initialSelection);
    return (
      <ConfigurationSelector
        product={callProduct}
        selection={selection}
        setSelection={(update) => {
          setSelection((prev) => {
            const next = typeof update === "function" ? update(prev) : update;
            selections.push(next);
            return next;
          });
        }}
        discount={null}
      />
    );
  };
  render(<Harness />);
  return { selections };
};

describe("CallDateAndTimeSelector", () => {
  it("hydrates a preselected call and loading calendar before adopting the browser timezone", async () => {
    vi.mocked(getRemainingCallAvailabilities).mockReturnValue(new Promise(() => undefined));
    vi.spyOn(Date.prototype, "toLocaleString").mockImplementation(function (this: Date, locales, options) {
      return new Intl.DateTimeFormat(locales, { ...options, timeZone: options?.timeZone ?? "Pacific/Honolulu" }).format(
        this,
      );
    });
    const content = (
      <ProductHydrationProvider
        value={{ locale: "en-US", timeZone: "UTC", referenceTime: Date.parse("2030-01-01T00:00:00Z") }}
      >
        <ConfigurationSelector
          product={callProduct}
          selection={{ ...initialSelection, callStartTime: "2030-01-02T00:30:00Z" }}
          discount={null}
        />
      </ProductHydrationProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(content);
    expect(container.textContent).toContain("Wednesday, January 2");
    expect(container.textContent).toContain("12:30 AM");
    const serverSelect = container.querySelector("select");
    const serverStatus = container.querySelector("[aria-live=polite]");
    const errors = vi.fn();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const root = hydrateRoot(container, content, { onRecoverableError: errors });
    try {
      await React.act(async () => {
        await Promise.resolve();
      });
      expect(errors).not.toHaveBeenCalled();
      expect(container.querySelector("select")).toBe(serverSelect);
      expect(container.querySelector("[aria-live=polite]")).toBe(serverStatus);
      expect(container.textContent).toContain("Tuesday, January 1");
      expect(container.textContent).toContain("02:30 PM");
    } finally {
      await React.act(async () => {
        root.unmount();
        await Promise.resolve();
      });
    }
  });

  it("exposes a labeled date select and native time radios a screen reader can operate", async () => {
    vi.mocked(getRemainingCallAvailabilities).mockResolvedValue([octoberFirstAfternoon, octoberSecondAfternoon]);

    const { selections } = renderCallSelector();

    const dateSelect = await screen.findByLabelText("Select a date");
    if (!(dateSelect instanceof HTMLSelectElement)) throw new Error("expected a native date <select>");
    await waitFor(() => expect(dateSelect.disabled).toBe(false));
    expect(Array.from(dateSelect.options).map((option) => option.text)).toEqual([
      "Tuesday, October 1, 2024",
      "Wednesday, October 2, 2024",
    ]);

    await waitFor(() => expect(selections.at(-1)?.callStartTime).toBe(octoberFirstAfternoon.start_time.toISOString()));

    const firstTime = screen.getByRole("radio", { name: "01:00 PM" });
    if (!(firstTime instanceof HTMLInputElement)) throw new Error("expected a native time radio");
    expect(firstTime.type).toBe("radio");
    expect(firstTime.checked).toBe(true);

    fireEvent.change(dateSelect, { target: { value: "2024-10-02" } });
    await waitFor(() => expect(selections.at(-1)?.callStartTime).toBe(octoberSecondAfternoon.start_time.toISOString()));

    fireEvent.click(screen.getByRole("radio", { name: "01:30 PM" }));
    await waitFor(() => expect(selections.at(-1)?.callStartTime).toBe(new Date(2024, 9, 2, 13, 30, 0).toISOString()));

    const confirmation = screen.getByText("Wednesday, October 2 at 01:30 PM");
    expect(confirmation.closest("[aria-live]")?.getAttribute("aria-live")).toBe("polite");
  });
});
