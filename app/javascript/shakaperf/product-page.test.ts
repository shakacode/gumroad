import { getRegisteredTests } from "shaka-shared";
import { describe, expect, it } from "vitest";

import "../../../ab-tests/product-page.abtest";

const definitions = () => getRegisteredTests().filter(({ name }) => name.startsWith("Product Page -"));

describe("product page ShakaPerf definitions", () => {
  it("registers only the active route-specific landing scenarios", () => {
    expect(definitions().map(({ name }) => name)).toEqual([
      "Product Page - Discover layout cold landing",
      "Product Page - Discover layout warm landing",
      "Product Page - Profile layout cold landing",
      "Product Page - Profile layout warm landing",
      "Product Page - Discover layout landing after different product warmup",
    ]);
    expect(
      definitions()
        .map(({ name }) => name)
        .join(" "),
    ).not.toMatch(/\b(?:vs|inertia|navigation)\b/iu);
  });

  it("targets canonical product routes and preserves warm caches", () => {
    for (const definition of definitions().slice(0, 4)) {
      expect(definition.startingPath).toMatch(/^http:\/\/luisfurushio\.localhost:3100\/l\/bgfjk/u);
      expect(definition.experimentPathOverride).toMatch(/^http:\/\/luisfurushio\.localhost:3200\/l\/bgfjk/u);
    }

    const warmDefinitions = definitions().filter(({ name }) => name.includes("warm"));
    expect(warmDefinitions).toHaveLength(3);
    for (const definition of warmDefinitions) {
      expect(definition.testTypes).toEqual(["perf", "audit"]);
      expect(definition.config).toMatchObject({ perf: { lighthouseConfig: { disableStorageReset: true } } });
      expect(definition.config?.shared?.beforeNavigate).toEqual(expect.any(Function));
    }
  });

  it("captures each cold rendered layout once with broad visual and accessibility coverage", () => {
    const coldDefinitions = definitions().filter(({ name }) => name.includes("cold"));
    expect(coldDefinitions).toHaveLength(2);
    for (const definition of coldDefinitions) {
      expect(definition.testTypes).toEqual(["perf", "visreg", "accessibility", "audit"]);
      expect(definition.visregSelectors).toEqual(["article"]);
    }
  });
});
