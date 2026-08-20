import { getRegisteredTests } from "shaka-shared";
import { describe, expect, it } from "vitest";

import "../../../ab-tests/v0.0/discover-page.abtest";

const definitions = () => getRegisteredTests().filter(({ name }) => name.startsWith("Discover"));

describe("Discover page ShakaPerf definitions", () => {
  it("registers cold and warm landing and navigation performance scenarios", () => {
    expect(definitions().map(({ name }) => name)).toEqual([
      "Discover cold landing performance: Inertia control vs React on Rails RSC",
      "Discover warm landing performance: Inertia control vs React on Rails RSC",
      "Discover category cold landing performance: Inertia control vs React on Rails RSC",
      "Discover category warm landing performance: Inertia control vs React on Rails RSC",
      "Discover to category cold navigation performance: Inertia control vs React on Rails RSC",
      "Discover to category warm navigation performance: Inertia control vs React on Rails RSC",
    ]);
  });

  it("runs every scenario as perf-only and uses the expected starting paths", () => {
    expect(definitions().map(({ startingPath, testTypes }) => ({ startingPath, testTypes }))).toEqual([
      { startingPath: "/discover", testTypes: ["perf", "audit"] },
      { startingPath: "/discover", testTypes: ["perf", "audit"] },
      { startingPath: "/software-development/programming", testTypes: ["perf", "audit"] },
      { startingPath: "/software-development/programming", testTypes: ["perf", "audit"] },
      { startingPath: "/discover", testTypes: ["perf", "audit"] },
      { startingPath: "/discover", testTypes: ["perf", "audit"] },
    ]);
  });

  it("preserves warmed caches and defines the navigation phase", () => {
    const warmDefinitions = definitions().filter(({ name }) => name.includes("warm"));
    expect(warmDefinitions).toHaveLength(3);
    for (const definition of warmDefinitions) {
      expect(definition.config).toMatchObject({ perf: { lighthouseConfig: { disableStorageReset: true } } });
      expect(definition.config?.shared?.beforeNavigate).toEqual(expect.any(Function));
    }

    const navigationDefinitions = definitions().filter(({ name }) => name.includes("navigation"));
    for (const definition of navigationDefinitions) {
      expect(definition.markers).toEqual([
        {
          start: "shakaperf-discover-category-start",
          end: "shakaperf-discover-category-end",
          label: "discover-to-category navigation",
        },
      ]);
    }
  });
});
