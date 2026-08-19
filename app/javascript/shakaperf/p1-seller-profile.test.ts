import { getRegisteredTests } from "shaka-shared";
import { describe, expect, it } from "vitest";

import "../../../ab-tests/v0.0/p1-seller-profile.abtest";

const definitions = () => getRegisteredTests().filter(({ name }) => name.startsWith("v0.0 P1"));

describe("P1 seller profile ShakaPerf definitions", () => {
  it("registers separate cold, warm, and bidirectional navigation scenarios", () => {
    expect(definitions().map(({ name }) => name)).toEqual([
      "v0.0 P1 seller profile cold landing: Inertia control vs React on Rails RSC",
      "v0.0 P1 seller profile warm landing: Inertia control vs React on Rails RSC",
      "v0.0 P1 seller profile to product: Inertia navigation vs full document reload",
      "v0.0 P1 product to seller profile: full navigation to Inertia vs React on Rails RSC",
    ]);
  });

  it("uses the same high-cardinality profile on both twin ports", () => {
    for (const definition of definitions()) {
      expect(definition.startingPath).toMatch(/^http:\/\/shakaperfprofile\.localhost:3100\//u);
      expect(definition.experimentPathOverride).toMatch(/^http:\/\/shakaperfprofile\.localhost:3200\//u);
    }
  });

  it("warms the measured BrowserContext and preserves its HTTP cache", () => {
    const warm = definitions().find(({ name }) => name.includes("warm landing"));
    expect(warm).toMatchObject({
      startingPath: "http://shakaperfprofile.localhost:3100/",
      experimentPathOverride: "http://shakaperfprofile.localhost:3200/",
      config: { perf: { lighthouseConfig: { disableStorageReset: true } } },
    });
    expect(warm?.config?.shared?.beforeNavigate?.toString()).toContain("prepareShakaPerfNavigation");
    expect(warm?.config?.shared?.beforeNavigate?.toString()).toContain("warmupPage.goto(context.url");
    expect(warm?.config?.shared?.beforeNavigate?.toString()).toContain("warmupPage.close()");
  });

  it("defines named phases and document-lifecycle assertions for both directions", () => {
    const profileToProduct = definitions().find(({ name }) => name.includes("profile to product"));
    const productToProfile = definitions().find(({ name }) => name.includes("product to seller profile"));
    expect(profileToProduct?.markers).toEqual([
      {
        start: "shakaperf-p1-profile-product-start",
        end: "shakaperf-p1-profile-product-end",
        label: "profile-to-product navigation",
      },
    ]);
    expect(productToProfile?.markers).toEqual([
      {
        start: "shakaperf-p1-product-profile-start",
        end: "shakaperf-p1-product-profile-end",
        label: "product-to-profile navigation",
      },
    ]);
    expect(profileToProduct?.testFn.toString()).toContain("performance.timeOrigin");
    expect(productToProfile?.testFn.toString()).toContain("performance.timeOrigin");
  });
});
