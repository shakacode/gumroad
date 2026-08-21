import * as React from "react";

import type { AssetPreview } from "$app/parsers/product";
import { MAX_PORTRAIT_FRAME_HEIGHT } from "$app/utils/videoFrame";

import { DEFAULT_IMAGE_WIDTH } from "$app/components/Product/productCover";

export type StaticImageCover = AssetPreview & {
  type: "image";
  native_width: number;
  native_height: number;
};

const isStaticImageCover = (cover: AssetPreview | null): cover is StaticImageCover =>
  cover?.type === "image" &&
  cover.native_width !== null &&
  cover.native_width > 0 &&
  cover.native_height !== null &&
  cover.native_height > 0;

export const singleStaticImageCover = (covers: AssetPreview[]): StaticImageCover | null => {
  const cover = covers.length === 1 ? (covers[0] ?? null) : null;
  return isStaticImageCover(cover) ? cover : null;
};

const PRODUCT_COVER_SIZES = "(min-width: 75.25rem) 73.25rem, calc(100vw - 2rem)";

export const ProductSingleCover = ({ cover, productName }: { cover: StaticImageCover; productName: string }) => {
  const frameStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: `${cover.native_width} / ${cover.native_height}`,
    ...(cover.native_height > cover.native_width ? { maxHeight: MAX_PORTRAIT_FRAME_HEIGHT } : {}),
  };
  const srcSet =
    cover.url !== cover.original_url && cover.native_width > DEFAULT_IMAGE_WIDTH
      ? `${cover.url} ${DEFAULT_IMAGE_WIDTH}w, ${cover.original_url} ${cover.native_width}w`
      : undefined;

  return (
    <figure
      className="group relative col-span-full overflow-hidden rounded-t border-b border-border bg-background bg-cover"
      aria-label="Product preview"
    >
      <div
        className="flex h-full snap-x snap-mandatory items-center overflow-x-scroll overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={frameStyle}
      >
        <div
          role="tabpanel"
          id={cover.id}
          className="mt-0! flex h-full min-h-[1px] flex-[1_0_100%] snap-start items-center justify-center border-0! p-0!"
        >
          <img
            className="max-h-full w-full object-contain"
            src={cover.url}
            srcSet={srcSet}
            sizes={srcSet ? PRODUCT_COVER_SIZES : undefined}
            alt={productName}
            itemProp="image"
          />
        </div>
      </div>
    </figure>
  );
};
