import { getRegisteredTests } from "shaka-shared";
import { describe, expect, it } from "vitest";

import "../../../ab-tests/v0.0/product-page.abtest";

const definitions = () =>
  getRegisteredTests().filter(
    ({ name }) => name.startsWith("Standard product") || name.startsWith("Product to seller "),
  );

describe("product page ShakaPerf definitions", () => {
  it("registers cold and warm standard and seller-navigation scenarios", () => {
    expect(definitions().map(({ name }) => name)).toEqual([
      "Standard product cold landing performance: Inertia control vs React on Rails RSC",
      "Standard product warm landing performance: Inertia control vs React on Rails RSC",
      "Product to seller cold navigation performance: Inertia control vs React on Rails RSC",
      "Product to seller warm navigation performance: Inertia control vs React on Rails RSC",
    ]);
  });

  it("runs every scenario as perf-only and preserves all warm caches", () => {
    for (const definition of definitions()) {
      expect(definition.startingPath).toBe(
        "http://luisfurushio.localhost:3100/l/bgfjk?layout=discover&recommended_by=search",
      );
      expect(definition.experimentPathOverride).toBe(
        "http://luisfurushio.localhost:3200/l/bgfjk?layout=discover&recommended_by=search",
      );
      expect(definition.testTypes).toEqual(["perf", "audit"]);
    }

    const warmDefinitions = definitions().filter(({ name }) => name.includes("warm"));
    expect(warmDefinitions).toHaveLength(2);
    for (const definition of warmDefinitions) {
      expect(definition.config).toMatchObject({ perf: { lighthouseConfig: { disableStorageReset: true } } });
      expect(definition.config?.shared?.beforeNavigate).toEqual(expect.any(Function));
    }
  });

  it("defines the product-to-seller navigation phase", () => {
    for (const definition of definitions().filter(({ name }) => name.includes("navigation"))) {
      expect(definition.markers).toEqual([
        {
          start: "shakaperf-product-seller-start",
          end: "shakaperf-product-seller-end",
          label: "product-to-seller navigation",
        },
      ]);
    }
  });
});
