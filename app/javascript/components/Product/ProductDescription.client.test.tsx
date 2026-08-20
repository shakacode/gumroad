// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProductDescription from "$app/components/Product/ProductDescription.client";

const mocks = vi.hoisted<{ runOnce: (() => void) | null }>(() => ({ runOnce: null }));

vi.mock("$app/components/useRunOnce", () => ({
  useRunOnce: (callback: () => void) => {
    mocks.runOnce = callback;
  },
}));

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

afterEach(() => {
  cleanup();
  mocks.runOnce = null;
});

describe("ProductDescription", () => {
  it("keeps the raw description visible until the client enhancement is ready", () => {
    render(<ProductDescription descriptionHtml="<p>Server description</p>" publicFiles={[]} />);

    expect(screen.getByText("Server description")).toBeTruthy();
    expect(screen.queryByText("Enhanced description")).toBeNull();

    act(() => mocks.runOnce?.());

    expect(screen.queryByText("Server description")).toBeNull();
    expect(screen.getByText("Enhanced description")).toBeTruthy();
  });
});
