// @vitest-environment happy-dom
/* eslint-disable @typescript-eslint/consistent-type-assertions -- Mocks only read the recurring-purchase fields below. */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Product as ProductData, ProductDiscount, Purchase } from "$app/components/Product";
import type { PriceSelection } from "$app/components/Product/ConfigurationSelector";
import {
  ProductPurchaseControls,
  ProductPurchaseControlsFromState,
} from "$app/components/Product/ProductPurchaseControls.client";

const {
  assertResponseError,
  loggedInUser,
  modalModuleLoaded,
  modalRenderFails,
  productState,
  selectionAttributes,
  shareProps,
  showAlert,
  trackUserProductAction,
} = vi.hoisted(() => ({
  assertResponseError: vi.fn(),
  loggedInUser: { value: { id: "buyer" } as { id: string } | null },
  modalModuleLoaded: vi.fn(),
  modalRenderFails: { value: false },
  productState: { value: null as unknown },
  selectionAttributes: {
    value: {
      priceCents: 1_000,
      discountedPriceCents: 1_000,
      pppDiscounted: false,
      isPWYW: false,
      maxQuantity: null as number | null,
    },
  },
  shareProps: { value: null as unknown },
  showAlert: vi.fn(),
  trackUserProductAction: vi.fn(() => Promise.resolve()),
}));

vi.mock("$app/data/user_action_event", () => ({ trackUserProductAction }));
vi.mock("$app/utils/request", () => ({ assertResponseError }));

vi.mock("$app/components/Button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  NavigationButton: ({ children, href, onClick, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

vi.mock("$app/components/CopyToClipboard", () => ({
  CopyToClipboard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("$app/components/DomainSettings", () => ({
  useAppDomain: () => "app.example.com",
  useDomains: () => ({ scheme: "https", rootDomain: "example.com" }),
}));

vi.mock("$app/components/LoggedInUser", () => ({ useLoggedInUser: () => loggedInUser.value }));

vi.mock("$app/components/Product/DiscountExpirationCountdown", () => ({
  DiscountExpirationCountdown: ({ onExpiration }: { onExpiration: () => void }) => (
    <button onClick={onExpiration}>Expire discount</button>
  ),
}));

vi.mock("$app/components/Product/ProductStateProvider.client", () => ({
  useProductState: () => productState.value,
}));

vi.mock("$app/components/Product/ShareSection", () => ({
  ShareSection: (props: unknown) => {
    shareProps.value = props;
    return <div>Share actions</div>;
  },
}));

vi.mock("$app/components/ReviewForm", () => ({
  ReviewForm: ({ permalink }: { permalink: string }) => <div>Review {permalink}</div>,
}));

vi.mock("$app/components/server-components/Alert", () => ({ showAlert }));

vi.mock("$app/components/Product/ConfigurationSelector", async () => {
  const React = await import("react");
  const ConfigurationSelector = React.forwardRef((_props, _ref) => <div>Configuration</div>);
  ConfigurationSelector.displayName = "ConfigurationSelector";

  return {
    applySelection: () => selectionAttributes.value,
    buyerLocalContextFor: () => ({ currencyCode: "usd" }),
    ConfigurationSelector,
    withConfiguredOncePerCartAmount: (discount: unknown) => discount,
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

  return { CtaButton };
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

const buildProduct = (overrides: Partial<ProductData> = {}) =>
  ({
    can_edit: false,
    currency_code: "usd",
    is_recurring_billing: true,
    native_type: "digital",
    permalink: "product",
    ppp_details: null,
    seller: null,
    ...overrides,
  }) as ProductData;

const product = buildProduct();
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

const validDiscount = {
  valid: true,
  code: "save",
  discount: {
    type: "percent",
    percents: 20,
    product_ids: null,
    expires_at: "2026-08-25T00:00:00.000Z",
    minimum_quantity: null,
    duration_in_billing_cycles: null,
    minimum_amount_cents: null,
  },
} satisfies ProductDiscount;

beforeEach(() => {
  vi.stubGlobal("Routes", {
    edit_link_url: ({ id }: { id: string }, { host }: { host: string }) => `https://${host}/products/${id}/edit`,
    license_key_lookup_url: ({ protocol, host }: { protocol: string; host: string }) =>
      `${protocol}://${host}/license-key-lookup`,
  });
  loggedInUser.value = { id: "buyer" };
  selectionAttributes.value = {
    priceCents: 1_000,
    discountedPriceCents: 1_000,
    pppDiscounted: false,
    isPWYW: false,
    maxQuantity: null,
  };
  productState.value = null;
  shareProps.value = null;
  assertResponseError.mockReset();
  showAlert.mockReset();
  trackUserProductAction.mockReset();
  trackUserProductAction.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
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

  it("shows a recoverable error when the subscription dialog cannot render", async () => {
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
    expect(screen.getByRole("button", { name: "Cancel" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Reload and try again" })).not.toBeNull();
  });

  it("marks a missing pay-what-you-want price and focuses its input", () => {
    selectionAttributes.value = { ...selectionAttributes.value, isPWYW: true, discountedPriceCents: 500 };
    const setSelection = vi.fn();
    const focusRequiredInput = vi.fn();

    render(
      <ProductPurchaseControls
        product={product}
        purchase={purchase}
        selection={selection}
        setSelection={setSelection}
        configurationSelectorRef={{ current: { focusRequiredInput } }}
        availabilityNotice={null}
        membershipNotices={null}
        onDiscountExpiration={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "Buy" }));

    expect(setSelection).toHaveBeenCalledWith({ ...selection, price: { error: true, value: null } });
    expect(focusRequiredInput).toHaveBeenCalledOnce();
    expect(showAlert).toHaveBeenCalledWith("You must input an amount", "warning");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("rejects a pay-what-you-want price below the minimum", () => {
    selectionAttributes.value = { ...selectionAttributes.value, isPWYW: true, discountedPriceCents: 500 };
    const underMinimum = { ...selection, price: { error: false, value: 400 } };
    const setSelection = vi.fn();
    const focusRequiredInput = vi.fn();

    render(
      <ProductPurchaseControls
        product={product}
        purchase={purchase}
        selection={underMinimum}
        setSelection={setSelection}
        configurationSelectorRef={{ current: { focusRequiredInput } }}
        availabilityNotice={null}
        membershipNotices={null}
        onDiscountExpiration={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "Buy" }));

    expect(setSelection).toHaveBeenCalledWith({ ...underMinimum, price: { error: true, value: 400 } });
    expect(focusRequiredInput).toHaveBeenCalledOnce();
    expect(showAlert).toHaveBeenCalledWith("Minimum price for this product is $5.", "error");
  });

  it("requires a selected time for a call", () => {
    render(
      <ProductPurchaseControls
        product={buildProduct({ native_type: "call" })}
        purchase={purchase}
        selection={selection}
        availabilityNotice={null}
        membershipNotices={null}
        onDiscountExpiration={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "Buy" }));

    expect(showAlert).toHaveBeenCalledWith("You must select a date and time for the call", "warning");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("clamps a previously selected quantity to the current maximum", async () => {
    selectionAttributes.value = { ...selectionAttributes.value, maxQuantity: 2 };
    const oversizedSelection = { ...selection, quantity: 5 };
    const setSelection = vi.fn();

    render(
      <ProductPurchaseControls
        product={product}
        purchase={purchase}
        selection={oversizedSelection}
        setSelection={setSelection}
        availabilityNotice={null}
        membershipNotices={null}
        onDiscountExpiration={vi.fn()}
      />,
    );

    await waitFor(() => expect(setSelection).toHaveBeenCalledWith({ ...oversizedSelection, quantity: 2 }));
  });

  it("uses product state and invalidates an expired discount", () => {
    const setDiscountCode = vi.fn();
    productState.value = {
      ctaButtonRef: { current: null },
      configurationSelectorRef: { current: null },
      discountCode: validDiscount,
      selection,
      setDiscountCode,
      setSelection: vi.fn(),
    };
    selectionAttributes.value = { ...selectionAttributes.value, discountedPriceCents: 800 };

    const { container } = render(
      <ProductPurchaseControlsFromState
        product={product}
        purchase={purchase}
        availabilityNotice="Available"
        membershipNotices="Membership"
      />,
    );

    expect(container.textContent).toContain("Available");
    expect(container.textContent).toContain("Membership");
    fireEvent.click(screen.getByRole("button", { name: "Expire discount" }));
    expect(setDiscountCode).toHaveBeenCalledWith({ valid: false, error_code: "inactive" });
  });
});
