// @vitest-environment happy-dom
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";

import type { AssetPreview } from "$app/parsers/product";

import { ProductCoverPreloads } from "$app/components/Product/ProductCoverPreloads";

const cover = (id: string, type: AssetPreview["type"] = "image"): AssetPreview => ({
  id,
  type,
  url: `https://example.com/${id}.webp`,
  original_url: `https://example.com/${id}-original.webp`,
  filetype: "webp",
  thumbnail: null,
  width: 1005,
  height: 600,
  native_width: 1920,
  native_height: 1146,
});

it("preloads gallery images outside Inertia and lets the initial image choose its responsive source", () => {
  const first = cover("first");
  const main = cover("main");
  const srcSet = `${main.url} 1005w, ${main.original_url} 1920w`;
  const markup = renderToStaticMarkup(
    <>
      <ProductCoverPreloads covers={[first, main, cover("video", "video")]} mainCoverId={main.id} />
      <img src={main.url} srcSet={srcSet} sizes="100vw" alt="Product" />
    </>,
  );
  const document = new DOMParser().parseFromString(markup, "text/html");
  const preloads = Array.from(document.querySelectorAll('link[rel="preload"][as="image"]'));
  expect(preloads).toHaveLength(2);
  expect(preloads.some((link) => link.getAttribute("href") === first.url)).toBe(true);
  expect(preloads.some((link) => link.getAttribute("imagesrcset") === srcSet)).toBe(true);
  expect(preloads.every((link) => !link.hasAttribute("inertia") && !link.hasAttribute("data-inertia"))).toBe(true);
});

it("falls back to the first cover when no main cover matches", () => {
  const first = cover("first");
  const second = cover("second");
  const markup = renderToStaticMarkup(<ProductCoverPreloads covers={[first, second]} mainCoverId="missing" />);
  expect(markup).toContain(second.url);
  expect(markup).not.toContain(first.url);
});
