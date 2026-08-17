import { getRegisteredTests } from "shaka-shared";
import { describe, expect, it } from "vitest";

import "../../../ab-tests/v0.0/seeded-native-product-pages.abtest";
import "../../../ab-tests/v0.0/seeded-product-navigation.abtest";
import {
  ADDITIONAL_SEEDED_NATIVE_PRODUCTS,
  seededNativeProductUrl,
} from "../../../config/shakaperf/seeded-native-products";

describe("seeded native product ShakaPerf definitions", () => {
  it("covers every additional seeded product on both twin ports", () => {
    const definitions = getRegisteredTests().filter(({ name }) => name.startsWith("v0.0") && name.includes("product:"));

    expect(definitions).toHaveLength(ADDITIONAL_SEEDED_NATIVE_PRODUCTS.length);
    expect(
      definitions.map(({ startingPath, experimentPathOverride }) => ({ startingPath, experimentPathOverride })),
    ).toEqual(
      ADDITIONAL_SEEDED_NATIVE_PRODUCTS.map((product) => ({
        startingPath: seededNativeProductUrl(product, 3100),
        experimentPathOverride: seededNativeProductUrl(product, 3200),
      })),
    );
  });

  it("measures a product-to-creator navigation on both renderers", () => {
    const definition = getRegisteredTests().find(({ name }) => name.startsWith("v0.0 Seeded creator navigation:"));

    expect(definition).toMatchObject({
      startingPath: "http://o365itpros.localhost:3100/l/PowerPlatform?layout=discover&recommended_by=search",
      experimentPathOverride: "http://o365itpros.localhost:3200/l/PowerPlatform?layout=discover&recommended_by=search",
    });
    expect(definition?.testFn.toString()).toContain('removeAttribute("target")');
    expect(definition?.testFn.toString()).toContain("creatorLink.click()");
  });
});
