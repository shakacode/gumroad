import * as React from "react";

import { validateUrl } from "$app/utils/validateUrl";

import { Skeleton } from "$app/components/Skeleton";

type RichTextNode = {
  type?: unknown;
  text?: unknown;
  attrs?: unknown;
  marks?: unknown;
  content?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isNode = (value: unknown): value is RichTextNode => isRecord(value);
const validateImageSrc = (src: string) => {
  const url = validateUrl(src);
  return url && ["http:", "https:"].includes(new URL(url).protocol) ? url : false;
};

const childrenFor = (node: RichTextNode, path: string) =>
  Array.isArray(node.content)
    ? node.content.map((child, index) => (isNode(child) ? renderNode(child, `${path}.${index}`) : null))
    : null;

const renderText = (node: RichTextNode, path: string) => {
  if (typeof node.text !== "string") return null;

  return Array.isArray(node.marks)
    ? node.marks.reduce<React.ReactNode>((content, mark, index) => {
        if (!isNode(mark) || typeof mark.type !== "string") return content;
        if (mark.type === "bold") return <strong key={`${path}.mark.${index}`}>{content}</strong>;
        if (mark.type === "italic") return <em key={`${path}.mark.${index}`}>{content}</em>;
        if (mark.type === "strike") return <s key={`${path}.mark.${index}`}>{content}</s>;
        if (mark.type === "underline") return <u key={`${path}.mark.${index}`}>{content}</u>;
        if (mark.type === "code") return <code key={`${path}.mark.${index}`}>{content}</code>;
        if (mark.type === "link") {
          const href =
            isRecord(mark.attrs) && typeof mark.attrs.href === "string" ? validateUrl(mark.attrs.href) : false;
          return href ? (
            <a key={`${path}.mark.${index}`} href={href} target="_blank" rel="noopener noreferrer nofollow">
              {content}
            </a>
          ) : (
            content
          );
        }
        return content;
      }, node.text)
    : node.text;
};

const renderNode = (node: RichTextNode, path: string): React.ReactNode => {
  if (node.type === "text") return renderText(node, path);

  const children = childrenFor(node, path);
  if (node.type === "tiptap-link") {
    const href = isRecord(node.attrs) && typeof node.attrs.href === "string" ? validateUrl(node.attrs.href) : false;
    return href ? (
      <a key={path} href={href} target="_blank" rel="noopener noreferrer nofollow">
        {children}
      </a>
    ) : (
      children
    );
  }
  if (node.type === "button") {
    const href = isRecord(node.attrs) && typeof node.attrs.href === "string" ? validateUrl(node.attrs.href) : false;
    return href ? (
      <a
        key={path}
        href={href}
        className="tiptap__button button primary"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        {children}
      </a>
    ) : (
      children
    );
  }
  if (node.type === "image" && isRecord(node.attrs)) {
    const src = typeof node.attrs.src === "string" ? validateImageSrc(node.attrs.src) : false;
    if (!src) return null;
    const link = typeof node.attrs.link === "string" ? validateUrl(node.attrs.link) : false;
    const image = <img src={src} />;
    return (
      <figure key={path}>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer nofollow">
            {image}
          </a>
        ) : (
          image
        )}
        <p className="figcaption">{children}</p>
      </figure>
    );
  }
  if (node.type === "reviewCard" || node.type === "upsellCard") return <Skeleton key={path} className="h-32" />;
  if (node.type === "doc") return children;
  if (node.type === "paragraph") return <p key={path}>{children}</p>;
  if (node.type === "blockquote") return <blockquote key={path}>{children}</blockquote>;
  if (node.type === "bulletList") return <ul key={path}>{children}</ul>;
  if (node.type === "orderedList") {
    const start = isRecord(node.attrs) && Number.isSafeInteger(node.attrs.start) ? Number(node.attrs.start) : undefined;
    return (
      <ol key={path} start={start}>
        {children}
      </ol>
    );
  }
  if (node.type === "listItem") return <li key={path}>{children}</li>;
  if (node.type === "hardBreak") return <br key={path} />;
  if (node.type === "horizontalRule") return <hr key={path} />;
  if (node.type === "codeBlock")
    return (
      <pre key={path}>
        <code>{children}</code>
      </pre>
    );
  if (node.type === "heading" && isRecord(node.attrs)) {
    const level = node.attrs.level;
    if (typeof level === "number" && level >= 1 && level <= 6) {
      return React.createElement(`h${level}`, { key: path }, children);
    }
  }

  return null;
};

export const ProfileRichTextContent = ({ content }: { content: Record<string, unknown> }) => (
  <div className="rich-text -mb-4">{renderNode(content, "root")}</div>
);
