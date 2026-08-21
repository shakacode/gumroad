// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductRefundPolicy } from "$app/components/Product/ProductRefundPolicy.client";

vi.mock("$app/components/Product/ProductRefundPolicyModal", () => ({
  default: ({ refundPolicy, onClose }: { refundPolicy: { fine_print: string }; onClose: () => void }) => (
    <div role="dialog">
      {refundPolicy.fine_print}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

const renderPolicy = (finePrint: string | null) =>
  render(
    <ProductRefundPolicy
      refundPolicy={{
        title: "30-day money back guarantee",
        fine_print: finePrint,
        updated_at: "2024-01-02T00:00:00Z",
      }}
      permalink="demo-product"
    />,
  );

beforeEach(() => {
  window.history.replaceState({}, "", "/products/demo");
});

afterEach(cleanup);

describe("ProductRefundPolicy", () => {
  it("renders a policy without fine print as static text", () => {
    renderPolicy(null);

    expect(screen.getByText("30-day money back guarantee").tagName).toBe("DIV");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("loads the fine print dialog on demand", async () => {
    renderPolicy("Refund requests are reviewed within two business days.");

    fireEvent.click(screen.getByRole("link", { name: "30-day money back guarantee" }));

    expect((await screen.findByRole("dialog")).textContent).toContain(
      "Refund requests are reviewed within two business days.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.location.hash).toBe("");
  });

  it("loads the fine print dialog for a refund-policy deep link", async () => {
    window.history.replaceState({}, "", "/products/demo#refund-policy");

    renderPolicy("Refund requests are reviewed within two business days.");

    expect(await screen.findByRole("dialog")).toBeTruthy();
  });
});
