import { preload } from "react-dom";

import type { AssetPreview } from "$app/parsers/product";

export const ProductCoverPreloads = ({
  covers,
  mainCoverId,
}: {
  covers: AssetPreview[];
  mainCoverId: string | null;
}) => {
  const initialCover = covers.find(({ id }) => id === mainCoverId) ?? covers[0];
  for (const cover of covers) {
    // React preloads the initial <img> itself, including its responsive sources.
    if (cover.type === "image" && cover !== initialCover) preload(cover.url, { as: "image" });
  }
  return null;
};
