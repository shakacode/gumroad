// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ConfigurationSelector,
  type PriceSelection,
  type Product,
} from "$app/components/Product/ConfigurationSelector";

const { calendarModuleLoaded, calendarRenderFails } = vi.hoisted(() => ({
  calendarModuleLoaded: vi.fn(),
  calendarRenderFails: { value: false },
}));

vi.mock("$app/components/ui/Calendar", () => {
  calendarModuleLoaded();
  return {
    Calendar: () => {
      if (calendarRenderFails.value) throw new Error("Calendar failed");
      return <div>Call calendar</div>;
    },
  };
});

vi.mock("$app/data/call_availabilities", () => ({
  getRemainingCallAvailabilities: () => new Promise(() => undefined),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  calendarRenderFails.value = false;
});

const versionedProduct: Product = {
  permalink: "album",
  rental: null,
  options: [
    {
      id: "opt-listener",
      name: "Listener's Edition",
      quantity_left: 5,
      description: "Enjoy the complete album in a simple digital edition.",
      price_difference_cents: 0,
      recurrence_price_values: null,
      is_pwyw: false,
      duration_in_minutes: null,
    },
    {
      id: "opt-collector",
      name: "Collector's Edition",
      quantity_left: null,
      description: "",
      price_difference_cents: 500,
      recurrence_price_values: null,
      is_pwyw: false,
      duration_in_minutes: null,
    },
  ],
  currency_code: "usd",
  price_cents: 999,
  installment_plan: null,
  is_tiered_membership: false,
  is_legacy_subscription: false,
  is_quantity_enabled: false,
  is_multiseat_license: false,
  quantity_remaining: null,
  recurrences: null,
  pwyw: null,
  ppp_details: null,
  native_type: "digital",
};

const initialSelection: PriceSelection = {
  rent: false,
  optionId: "opt-listener",
  price: { error: false, value: null },
  quantity: 1,
  recurrence: null,
  callStartTime: null,
  payInInstallments: false,
};
const callOption = versionedProduct.options[0];
if (!callOption) throw new Error("expected a product option for the call tests");

const renderSelector = () => {
  const Harness = () => {
    const [selection, setSelection] = React.useState(initialSelection);
    return (
      <ConfigurationSelector
        product={versionedProduct}
        selection={selection}
        setSelection={setSelection}
        discount={null}
      />
    );
  };
  render(<Harness />);
};

const describedByTexts = (radio: HTMLElement) => {
  const describedBy = radio.getAttribute("aria-describedby");
  if (!describedBy) throw new Error("expected aria-describedby on the version radio");
  return describedBy.split(" ").map((id) => document.getElementById(id)?.textContent ?? "");
};

describe("version selector accessibility", () => {
  it("exposes price, stock, and description to screen readers via aria-describedby", () => {
    renderSelector();

    const texts = describedByTexts(screen.getByRole("radio", { name: "Listener's Edition" }));
    expect(texts).toHaveLength(3);
    expect(texts[0]).toContain("$9.99");
    expect(texts[1]).toBe("5 left");
    expect(texts[2]).toBe("Enjoy the complete album in a simple digital edition.");
  });

  it("omits the stock and description references when a version has neither", () => {
    renderSelector();

    const texts = describedByTexts(screen.getByRole("radio", { name: "Collector's Edition" }));
    expect(texts).toHaveLength(1);
    expect(texts[0]).toContain("$14.99");
  });
});

describe("call booking", () => {
  it("does not load the calendar module for an ordinary digital product", () => {
    renderSelector();

    expect(calendarModuleLoaded).not.toHaveBeenCalled();
  });

  it("loads the calendar module when a call product needs appointment selection", async () => {
    const callProduct: Product = {
      ...versionedProduct,
      native_type: "call",
      options: [{ ...callOption, duration_in_minutes: 30 }],
    };
    const Harness = () => {
      const [selection, setSelection] = React.useState(initialSelection);
      return (
        <ConfigurationSelector
          product={callProduct}
          selection={selection}
          setSelection={setSelection}
          discount={null}
        />
      );
    };

    render(<Harness />);

    expect(screen.getByRole("status").textContent).toBe("Loading appointment times…");
    expect(await screen.findByText("Call calendar")).toBeTruthy();
    expect(calendarModuleLoaded).toHaveBeenCalledOnce();
  });

  it("offers a reload when the call calendar cannot render", async () => {
    calendarRenderFails.value = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const callProduct: Product = {
      ...versionedProduct,
      native_type: "call",
      options: [{ ...callOption, duration_in_minutes: 30 }],
    };
    const Harness = () => {
      const [selection, setSelection] = React.useState(initialSelection);
      return (
        <ConfigurationSelector
          product={callProduct}
          selection={selection}
          setSelection={setSelection}
          discount={null}
        />
      );
    };

    render(<Harness />);

    expect((await screen.findByRole("alert")).textContent).toContain("Appointment times could not be loaded.");
    expect(screen.getByRole("button", { name: "Reload and try again" })).toBeTruthy();
  });
});
