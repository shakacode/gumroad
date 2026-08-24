import { getRegisteredTests } from "shaka-shared";
import { describe, expect, it } from "vitest";

import "../../../ab-tests/seller-profile-page.abtest";

const definitions = () => getRegisteredTests().filter(({ name }) => name.startsWith("Seller Profile -"));

describe("seller profile page ShakaPerf definitions", () => {
  it("registers only the active profile landing scenarios", () => {
    expect(definitions().map(({ name }) => name)).toEqual([
      "Seller Profile - Cold landing",
      "Seller Profile - Warm landing",
      "Seller Profile - Landing after product page warmup",
    ]);
    expect(
      definitions()
        .map(({ name }) => name)
        .join(" "),
    ).not.toMatch(/\b(?:vs|inertia|navigation)\b/iu);
  });

  it("targets the canonical profile fixture and preserves warm caches", () => {
    for (const definition of definitions()) {
      expect(definition.startingPath).toBe("http://shakaperfprofile.localhost:3100/");
      expect(definition.experimentPathOverride).toBe("http://shakaperfprofile.localhost:3200/");
    }

    const warmDefinitions = definitions().filter(({ name }) => name.toLowerCase().includes("warm"));
    expect(warmDefinitions).toHaveLength(2);
    for (const definition of warmDefinitions) {
      expect(definition.testTypes).toEqual(["perf", "audit"]);
      expect(definition.config).toMatchObject({ perf: { lighthouseConfig: { disableStorageReset: true } } });
      expect(definition.config?.shared?.beforeNavigate).toEqual(expect.any(Function));
    }
  });

  it("captures the cold profile once with broad visual and accessibility coverage", () => {
    const coldDefinition = definitions().find(({ name }) => name === "Seller Profile - Cold landing");
    expect(coldDefinition).toMatchObject({
      testTypes: ["perf", "visreg", "accessibility", "audit"],
      visregSelectors: ["main"],
    });
  });
});
