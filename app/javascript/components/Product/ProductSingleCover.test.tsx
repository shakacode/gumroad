// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { AssetPreview } from "$app/parsers/product";
import { MAX_PORTRAIT_FRAME_HEIGHT } from "$app/utils/videoFrame";

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
    const image = screen.getByRole("img", { name: "Product cover" });
    expect(image.getAttribute("src")).toBe("https://example.com/cover.png");
    expect(image.getAttribute("srcset")).toBe(
      "https://example.com/cover.png 1005w, https://example.com/original.png 1920w",
    );
    expect(image.getAttribute("sizes")).toBe("(min-width: 75.25rem) 73.25rem, calc(100vw - 2rem)");
    expect(image.getAttribute("loading")).toBe("eager");
    expect(image.getAttribute("fetchpriority")).toBe("high");
  });

  it("caps a portrait image frame", () => {
    const staticCover = singleStaticImageCover([cover({ native_width: 1080, native_height: 1920 })]);
    if (!staticCover) throw new Error("expected a static cover");

    render(<ProductSingleCover cover={staticCover} productName="Portrait" />);

    const frame = screen.getByRole("tabpanel").parentElement;
    expect(frame?.style.maxHeight).toBe(MAX_PORTRAIT_FRAME_HEIGHT);
  });

  it("does not prioritize a below-fold featured product", () => {
    const staticCover = singleStaticImageCover([cover()]);
    if (!staticCover) throw new Error("expected a static cover");

    render(<ProductSingleCover cover={staticCover} productName="Featured product" prioritize={false} />);

    const image = screen.getByRole("img", { name: "Featured product" });
    expect(image.getAttribute("loading")).toBe("lazy");
    expect(image.getAttribute("fetchpriority")).toBe("low");
  });
});
