import { getRegisteredTests } from "shaka-shared";
import { describe, expect, it } from "vitest";

import "../../../ab-tests/v0.0/residential-product-page.abtest";

describe("residential product ShakaPerf definition", () => {
  it("registers distinct cold and warm production-shaped product scenarios", () => {
    const definitions = getRegisteredTests().filter(({ name }) => name.startsWith("v0.0 Residential Design"));

    expect(definitions.map(({ name }) => name)).toEqual([
      "v0.0 Residential Design cold product: Inertia control vs React on Rails RSC",
      "v0.0 Residential Design warm product: Inertia control vs React on Rails RSC",
    ]);
    expect(definitions.every(({ testFn }) => testFn.toString().includes("assertResidentialReady"))).toBe(true);
  });

  it("warms the measured context without a Lighthouse cache reset", () => {
    const definition = getRegisteredTests().find(({ name }) =>
      name.startsWith("v0.0 Residential Design warm product:"),
    );

    expect(definition).toMatchObject({
      startingPath: "http://luisfurushio.localhost:3100/l/bgfjk?layout=discover&recommended_by=search",
      experimentPathOverride: "http://luisfurushio.localhost:3200/l/bgfjk?layout=discover&recommended_by=search",
      config: { perf: { lighthouseConfig: { disableStorageReset: true } } },
    });
    expect(definition?.config?.shared?.beforeNavigate?.toString()).toContain("warmupPage.goto(context.url");
    expect(definition?.config?.shared?.beforeNavigate?.toString()).toContain("assertResidentialReady");
    expect(definition?.config?.shared?.beforeNavigate?.toString()).toContain("warmupPage.close()");
  });
});
