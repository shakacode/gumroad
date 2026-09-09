// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import * as React from "react";
import { afterEach, expect, it, vi } from "vitest";

import { profileRichTextNeedsClientEnhancement } from "$app/components/Profile/ProfileRichText";
import { ProfileRichTextLoadBoundary } from "$app/components/Profile/ProfileRichTextEnhancement.client";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("contains profile rich text loading failures", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const BrokenRichText = () => {
    throw new Error("chunk unavailable");
  };

  const { container } = render(
    <ProfileRichTextLoadBoundary>
      <BrokenRichText />
    </ProfileRichTextLoadBoundary>,
  );

  expect(container.innerHTML).toBe("");
});

it("keeps server rich text after a client loading failure", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const BrokenRichText = () => {
    throw new Error("chunk unavailable");
  };

  const { getByText } = render(
    <ProfileRichTextLoadBoundary fallback={<p>Server-visible creator story</p>}>
      <BrokenRichText />
    </ProfileRichTextLoadBoundary>,
  );

  expect(getByText("Server-visible creator story")).toBeTruthy();
});

it("only enhances rich text with client-owned nodes", () => {
  expect(
    profileRichTextNeedsClientEnhancement({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Server-visible creator story" }] }],
    }),
  ).toBe(false);

  for (const type of ["codeBlock", "raw", "reviewCard", "upsellCard"]) {
    expect(
      profileRichTextNeedsClientEnhancement({
        type: "doc",
        content: [{ type: "blockquote", content: [{ type }] }],
      }),
    ).toBe(true);
  }
});
