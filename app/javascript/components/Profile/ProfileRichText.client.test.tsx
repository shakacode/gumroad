// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { expect, it, vi } from "vitest";

vi.mock("@tiptap/react", () => ({
  EditorContent: ({ editor }: { editor: unknown }) => (editor ? <div>Enhanced content</div> : null),
}));
vi.mock("$app/components/RichTextEditor", () => ({ useRichTextEditor: () => null }));

import ProfileRichText from "$app/components/Profile/ProfileRichText.client";

it("keeps server content visible until the rich text editor is ready", () => {
  render(
    <ProfileRichText
      section={{ id: "about", header: null, type: "SellerProfileRichTextSection", text: {} }}
      fallback={<p>Server-visible creator story</p>}
    />,
  );

  expect(screen.getByText("Server-visible creator story")).toBeTruthy();
});
