// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const CART_COUNT_URL = "about:blank";

const loadFreshCartModule = async () => {
  vi.resetModules();
  return import("./cart");
};

describe("loadCartItemsCount", () => {
  beforeEach(() => document.body.replaceChildren());

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("accepts a cart count only from the hidden app-domain iframe", async () => {
    const { loadCartItemsCount } = await loadFreshCartModule();
    const callback = vi.fn();

    loadCartItemsCount(CART_COUNT_URL, callback);

    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    if (!iframe?.contentWindow) throw new Error("expected the cart iframe to have a content window");
    const iframeWindow = iframe.contentWindow;
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "cart-items-count", cartItemsCount: 2 },
        origin: "https://attacker.example",
        source: iframeWindow,
      }),
    );
    expect(callback).not.toHaveBeenCalled();

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "cart-items-count", cartItemsCount: 2 },
        origin: new URL(CART_COUNT_URL).origin,
        source: window,
      }),
    );
    expect(callback).not.toHaveBeenCalled();

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "cart-items-count", cartItemsCount: 2 },
        origin: new URL(CART_COUNT_URL).origin,
        source: iframeWindow,
      }),
    );

    await vi.waitFor(() => expect(callback).toHaveBeenCalledWith(2));
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("falls back when the iframe fails to load", async () => {
    const { loadCartItemsCount } = await loadFreshCartModule();
    const callback = vi.fn();

    loadCartItemsCount(CART_COUNT_URL, callback);
    document.querySelector("iframe")?.dispatchEvent(new Event("error"));

    await vi.waitFor(() => expect(callback).toHaveBeenCalledWith("not-available"));
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("falls back and removes the iframe when it does not respond", async () => {
    vi.useFakeTimers();
    const { loadCartItemsCount } = await loadFreshCartModule();
    const callback = vi.fn();

    loadCartItemsCount(CART_COUNT_URL, callback);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(callback).toHaveBeenCalledWith("not-available");
    expect(document.querySelector("iframe")).toBeNull();
  });
});
