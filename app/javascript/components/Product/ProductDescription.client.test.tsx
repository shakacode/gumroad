// @vitest-environment happy-dom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProductDescription from "$app/components/Product/ProductDescription.client";

const mocks = vi.hoisted<{
  descriptionEditor: { id: string } | null;
  enhancementThrows: boolean;
  idleCallback: (() => void) | null;
}>(() => ({
  descriptionEditor: { id: "description-editor" },
  enhancementThrows: false,
  idleCallback: null,
}));

vi.mock("$app/components/RichTextEditor", () => ({
  useRichTextEditor: () => mocks.descriptionEditor,
}));

vi.mock("$app/components/ProductEdit/ProductTab/DescriptionEditor", async () => {
  const React = await import("react");
  return { PublicFilesSettingsContext: React.createContext(null) };
});

vi.mock("@tiptap/react", () => ({
  EditorContent: () => {
    if (mocks.enhancementThrows) throw new Error("Description enhancement failed");
    return <div>Enhanced description</div>;
  },
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
  vi.restoreAllMocks();
  mocks.descriptionEditor = { id: "description-editor" };
  mocks.enhancementThrows = false;
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
    expect(window.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 2000 });
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

  it("keeps server content visible when the client enhancement fails", async () => {
    mocks.enhancementThrows = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ProductDescription
        descriptionHtml="<p>Client description source</p>"
        initialContent={<div>Server description</div>}
        needsClientEnhancement
        publicFiles={[]}
      />,
    );

    act(() => mocks.idleCallback?.());

    await waitFor(() => expect(screen.getByText("Server description")).toBeTruthy());
    expect(screen.queryByText("Enhanced description")).toBeNull();
  });

  it("keeps server content visible until the description editor is ready", async () => {
    mocks.descriptionEditor = null;
    const productDescription = () => (
      <ProductDescription
        descriptionHtml="<p>Client description source</p>"
        initialContent={<div>Server description</div>}
        needsClientEnhancement
        publicFiles={[]}
      />
    );
    const { rerender } = render(productDescription());

    act(() => mocks.idleCallback?.());

    await waitFor(() => expect(screen.getByText("Server description")).toBeTruthy());
    expect(screen.queryByText("Enhanced description")).toBeNull();

    mocks.descriptionEditor = { id: "description-editor" };
    rerender(productDescription());

    expect(await screen.findByText("Enhanced description")).toBeTruthy();
    expect(screen.queryByText("Server description")).toBeNull();
  });
});
