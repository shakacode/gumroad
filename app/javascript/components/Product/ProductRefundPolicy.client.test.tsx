// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductRefundPolicy } from "$app/components/Product/ProductRefundPolicy.client";

const { modalModuleLoaded, modalRenderFails } = vi.hoisted(() => ({
  modalModuleLoaded: vi.fn(),
  modalRenderFails: { value: false },
}));

vi.mock("$app/components/Product/ProductRefundPolicyModal", () => {
  modalModuleLoaded();

  return {
    default: ({ refundPolicy, onClose }: { refundPolicy: { fine_print: string }; onClose: () => void }) => {
      if (modalRenderFails.value) throw new Error("Chunk failed");

      return (
        <div role="dialog">
          {refundPolicy.fine_print}
          <button onClick={onClose}>Close</button>
        </div>
      );
    },
  };
});

beforeEach(() => {
  window.history.replaceState({}, "", "/products/demo");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  modalModuleLoaded.mockClear();
  modalRenderFails.value = false;
});

describe("ProductRefundPolicy", () => {
  it("renders a policy without fine print as static text", () => {
    render(
      <ProductRefundPolicy
        refundPolicy={{
          title: "30-day money back guarantee",
          fine_print: null,
          updated_at: "2024-01-02T00:00:00Z",
        }}
        permalink="demo-product"
      />,
    );

    expect(screen.getByText("30-day money back guarantee").tagName).toBe("DIV");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("loads the fine print dialog on demand", async () => {
    render(
      <ProductRefundPolicy
        refundPolicy={{
          title: "30-day money back guarantee",
          fine_print: "Refund requests are reviewed within two business days.",
          updated_at: "2024-01-02T00:00:00Z",
        }}
        permalink="demo-product"
      />,
    );

    expect(modalModuleLoaded).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("link", { name: "30-day money back guarantee" }));

    expect((await screen.findByRole("dialog")).textContent).toContain(
      "Refund requests are reviewed within two business days.",
    );
    expect(modalModuleLoaded).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.location.hash).toBe("");
  });

  it("loads the fine print dialog for a refund-policy deep link", async () => {
    window.history.replaceState({}, "", "/products/demo#refund-policy");

    render(
      <ProductRefundPolicy
        refundPolicy={{
          title: "30-day money back guarantee",
          fine_print: "Refund requests are reviewed within two business days.",
          updated_at: "2024-01-02T00:00:00Z",
        }}
        permalink="demo-product"
      />,
    );

    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("falls back to readable fine print when the dialog cannot render", async () => {
    modalRenderFails.value = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ProductRefundPolicy
        refundPolicy={{
          title: "30-day money back guarantee",
          fine_print: "Refund requests are reviewed within two business days.",
          updated_at: "2024-01-02T00:00:00Z",
        }}
        permalink="demo-product"
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: "30-day money back guarantee" }));

    expect((await screen.findByRole("region", { name: "30-day money back guarantee" })).textContent).toContain(
      "Refund requests are reviewed within two business days.",
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
