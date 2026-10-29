// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import {
  ConfigurationSelector,
  type ConfigurationSelectorHandle,
  type PriceSelection,
  type Product,
} from "$app/components/Product/ConfigurationSelector";
import { ProductVariantNavigationProvider } from "$app/components/Product/ProductVariantNavigation.client";

afterEach(cleanup);

const versionedProduct: Product = {
  id: "product-id",
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

const versionedOption = (index: number): Product["options"][number] => {
  const option = versionedProduct.options[index];
  if (!option) throw new Error(`versionedProduct has no option at index ${index}`);
  return option;
};

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

describe("streamed variant navigation", () => {
  const nativeChoice = (document: Document, name: string) => {
    const radio = document.querySelector(`[role="radio"][aria-label="${name}"]`);
    const form = document.getElementById(radio?.getAttribute("form") ?? "");
    const url = new URL(form?.getAttribute("action") ?? "");
    for (const input of form?.querySelectorAll("input") ?? [])
      url.searchParams.append(input.getAttribute("name") ?? "", input.getAttribute("value") ?? "");
    return { radio, form, url };
  };
  const navigation = {
    productId: versionedProduct.id,
    url: "https://seller.example.com/l/album?layout=profile&variant=Listener&code=SAVE&quantity=2&price=999",
  };
  const selector = (product = versionedProduct, selection = { ...initialSelection, quantity: 2 }) => (
    <ProductVariantNavigationProvider value={navigation}>
      <ConfigurationSelector
        product={{ ...product, is_quantity_enabled: true }}
        selection={selection}
        discount={null}
      />
    </ProductVariantNavigationProvider>
  );

  it("provides a native first-choice URL before hydration with the discount and quantity intact", () => {
    const document = new DOMParser().parseFromString(renderToString(selector()), "text/html");
    const { radio, form, url } = nativeChoice(document, "Collector's Edition");
    expect(radio?.tagName).toBe("BUTTON");
    expect(radio?.getAttribute("type")).toBe("submit");
    expect(form?.getAttribute("method")).toBe("get");
    expect(url.origin + url.pathname).toBe("https://seller.example.com/l/album");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      layout: "profile",
      code: "SAVE",
      quantity: "2",
      option: "opt-collector",
    });
    expect(document.getElementById(url.hash.slice(1))?.hasAttribute("data-option-picker")).toBe(true);
  });

  it("keeps ordinary and featured product selectors as buttons", () => {
    renderSelector();
    expect(screen.getByRole("radio", { name: "Collector's Edition" }).tagName).toBe("BUTTON");
    expect(screen.getByRole("radio", { name: "Collector's Edition" }).getAttribute("form")).toBeNull();
    cleanup();
    render(selector({ ...versionedProduct, id: "featured-product" }));
    expect(screen.getByRole("radio", { name: "Collector's Edition" }).tagName).toBe("BUTTON");
    expect(screen.getByRole("radio", { name: "Collector's Edition" }).getAttribute("form")).toBeNull();
  });

  it("updates the hydrated selection and cancels native submission", () => {
    const Harness = () => {
      const [selection, setSelection] = React.useState(initialSelection);
      return (
        <ProductVariantNavigationProvider value={navigation}>
          <ConfigurationSelector
            product={versionedProduct}
            selection={selection}
            setSelection={setSelection}
            discount={null}
          />
        </ProductVariantNavigationProvider>
      );
    };
    render(<Harness />);
    const collector = screen.getByRole("radio", { name: "Collector's Edition" });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    fireEvent(collector, event);
    expect(event.defaultPrevented).toBe(true);
    expect(collector.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("radio", { name: "Listener's Edition" }));
    expect(screen.getByRole("radio", { name: "Listener's Edition" }).getAttribute("aria-checked")).toBe("true");
  });

  it("preserves the current amount when the already-selected option is clicked before hydration", () => {
    const document = new DOMParser().parseFromString(renderToString(selector()), "text/html");
    expect(nativeChoice(document, "Listener's Edition").url.searchParams.get("price")).toBe("999");
  });

  it("retains the clamped quantity when changing to a version with more stock", () => {
    const document = new DOMParser().parseFromString(
      renderToString(
        selector(
          {
            ...versionedProduct,
            options: [{ ...versionedOption(0), quantity_left: 1 }, versionedOption(1)],
          },
          { ...initialSelection, quantity: 1 },
        ),
      ),
      "text/html",
    );
    expect(nativeChoice(document, "Collector's Edition").url.searchParams.get("quantity")).toBe("1");
  });

  it("keeps a sold-out version as an accessible disabled button", () => {
    const document = new DOMParser().parseFromString(
      renderToString(
        selector({
          ...versionedProduct,
          options: [{ ...versionedOption(0), quantity_left: 0 }, versionedOption(1)],
        }),
      ),
      "text/html",
    );
    const radio = document.querySelector('[role="radio"][aria-label="Listener\'s Edition"]');
    expect(radio?.tagName).toBe("BUTTON");
    expect(radio?.hasAttribute("disabled")).toBe(true);
  });
});

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

  it("focuses the first option radio when the buyer has not chosen yet", () => {
    const ref = React.createRef<ConfigurationSelectorHandle>();
    render(
      <ConfigurationSelector
        ref={ref}
        product={versionedProduct}
        selection={{ ...initialSelection, optionId: null }}
        setSelection={() => {}}
        discount={null}
      />,
    );

    ref.current?.focusRequiredInput();

    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Listener's Edition" }));
  });

  it("focuses the option radios rather than the price field when an option is still required", () => {
    const ref = React.createRef<ConfigurationSelectorHandle>();
    render(
      <ConfigurationSelector
        ref={ref}
        product={{ ...versionedProduct, pwyw: { suggested_price_cents: 500 } }}
        selection={{ ...initialSelection, optionId: null }}
        setSelection={() => {}}
        discount={null}
      />,
    );

    ref.current?.focusRequiredInput();

    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Listener's Edition" }));
  });

  it("skips a sold-out option when focusing the picker", () => {
    const ref = React.createRef<ConfigurationSelectorHandle>();
    render(
      <ConfigurationSelector
        ref={ref}
        product={{
          ...versionedProduct,
          options: [{ ...versionedOption(0), quantity_left: 0 }, versionedOption(1)],
        }}
        selection={{ ...initialSelection, optionId: null }}
        setSelection={() => {}}
        discount={null}
      />,
    );

    ref.current?.focusRequiredInput();

    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Collector's Edition" }));
  });

  it("leaves a sold-out cheaper option out of the advertised low price", () => {
    render(
      <ConfigurationSelector
        product={{
          ...versionedProduct,
          options: [{ ...versionedOption(0), quantity_left: 0 }, versionedOption(1)],
        }}
        selection={initialSelection}
        setSelection={() => {}}
        discount={null}
      />,
    );

    expect(document.querySelector("[itemprop='lowPrice']")?.textContent).toBe("14.99");
  });

  it("marks a fully closed membership sold out where the tiers render", () => {
    render(
      <ConfigurationSelector
        product={{
          ...versionedProduct,
          is_tiered_membership: true,
          options: [
            { ...versionedOption(0), quantity_left: 0 },
            { ...versionedOption(1), quantity_left: 0 },
          ],
        }}
        selection={initialSelection}
        setSelection={() => {}}
        discount={null}
      />,
    );

    expect(document.querySelector("[itemprop='availability']")?.textContent).toBe("https://schema.org/SoldOut");
    expect(document.querySelector("[itemprop='offerCount']")?.textContent).toBe("0");
    expect(document.querySelectorAll("[itemprop='offer']")).toHaveLength(0);
  });

  it("leaves a tier with no price for the selected recurrence out of the advertised low price", () => {
    render(
      <ConfigurationSelector
        product={{
          ...versionedProduct,
          is_tiered_membership: true,
          price_cents: 0,
          recurrences: {
            default: "monthly",
            enabled: [{ recurrence: "monthly", price_cents: 0, id: "monthly" }],
          },
          options: [
            { ...versionedOption(0), quantity_left: 5, recurrence_price_values: null },
            {
              ...versionedOption(1),
              quantity_left: 5,
              price_difference_cents: 0,
              recurrence_price_values: { monthly: { price_cents: 1500, suggested_price_cents: null } },
            },
          ],
        }}
        selection={{ ...initialSelection, recurrence: "monthly" }}
        setSelection={() => {}}
        discount={null}
      />,
    );

    expect(document.querySelector("[itemprop='lowPrice']")?.textContent).toBe("15");
    expect(document.querySelector("[itemprop='offerCount']")?.textContent).toBe("1");
    expect(document.querySelectorAll("[itemprop='offer']")).toHaveLength(1);
    expect(screen.getByRole("radio", { name: "Listener's Edition" }).getAttribute("itemprop")).toBeNull();
  });
});
