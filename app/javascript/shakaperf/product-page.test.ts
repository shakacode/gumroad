import { getRegisteredTests } from "shaka-shared";
import { describe, expect, it } from "vitest";

import "../../../ab-tests/v0.0/product-page.abtest";

const landingDefinitions = () =>
  getRegisteredTests().filter(
    ({ name }) => name.startsWith("Discover-layout product") || name.startsWith("Profile-layout product"),
  );

describe("product page ShakaPerf definitions", () => {
  it("registers a discover-layout product landing after a different product cache warmup", () => {
    const definition = getRegisteredTests().find(
      ({ name }) =>
        name ===
        "Product landing performance after a different discover-layout ProductPage cache warmup: Inertia control vs React on Rails RSC",
    );

    expect(definition).toMatchObject({
      startingPath: "http://o365itpros.localhost:3100/l/M365Core?layout=discover&recommended_by=search",
      experimentPathOverride: "http://o365itpros.localhost:3200/l/M365Core?layout=discover&recommended_by=search",
      config: {
        perf: { lighthouseConfig: { disableStorageReset: true } },
        shared: { beforeNavigate: expect.any(Function) },
      },
    });
  });

  it("registers cold and warm Discover and Profile product layouts", () => {
    expect(landingDefinitions().map(({ name }) => name)).toEqual([
      "Discover-layout product cold landing performance: Inertia control vs React on Rails RSC",
      "Discover-layout product warm landing performance: Inertia control vs React on Rails RSC",
      "Profile-layout product cold landing performance: Inertia control vs React on Rails RSC",
      "Profile-layout product warm landing performance: Inertia control vs React on Rails RSC",
    ]);
  });

  it("uses explicit layout URLs and preserves all warm caches", () => {
    const [discoverCold, discoverWarm, profileCold, profileWarm] = landingDefinitions();

    expect([discoverCold?.startingPath, discoverWarm?.startingPath]).toEqual(
      Array(2).fill("http://luisfurushio.localhost:3100/l/bgfjk?layout=discover&recommended_by=search"),
    );
    expect([discoverCold?.experimentPathOverride, discoverWarm?.experimentPathOverride]).toEqual(
      Array(2).fill("http://luisfurushio.localhost:3200/l/bgfjk?layout=discover&recommended_by=search"),
    );
    expect([profileCold?.startingPath, profileWarm?.startingPath]).toEqual(
      Array(2).fill("http://luisfurushio.localhost:3100/l/bgfjk?layout=profile&recommended_by=search"),
    );
    expect([profileCold?.experimentPathOverride, profileWarm?.experimentPathOverride]).toEqual(
      Array(2).fill("http://luisfurushio.localhost:3200/l/bgfjk?layout=profile&recommended_by=search"),
    );

    const warmDefinitions = landingDefinitions().filter(({ name }) => name.includes("warm"));
    expect(warmDefinitions).toHaveLength(2);
    for (const definition of warmDefinitions) {
      expect(definition.config).toMatchObject({ perf: { lighthouseConfig: { disableStorageReset: true } } });
      expect(definition.config?.shared?.beforeNavigate).toEqual(expect.any(Function));
    }
  });
});
