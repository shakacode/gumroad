// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProductRefundPolicyModal from "$app/components/Product/ProductRefundPolicyModal";
import { UserAgentProvider } from "$app/components/UserAgent";

const mocks = vi.hoisted(() => ({ trackUserProductAction: vi.fn() }));

vi.mock("$app/data/user_action_event", () => ({ trackUserProductAction: mocks.trackUserProductAction }));

afterEach(() => {
  cleanup();
  mocks.trackUserProductAction.mockReset();
});

describe("ProductRefundPolicyModal", () => {
  it("renders and tracks the localized fine print dialog", async () => {
    const onClose = vi.fn();
    render(
      <UserAgentProvider value={{ isMobile: false, locale: "en-US" }}>
        <ProductRefundPolicyModal
          refundPolicy={{
            title: "30-day money back guarantee",
            fine_print: "Refund requests are reviewed within two business days.",
            updated_at: "2024-01-02T00:00:00Z",
          }}
          permalink="demo-product"
          onClose={onClose}
        />
      </UserAgentProvider>,
    );

    expect(screen.getByRole("dialog").textContent).toContain("Refund requests are reviewed within two business days.");
    expect(screen.getByText("Last updated Jan 2, 2024")).toBeTruthy();
    await waitFor(() =>
      expect(mocks.trackUserProductAction).toHaveBeenCalledWith({
        name: "product_refund_policy_fine_print_view",
        permalink: "demo-product",
        isModal: true,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
