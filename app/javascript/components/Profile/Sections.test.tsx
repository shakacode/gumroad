// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import * as React from "react";
import { afterEach, expect, it, vi } from "vitest";

import { ProfileRichTextLoadBoundary } from "$app/components/Profile/Sections";

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
