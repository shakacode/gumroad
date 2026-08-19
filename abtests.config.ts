import * as os from "node:os";
import { join } from "node:path";
import { DESKTOP_VIEWPORT, PHONE_VIEWPORT, defineConfig, installRequestBlocking } from "shaka-shared";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const projectDir = process.cwd();
const PARALLELISM = Math.max(1, Math.floor(os.cpus().length / 2));

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
  maxWaitForFcp: 90_000,
  maxWaitForLoad: 90_000,
};

export default defineConfig({
  shared: {
    controlURL: `http://localhost:${CONTROL_PORT}`,
    experimentURL: `http://localhost:${EXPERIMENT_PORT}`,
    viewportDefinitions: [DESKTOP_VIEWPORT, PHONE_VIEWPORT],
    viewports: ["desktop", "phone"],
    parallelism: PARALLELISM,
    timeoutMs: 240_000,
    beforeNavigate: async ({ context }) => {
      // Development authorizes rack-mini-profiler on every request; keep its injected UI and requests out of measurements.
      await context.addCookies(
        [CONTROL_PORT, EXPERIMENT_PORT].flatMap((port) =>
          ["o365itpros", "luisfurushio"].map((subdomain) => ({
            name: "__profilin",
            value: "p=t,dp=t",
            url: `http://${subdomain}.localhost:${port}`,
          })),
        ),
      );
      await installRequestBlocking(context, ["/recaptcha/", "/cart_items_count"]);
      await context.addInitScript(() => {
        window.addEventListener(
          "DOMContentLoaded",
          () => {
            const footer = document.querySelector<HTMLElement>("#bullet-footer");
            if (footer) footer.hidden = true;
          },
          { once: true },
        );
      });
    },
    playwrightOptions: {
      browser: "chromium",
      args: ["--no-sandbox"],
      waitTimeout: 60_000,
      gotoParameters: { waitUntil: "domcontentloaded" },
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
    viewports: ["desktop", "phone"],
    numberOfMeasurements: 12,
    regressionThreshold: 50,
    pValueThreshold: 0.05,
    regressionThresholdStat: "estimator",
    samplingMode: "simultaneous",
    lighthouseConfig: LIGHTHOUSE_CONFIG,
  },

  audit: {
    lighthouseConfig: LIGHTHOUSE_CONFIG,
  },

  twinServers: {
    controlDir: process.env.SHAKAPERF_CONTROL_DIR || join(projectDir, "..", "gumroad-control"),
    experimentDir: process.env.SHAKAPERF_EXPERIMENT_DIR || projectDir,
    dockerBuildDir: ".",
    dockerfile: join(projectDir, "twin-servers/Dockerfile"),
    procfile: "twin-servers/Procfile",
    composeFile: "twin-servers/docker-compose.yml",
    ports: { control: CONTROL_PORT, experiment: EXPERIMENT_PORT },
    setupCommands: [
      {
        command: "/shakaperf-twin/setup-products",
        description: "Loading and seeding isolated product databases",
      },
    ],
  },
});
