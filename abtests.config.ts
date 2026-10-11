import { DESKTOP_VIEWPORT, PHONE_VIEWPORT, defineConfig } from "shaka-shared";

export default defineConfig({
  shared: {
    controlURL: process.env.SHAKAPERF_CONTROL_URL || "http://shakaperf.localhost:3411",
    experimentURL: process.env.SHAKAPERF_EXPERIMENT_URL || "http://shakaperf.localhost:3412",
    viewportDefinitions: [DESKTOP_VIEWPORT, PHONE_VIEWPORT],
    viewports: ["desktop", "phone"],
    parallelism: 1,
    retries: 0,
    timeoutMs: 120_000,
    playwrightOptions: { browser: "chromium", gotoParameters: { waitUntil: "domcontentloaded" } },
    browserConsole: { failOn: [], allowList: [] },
  },
  visreg: { mismatchThreshold: 0.1, maxNumDiffPixels: 50, compareRetries: 0 },
  perf: {
    numberOfMeasurements: 18,
    samplingMode: "simultaneous",
    pValueThreshold: 0.05,
    regressionThreshold: 5,
    regressionThresholdStat: "estimator",
    lighthouseConfig: {
      throttlingMethod: "devtools",
      throttling: {
        rttMs: 100,
        throughputKbps: 2700,
        requestLatencyMs: 200,
        downloadThroughputKbps: 2700,
        uploadThroughputKbps: 2700,
        cpuSlowdownMultiplier: 3,
      },
      onlyCategories: ["performance"],
      maxWaitForFcp: 90_000,
      maxWaitForLoad: 90_000,
    },
  },
});
