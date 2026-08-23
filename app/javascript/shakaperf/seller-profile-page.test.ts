import { getRegisteredTests } from "shaka-shared";
import { describe, expect, it } from "vitest";

import "../../../ab-tests/v0.0/seller-profile-page.abtest";

const definitions = () =>
  getRegisteredTests().filter(
    ({ name }) => name.startsWith("Seller profile") || name.startsWith("Product to seller profile"),
  );

describe("seller profile page ShakaPerf definitions", () => {
  it("registers a profile landing after ProductPage cache warmup", () => {
    const definition = getRegisteredTests().find(
      ({ name }) =>
        name ===
        "Seller profile landing performance after ProductPage cache warmup: Inertia control vs React on Rails RSC",
    );

    expect(definition).toMatchObject({
      startingPath: "http://shakaperfprofile.localhost:3100/",
      experimentPathOverride: "http://shakaperfprofile.localhost:3200/",
      config: {
        perf: { lighthouseConfig: { disableStorageReset: true } },
        shared: { beforeNavigate: expect.any(Function) },
      },
    });
  });

  it("registers cold and warm landing and bidirectional navigation scenarios", () => {
    expect(definitions().map(({ name }) => name)).toEqual([
      "Seller profile cold landing performance: Inertia control vs React on Rails RSC",
      "Seller profile warm landing performance: Inertia control vs React on Rails RSC",
      "Seller profile to product cold navigation performance",
      "Seller profile to product warm navigation performance",
      "Product to seller profile cold navigation performance",
      "Product to seller profile warm navigation performance",
    ]);
  });

  it("runs every scenario as perf-only on the canonical profile fixture", () => {
    for (const definition of definitions()) {
      expect(definition.startingPath).toMatch(/^http:\/\/shakaperfprofile\.localhost:3100\//u);
      expect(definition.experimentPathOverride).toMatch(/^http:\/\/shakaperfprofile\.localhost:3200\//u);
      expect(definition.testTypes).toEqual(["perf", "audit"]);
    }
  });

  it("preserves warmed caches and defines both navigation phases", () => {
    const warmDefinitions = definitions().filter(({ name }) => name.includes("warm"));
    expect(warmDefinitions).toHaveLength(3);
    for (const definition of warmDefinitions) {
      expect(definition.config).toMatchObject({ perf: { lighthouseConfig: { disableStorageReset: true } } });
      expect(definition.config?.shared?.beforeNavigate).toEqual(expect.any(Function));
    }

    expect(
      definitions()
        .filter(({ name }) => name.includes("navigation"))
        .map(({ markers }) => markers),
    ).toEqual([
      [
        {
          start: "shakaperf-profile-product-start",
          end: "shakaperf-profile-product-end",
          label: "profile-to-product navigation",
        },
      ],
      [
        {
          start: "shakaperf-profile-product-start",
          end: "shakaperf-profile-product-end",
          label: "profile-to-product navigation",
        },
      ],
      [
        {
          start: "shakaperf-product-profile-start",
          end: "shakaperf-product-profile-end",
          label: "product-to-profile navigation",
        },
      ],
      [
        {
          start: "shakaperf-product-profile-start",
          end: "shakaperf-product-profile-end",
          label: "product-to-profile navigation",
        },
      ],
    ]);
  });
});
