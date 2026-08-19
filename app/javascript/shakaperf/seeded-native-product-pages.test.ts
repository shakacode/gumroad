import { getRegisteredTests } from "shaka-shared";
import { describe, expect, it } from "vitest";

import "../../../ab-tests/v0.0/seeded-native-product-pages.abtest";
import "../../../ab-tests/v0.0/native-product-page.abtest";
import "../../../ab-tests/v0.0/seeded-product-navigation.abtest";
import "../../../ab-tests/v0.0/seeded-seller-page.abtest";
import "../../../ab-tests/v0.0/seeded-seller-product-navigation.abtest";
import {
  ADDITIONAL_SEEDED_NATIVE_PRODUCTS,
  seededDiscoverProductUrl,
  seededProfileProductUrl,
  seededSellerUrl,
} from "../../../config/shakaperf/seeded-native-products";

describe("seeded native product ShakaPerf definitions", () => {
  it("measures the seeded bundle and verifies its child-product cards", () => {
    const definition = getRegisteredTests().find(({ name }) =>
      name.startsWith("v0.0 Microsoft 365 cold bundle product:"),
    );

    expect(definition).toMatchObject({
      startingPath: "http://o365itpros.localhost:3100/l/O365IT?layout=discover&recommended_by=search",
      experimentPathOverride: "http://o365itpros.localhost:3200/l/O365IT?layout=discover&recommended_by=search",
    });
    expect(definition?.testFn.toString()).toContain("BUNDLE_PRODUCT_NAMES");
    expect(definition?.testFn.toString()).toContain("This bundle contains...");
  });

  it("covers every additional seeded product on both twin ports", () => {
    const definitions = getRegisteredTests().filter(({ name }) =>
      ADDITIONAL_SEEDED_NATIVE_PRODUCTS.some(({ label }) => name.startsWith(`v0.0 ${label} product:`)),
    );

    expect(definitions).toHaveLength(ADDITIONAL_SEEDED_NATIVE_PRODUCTS.length);
    expect(
      definitions.map(({ startingPath, experimentPathOverride }) => ({ startingPath, experimentPathOverride })),
    ).toEqual(
      ADDITIONAL_SEEDED_NATIVE_PRODUCTS.map((product) => ({
        startingPath: seededDiscoverProductUrl(product, 3100),
        experimentPathOverride: seededDiscoverProductUrl(product, 3200),
      })),
    );
  });

  it("builds canonical seller and generated profile-product URLs", () => {
    const product = ADDITIONAL_SEEDED_NATIVE_PRODUCTS[0];

    if (!product) throw new Error("Missing seeded product");
    expect(seededSellerUrl(3100)).toBe("http://o365itpros.localhost:3100/");
    expect(seededProfileProductUrl(product, 3100)).toBe("http://o365itpros.localhost:3100/l/M365PS?layout=profile");
    expect(seededDiscoverProductUrl(product, 3100)).toBe(
      "http://o365itpros.localhost:3100/l/M365PS?layout=discover&recommended_by=search",
    );
  });

  it("compares the canonical seller page on both twins", () => {
    const definition = getRegisteredTests().find(({ name }) => name.startsWith("v0.0 Office 365 seller page:"));

    expect(definition).toMatchObject({
      startingPath: "http://o365itpros.localhost:3100/",
      experimentPathOverride: "http://o365itpros.localhost:3200/",
      visregSelectors: ["main"],
    });
    expect(definition?.testTypes).toEqual(expect.arrayContaining(["visreg", "perf", "accessibility"]));
    expect(definition?.testFn.toString()).toContain('locator("#app[data-page]")');
    expect(definition?.testFn.toString()).toContain("redirects are not allowed");
  });

  it("compares Inertia seller-to-product navigation with a full document reload", () => {
    const definition = getRegisteredTests().find(({ name }) => name.startsWith("v0.0 Office 365 seller to product:"));

    expect(definition).toMatchObject({
      startingPath: "http://o365itpros.localhost:3100/",
      experimentPathOverride: "http://o365itpros.localhost:3200/",
      visregSelectors: ["main"],
      markers: [
        {
          start: "shakaperf-seller-product-navigation-start",
          end: "shakaperf-seller-product-navigation-end",
          label: "seller-to-product navigation",
        },
      ],
    });
    expect(definition?.testFn.toString()).toContain("productLink.click()");
    expect(definition?.testFn.toString()).toContain("page.goto(expectedProductUrl");
    expect(definition?.testFn.toString()).toContain("performance.timeOrigin");
    expect(definition?.testFn.toString()).toContain("Profile-layout product navigation");
  });

  it("measures a product-to-creator navigation on both renderers", () => {
    const definition = getRegisteredTests().find(({ name }) => name.startsWith("v0.0 Seeded creator navigation:"));

    expect(definition).toMatchObject({
      startingPath: "http://o365itpros.localhost:3100/l/PowerPlatform?layout=discover&recommended_by=search",
      experimentPathOverride: "http://o365itpros.localhost:3200/l/PowerPlatform?layout=discover&recommended_by=search",
    });
    expect(definition?.testFn.toString()).toContain('removeAttribute("target")');
    expect(definition?.testFn.toString()).toContain("creatorLink.click(");
  });
});
