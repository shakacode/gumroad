// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProductShare } from "$app/components/Product/ProductShare.client";

const { menuModuleLoaded, menuRenderFails } = vi.hoisted(() => ({
  menuModuleLoaded: vi.fn(),
  menuRenderFails: { value: false },
}));

vi.mock("$app/components/Product/ProductShareMenu", () => {
  menuModuleLoaded();

  return {
    default: ({ url }: { url: string }) => {
      if (menuRenderFails.value) throw new Error("Chunk failed");
      return <div>Share {url}</div>;
    },
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  menuModuleLoaded.mockClear();
  menuRenderFails.value = false;
});

describe("ProductShare", () => {
  it("loads the share menu only after its trigger is activated", async () => {
    render(<ProductShare url="https://example.com/product" name="Demo product" />);

    expect(menuModuleLoaded).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    expect(await screen.findByText("Share https://example.com/product")).toBeTruthy();
    expect(menuModuleLoaded).toHaveBeenCalledOnce();
  });

  it("offers a page reload when the share menu cannot render", async () => {
    menuRenderFails.value = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<ProductShare url="https://example.com/product" name="Demo product" />);

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Sharing options could not be loaded.");
    expect(screen.getByRole("button", { name: "Reload and try again" })).toBeTruthy();
  });
});
