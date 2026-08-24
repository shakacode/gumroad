import { getRegisteredTests } from "shaka-shared";
import { describe, expect, it } from "vitest";

import { DISCOVER_CARD_COUNTS } from "../../../ab-tests/discover-page.abtest";
import config from "../../../abtests.config";

const definitions = () => getRegisteredTests().filter(({ name }) => name.startsWith("Discover Page -"));

describe("Discover page ShakaPerf definitions", () => {
  it("aggregates only the three final route suites", () => {
    expect(config.shared.testPathPattern).toBe(
      "ab-tests/(?:product-page|seller-profile-page|discover-page)\\.abtest\\.ts$",
    );
  });

  it("registers only the active route-specific landing scenarios", () => {
    expect(definitions().map(({ name }) => name)).toEqual([
      "Discover Page - Marketplace cold landing",
      "Discover Page - Marketplace warm landing",
      "Discover Page - Programming category cold landing",
      "Discover Page - Programming category warm landing",
    ]);
    expect(
      definitions()
        .map(({ name }) => name)
        .join(" "),
    ).not.toMatch(/\b(?:vs|inertia|navigation)\b/iu);
  });

  it("targets the canonical routes and preserves warm caches", () => {
    expect(DISCOVER_CARD_COUNTS).toEqual({ marketplace: 22, programming: 16 });
    expect(definitions().map(({ startingPath }) => startingPath)).toEqual([
      "/discover",
      "/discover",
      "/software-development/programming",
      "/software-development/programming",
    ]);

    const warmDefinitions = definitions().filter(({ name }) => name.includes("warm"));
    expect(warmDefinitions).toHaveLength(2);
    for (const definition of warmDefinitions) {
      expect(definition.testTypes).toEqual(["perf", "audit"]);
      expect(definition.config).toMatchObject({ perf: { lighthouseConfig: { disableStorageReset: true } } });
      expect(definition.config?.shared?.beforeNavigate).toEqual(expect.any(Function));
    }
  });

  it("captures each cold rendered route once with broad visual and accessibility coverage", () => {
    const coldDefinitions = definitions().filter(({ name }) => name.includes("cold"));
    expect(coldDefinitions).toHaveLength(2);
    for (const definition of coldDefinitions) {
      expect(definition.testTypes).toEqual(["perf", "visreg", "accessibility", "audit"]);
      expect(definition.visregSelectors).toEqual(['section:has(> div > [role="tablist"])']);
    }
  });
});
