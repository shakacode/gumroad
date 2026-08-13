import { DESKTOP_VIEWPORT, PHONE_VIEWPORT, defineConfig, installRequestBlocking } from "shaka-shared";

const BASE_URL = "http://localhost:3000";

const LIGHTHOUSE_CONFIG = {
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    requestLatencyMs: 562.5,
    downloadThroughputKbps: 1474.56,
    uploadThroughputKbps: 675,
    cpuSlowdownMultiplier: 4,
  },
  throttlingMethod: "devtools" as const,
  logLevel: "error" as const,
  output: "html" as const,
  onlyCategories: ["performance"],
  maxWaitForLoad: 60_000,
  networkQuietThresholdMs: 1_000,
  cpuQuietThresholdMs: 1_000,
};

export default defineConfig({
  shared: {
    controlURL: BASE_URL,
    experimentURL: BASE_URL,
    viewportDefinitions: [DESKTOP_VIEWPORT, PHONE_VIEWPORT],
    viewports: ["desktop", "phone"],
    parallelism: 1,
    beforeNavigate: async ({ context }) => {
      await installRequestBlocking(context, ["/recaptcha/", "/cart_items_count"]);
    },
    playwrightOptions: {
      browser: "chromium",
      args: ["--no-sandbox"],
      waitTimeout: 60_000,
    },
    browserConsole: {
      failOn: ["error"],
      allowList: [
        "FB.getLoginStatus can no longer be called from http pages",
        "/cart_items_count",
        // The local profiler injects an inline helper without the request nonce.
        // Keep the application comparison visible without failing every run.
        "Executing inline script violates the following Content Security Policy directive",
      ],
    },
  },

  visreg: {
    viewports: ["desktop", "phone"],
    mismatchThreshold: 0.1,
    maxNumDiffPixels: 50,
    comparePixelmatchThreshold: 0.1,
  },

  perf: {
    viewports: ["phone"],
    numberOfMeasurements: 10,
    regressionThreshold: 50,
    pValueThreshold: 0.05,
    regressionThresholdStat: "estimator",
    samplingMode: "simultaneous",
    lighthouseConfig: LIGHTHOUSE_CONFIG,
  },

  audit: {
    lighthouseConfig: LIGHTHOUSE_CONFIG,
  },
});
