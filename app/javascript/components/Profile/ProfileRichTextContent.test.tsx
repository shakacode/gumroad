import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";

import { ProfileRichTextContent } from "$app/components/Profile/ProfileRichTextContent";

it("renders profile rich text blocks in the initial HTML", () => {
  const html = renderToStaticMarkup(
    <ProfileRichTextContent
      content={{
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "About this creator" }],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "A " },
              { type: "text", text: "carefully made", marks: [{ type: "bold" }, { type: "italic" }] },
              { type: "text", text: " collection." },
            ],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "First benefit" }] }],
              },
            ],
          },
        ],
      }}
    />,
  );

  expect(html).toContain("<h2>About this creator</h2>");
  expect(html).toContain("<p>A <em><strong>carefully made</strong></em> collection.</p>");
  expect(html).toContain("<ul><li><p>First benefit</p></li></ul>");
});

it("renders safe rich text links without emitting unsafe hrefs", () => {
  const html = renderToStaticMarkup(
    <ProfileRichTextContent
      content={{
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "tiptap-link",
                attrs: { href: "example.com" },
                content: [{ type: "text", text: "Read more" }],
              },
              { type: "text", text: " and " },
              {
                type: "tiptap-link",
                attrs: { href: "javascript://alert(1)" },
                content: [{ type: "text", text: "do not run this" }],
              },
            ],
          },
        ],
      }}
    />,
  );

  expect(html).toContain(
    '<a href="https://example.com/" target="_blank" rel="noopener noreferrer nofollow">Read more</a>',
  );
  expect(html).toContain("do not run this");
  expect(html).not.toContain("javascript:");
});

it("renders validated links stored as text marks", () => {
  const html = renderToStaticMarkup(
    <ProfileRichTextContent
      content={{
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Legacy link",
                marks: [{ type: "link", attrs: { href: "example.com/legacy" } }],
              },
              {
                type: "text",
                text: "Unsafe link",
                marks: [{ type: "link", attrs: { href: "javascript://alert(1)" } }],
              },
            ],
          },
        ],
      }}
    />,
  );

  expect(html).toContain(
    '<a href="https://example.com/legacy" target="_blank" rel="noopener noreferrer nofollow">Legacy link</a>',
  );
  expect(html).toContain("Unsafe link");
  expect(html).not.toContain("javascript:");
});

it("renders static custom nodes and leaves interactive embeds to the client", () => {
  const html = renderToStaticMarkup(
    <ProfileRichTextContent
      content={{
        type: "doc",
        content: [
          {
            type: "image",
            attrs: { src: "https://example.com/cover.png", link: "https://example.com/details" },
            content: [{ type: "text", text: "Cover caption" }],
          },
          {
            type: "button",
            attrs: { href: "https://example.com/buy" },
            content: [{ type: "text", text: "Learn more" }],
          },
          { type: "reviewCard", attrs: { reviewId: "review-id" } },
          { type: "upsellCard", attrs: { productId: "product-id" } },
          { type: "raw", attrs: { html: '<script data-danger="true">alert(1)</script>' } },
        ],
      }}
    />,
  );

  expect(html).toContain(
    '<figure><a href="https://example.com/details" target="_blank" rel="noopener noreferrer nofollow"><img src="https://example.com/cover.png"/></a><p class="figcaption">Cover caption</p></figure>',
  );
  expect(html).toContain(
    '<a href="https://example.com/buy" class="tiptap__button button primary" target="_blank" rel="noopener noreferrer nofollow">Learn more</a>',
  );
  expect(html).not.toContain("review-id");
  expect(html).not.toContain("product-id");
  expect(html).not.toContain("data-danger");
  expect(html.match(/data-slot="skeleton"/gu)).toHaveLength(2);
});

it("does not emit non-web image sources", () => {
  const html = renderToStaticMarkup(
    <ProfileRichTextContent content={{ type: "doc", content: [{ type: "image", attrs: { src: "my-app://open" } }] }} />,
  );

  expect(html).not.toContain("my-app://open");
});

it("preserves the starting number of ordered lists", () => {
  const html = renderToStaticMarkup(
    <ProfileRichTextContent
      content={{
        type: "doc",
        content: [
          {
            type: "orderedList",
            attrs: { start: 3 },
            content: [
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Third item" }] }],
              },
            ],
          },
        ],
      }}
    />,
  );

  expect(html).toContain('<ol start="3"><li><p>Third item</p></li></ol>');
});
