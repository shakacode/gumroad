// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { AssetPreview } from "$app/parsers/product";

import { ProductSingleCover, singleStaticImageCover } from "$app/components/Product/ProductSingleCover";

afterEach(cleanup);

const cover = (overrides: Partial<AssetPreview> = {}): AssetPreview => ({
  type: "image",
  filetype: "png",
  id: "cover-1",
  url: "https://example.com/cover.png",
  original_url: "https://example.com/original.png",
  thumbnail: null,
  width: 1005,
  height: 565,
  native_width: 1920,
  native_height: 1080,
  ...overrides,
});

describe("singleStaticImageCover", () => {
  it("selects only one dimensioned image", () => {
    expect(singleStaticImageCover([cover()])?.id).toBe("cover-1");
    expect(singleStaticImageCover([cover(), cover({ id: "cover-2" })])).toBeNull();
    expect(singleStaticImageCover([cover({ type: "video" })])).toBeNull();
    expect(singleStaticImageCover([cover({ native_width: null })])).toBeNull();
  });
});

describe("ProductSingleCover", () => {
  it("reserves the image aspect ratio without client measurement", () => {
    const staticCover = singleStaticImageCover([cover()]);
    if (!staticCover) throw new Error("expected a static cover");

    render(<ProductSingleCover cover={staticCover} productName="Product cover" />);

    const preview = screen.getByLabelText("Product preview");
    expect(preview.querySelector<HTMLElement>("[role=tabpanel]")?.parentElement?.style.aspectRatio).toBe("1920 / 1080");
  });
});
