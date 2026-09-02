// @vitest-environment happy-dom
import { render } from "@testing-library/react";
import * as React from "react";
import { expect, it, vi } from "vitest";

vi.mock("@tiptap/react", () => ({
  EditorContent: ({ editor }: { editor: unknown }) => (editor ? <div>Enhanced content</div> : null),
}));
vi.mock("$app/components/RichTextEditor", () => ({ useRichTextEditor: () => null }));

import ProfileRichText from "$app/components/Profile/ProfileRichText.client";
import { ProfileRichTextLoadBoundary } from "$app/components/Profile/ProfileRichTextEnhancement.client";

it("keeps server content visible until the rich text editor is ready", () => {
  const { getByText } = render(<ProfileRichText content={{}} fallback={<p>Server-visible creator story</p>} />);

  expect(getByText("Server-visible creator story")).toBeTruthy();
});

it("keeps server content visible when the client enhancement fails", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const BrokenEnhancement = () => {
    throw new Error("chunk failed");
  };

  const { getByText } = render(
    <ProfileRichTextLoadBoundary fallback={<p>Server content after enhancement failure</p>}>
      <BrokenEnhancement />
    </ProfileRichTextLoadBoundary>,
  );

  expect(getByText("Server content after enhancement failure")).toBeTruthy();
  consoleError.mockRestore();
});
