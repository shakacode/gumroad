// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import * as React from "react";
import { afterEach, expect, it, vi } from "vitest";

import { ProfileRichTextLoadBoundary } from "$app/components/Profile/ProfileRichTextEnhancement.client";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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
