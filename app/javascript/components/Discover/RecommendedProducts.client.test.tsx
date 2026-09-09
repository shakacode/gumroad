// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { RecommendedProductsSkeleton } from "$app/components/Discover/RecommendedProducts.client";

afterEach(cleanup);

describe("RecommendedProductsSkeleton", () => {
  it("paints the product-cover regions while recommendations stream", () => {
    const { container } = render(<RecommendedProductsSkeleton />);

    const cards = container.querySelectorAll("article");
    const covers = container.querySelectorAll("figure");

    expect(cards).toHaveLength(3);
    expect(covers).toHaveLength(3);
    expect(cards[0]?.className).toContain("min-h-96");
    expect(cards[0]?.className).toContain("lg:h-96");
    expect(covers[0]?.className).toContain("bg-(image:--product-cover-placeholder)");
    expect(covers[0]?.className).toContain("lg:h-full");
  });
});
