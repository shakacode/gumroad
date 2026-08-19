import { getRegisteredTests } from "shaka-shared";
import { describe, expect, it } from "vitest";

import "../../../ab-tests/v0.0/p1-discover.abtest";

const definitions = () => getRegisteredTests().filter(({ name }) => name.startsWith("v0.0 P1 Discover"));

describe("P1 Discover ShakaPerf definitions", () => {
  it("registers cold, warm, search, and category-to-product scenarios", () => {
    expect(definitions().map(({ name }) => name)).toEqual([
      "v0.0 P1 Discover category cold landing: Inertia control vs React on Rails RSC",
      "v0.0 P1 Discover category warm landing: Inertia control vs React on Rails RSC",
      "v0.0 P1 Discover search landing: Inertia control vs React on Rails RSC",
      "v0.0 P1 Discover category to product: full navigation to Inertia vs React on Rails RSC",
    ]);
  });

  it("uses identical category and search paths on the twin ports", () => {
    const [cold, warm, search, navigation] = definitions();
    for (const definition of [cold, warm, navigation]) {
      expect(definition).toMatchObject({
        startingPath: "http://localhost:3100/software-development/programming",
        experimentPathOverride: "http://localhost:3200/software-development/programming",
      });
    }
    expect(search).toMatchObject({
      startingPath: "http://localhost:3100/discover?query=ShakaPerf&sort=newest",
      experimentPathOverride: "http://localhost:3200/discover?query=ShakaPerf&sort=newest",
    });
  });

  it("warms the measured context and preserves its HTTP cache", () => {
    const warm = definitions().find(({ name }) => name.includes("warm landing"));
    expect(warm?.config).toMatchObject({ perf: { lighthouseConfig: { disableStorageReset: true } } });
    expect(warm?.config?.shared?.beforeNavigate?.toString()).toContain("prepareShakaPerfNavigation");
    expect(warm?.config?.shared?.beforeNavigate?.toString()).toContain("warmupPage.goto(context.url");
    expect(warm?.config?.shared?.beforeNavigate?.toString()).toContain("warmupPage.close()");
  });

  it("defines the navigation phase and validates document replacement", () => {
    const navigation = definitions().find(({ name }) => name.includes("category to product"));
    expect(navigation?.markers).toEqual([
      {
        start: "shakaperf-p1-discover-product-start",
        end: "shakaperf-p1-discover-product-end",
        label: "discover-to-product navigation",
      },
    ]);
    expect(navigation?.testFn.toString()).toContain("performance.timeOrigin");
    expect(navigation?.testFn.toString()).toContain("productLink.click()");
  });
});
