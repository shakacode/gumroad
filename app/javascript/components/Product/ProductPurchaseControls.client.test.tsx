// @vitest-environment happy-dom
/* eslint-disable @typescript-eslint/consistent-type-assertions -- Mocks only read the recurring-purchase fields below. */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PriceSelection } from "$app/components/Product/ConfigurationSelector";
import type { ProductData, Purchase } from "$app/components/Product/Interactive";
import { ProductPurchaseControls } from "$app/components/Product/ProductPurchaseControls.client";

const { modalModuleLoaded, modalRenderFails } = vi.hoisted(() => ({
  modalModuleLoaded: vi.fn(),
  modalRenderFails: { value: false },
}));

vi.mock("$app/components/LoggedInUser", () => ({ useLoggedInUser: () => ({ id: "buyer" }) }));

vi.mock("$app/components/Product/ConfigurationSelector", async () => {
  const React = await import("react");
  const ConfigurationSelector = React.forwardRef((_props, _ref) => <div>Configuration</div>);
  ConfigurationSelector.displayName = "ConfigurationSelector";

  return {
    applySelection: () => ({
      priceCents: 1_000,
      discountedPriceCents: 1_000,
      pppDiscounted: false,
      isPWYW: false,
      maxQuantity: null,
    }),
    buyerLocalContextFor: vi.fn(),
    ConfigurationSelector,
    withConfiguredOncePerCartAmount: vi.fn(),
  };
});

vi.mock("$app/components/Product/CtaButton", async () => {
  const React = await import("react");
  const CtaButton = React.forwardRef(
    ({ onClick }: { onClick: React.MouseEventHandler<HTMLAnchorElement> }, _ref: React.Ref<HTMLAnchorElement>) => (
      <a href="/checkout" onClick={onClick}>
        Buy
      </a>
    ),
  );
  CtaButton.displayName = "CtaButton";

  return {
    CtaButton,
  };
});

vi.mock("$app/components/Product/SubscriptionChoiceModal", () => {
  modalModuleLoaded();

  return {
    SubscriptionChoiceModal: ({ checkoutUrl }: { checkoutUrl: string }) => {
      if (modalRenderFails.value) throw new Error("Chunk failed");
      return <div role="dialog">Choose subscription for {checkoutUrl}</div>;
    },
  };
});

const product = { is_recurring_billing: true } as ProductData;
const purchase = { membership: { manage_url: "/membership" }, subscription_has_lapsed: false } as Purchase;
const selection = {
  recurrence: "monthly",
  price: { error: false, value: null },
  quantity: 1,
  rent: false,
  optionId: null,
  callStartTime: null,
  payInInstallments: false,
} satisfies PriceSelection;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  modalModuleLoaded.mockClear();
  modalRenderFails.value = false;
});

describe("ProductPurchaseControls", () => {
  it("loads the subscription choice dialog only after the CTA is activated", async () => {
    render(
      <ProductPurchaseControls
        product={product}
        purchase={purchase}
        selection={selection}
        availabilityNotice={null}
        membershipNotices={null}
        onDiscountExpiration={vi.fn()}
      />,
    );

    expect(modalModuleLoaded).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("link", { name: "Buy" }));

    expect((await screen.findByRole("dialog")).textContent).toContain("/checkout");
    expect(modalModuleLoaded).toHaveBeenCalledOnce();
  });

  it("offers a page reload when the purchase options cannot render", async () => {
    modalRenderFails.value = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ProductPurchaseControls
        product={product}
        purchase={purchase}
        selection={selection}
        availabilityNotice={null}
        membershipNotices={null}
        onDiscountExpiration={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "Buy" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Purchase options could not be loaded.");
    expect(screen.getByRole("button", { name: "Reload and try again" })).toBeTruthy();
  });
});
