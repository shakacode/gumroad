// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProductDescription from "$app/components/Product/ProductDescription.client";

const mocks = vi.hoisted<{ idleCallback: (() => void) | null }>(() => ({ idleCallback: null }));

vi.mock("$app/components/RichTextEditor", () => ({
  useRichTextEditor: () => ({ id: "description-editor" }),
}));

vi.mock("$app/components/ProductEdit/ProductTab/DescriptionEditor", async () => {
  const React = await import("react");
  return { PublicFilesSettingsContext: React.createContext(null) };
});

vi.mock("@tiptap/react", () => ({
  EditorContent: () => <div>Enhanced description</div>,
}));

vi.mock("$app/components/TiptapExtensions/PublicFileEmbed", () => ({ PublicFileEmbed: { name: "publicFileEmbed" } }));
vi.mock("$app/components/TiptapExtensions/ReviewCard", () => ({ ReviewCard: { name: "reviewCard" } }));
vi.mock("$app/components/TiptapExtensions/UpsellCard", () => ({ UpsellCard: { name: "upsellCard" } }));

beforeEach(() => {
  vi.stubGlobal(
    "requestIdleCallback",
    vi.fn((callback: () => void) => {
      mocks.idleCallback = callback;
      return 123;
    }),
  );
  vi.stubGlobal("cancelIdleCallback", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  mocks.idleCallback = null;
});

describe("ProductDescription", () => {
  it("keeps the raw description visible until the client enhancement is ready", async () => {
    render(
      <ProductDescription
        descriptionHtml="<p>Client description source</p>"
        initialContent={<div>Server description</div>}
        needsClientEnhancement
        publicFiles={[]}
      />,
    );

    expect(screen.getByText("Server description")).toBeTruthy();
    expect(screen.queryByText("Client description source")).toBeNull();
    expect(screen.queryByText("Enhanced description")).toBeNull();

    act(() => mocks.idleCallback?.());

    expect(await screen.findByText("Enhanced description")).toBeTruthy();
    expect(screen.queryByText("Server description")).toBeNull();
  });

  it("does not start the description enhancement until the browser is idle", async () => {
    render(
      <ProductDescription
        descriptionHtml="<p>Client description source</p>"
        initialContent={<div>Server description</div>}
        needsClientEnhancement
        publicFiles={[]}
      />,
    );

    expect(window.requestIdleCallback).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Server description")).toBeTruthy();
    expect(screen.queryByText("Enhanced description")).toBeNull();

    act(() => mocks.idleCallback?.());

    expect(await screen.findByText("Enhanced description")).toBeTruthy();
    expect(screen.queryByText("Server description")).toBeNull();
  });

  it("does not schedule TipTap enhancement for static server HTML", () => {
    render(
      <ProductDescription
        descriptionHtml="<p>Static description</p>"
        initialContent={<div>Server description</div>}
        needsClientEnhancement={false}
        publicFiles={[]}
      />,
    );

    expect(window.requestIdleCallback).not.toHaveBeenCalled();
    expect(screen.getByText("Server description")).toBeTruthy();
  });
});
