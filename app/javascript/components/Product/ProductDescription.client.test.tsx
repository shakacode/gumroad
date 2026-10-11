// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProductDescription from "$app/components/Product/ProductDescription.client";

const mocks = vi.hoisted<{
  descriptionEditor: { id: string } | null;
  enhancementThrows: boolean;
}>(() => ({
  descriptionEditor: { id: "description-editor" },
  enhancementThrows: false,
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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  mocks.descriptionEditor = { id: "description-editor" };
  mocks.enhancementThrows = false;
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

    expect(await screen.findByText("Enhanced description")).toBeTruthy();
    expect(screen.queryByText("Server description")).toBeNull();
  });

  it("keeps static server HTML without TipTap enhancement", () => {
    render(
      <ProductDescription
        descriptionHtml="<p>Static description</p>"
        initialContent={<div>Server description</div>}
        needsClientEnhancement={false}
        publicFiles={[]}
      />,
    );

    expect(screen.queryByText("Enhanced description")).toBeNull();
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

    await waitFor(() => expect(screen.getByText("Server description")).toBeTruthy());
    expect(screen.queryByText("Enhanced description")).toBeNull();

    mocks.descriptionEditor = { id: "description-editor" };
    rerender(productDescription());

    expect(await screen.findByText("Enhanced description")).toBeTruthy();
    expect(screen.queryByText("Server description")).toBeNull();
  });
});
