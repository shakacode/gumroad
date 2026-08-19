// @vitest-environment happy-dom
import { Editor } from "@tiptap/core";
import { afterEach, describe, expect, it } from "vitest";

import { baseEditorOptions } from "$app/components/RichTextEditor";

describe("Image", () => {
  let editor: Editor | null = null;

  afterEach(() => editor?.destroy());

  it("preserves intrinsic dimensions and alternative text from stored HTML", () => {
    editor = new Editor({
      ...baseEditorOptions([]),
      content:
        '<figure><img src="https://example.com/guide.png" alt="Guide preview" width="1042" height="492"><p class="figcaption"></p></figure>',
    });

    expect(editor.getJSON().content?.[0]?.attrs).toMatchObject({
      src: "https://example.com/guide.png",
      alt: "Guide preview",
      width: "1042",
      height: "492",
    });
    expect(editor.getHTML()).toContain('alt="Guide preview" width="1042" height="492"');
  });
});
