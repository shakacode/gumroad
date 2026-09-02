const path = require("path");
const { reactOnRailsProNodeRenderer, parseWorkersCount } = require("react-on-rails-pro-node-renderer");

// Pro 17.0's stable-only guard rejects this reviewed prerelease despite its aligned React 19.2 contract.
if (require("react-on-rails-rsc/package.json").version === "19.3.0-rc.0") {
  process.env.REACT_ON_RAILS_PRO_DISABLE_VERSION_CHECK ??= "1";
}

const { env } = process;
const configuredWorkersCount =
  parseWorkersCount(env.RENDERER_WORKERS_COUNT) ?? parseWorkersCount(env.NODE_RENDERER_CONCURRENCY);
const localRendererEnvironments = new Set(["development", "test"]);
const runtimeEnvironments = [env.RAILS_ENV, env.NODE_ENV].filter(Boolean);
const allowDefaultPassword =
  runtimeEnvironments.length === 0 || runtimeEnvironments.every((value) => localRendererEnvironments.has(value));
const rendererPassword = env.RENDERER_PASSWORD || (allowDefaultPassword ? "devPassword" : undefined);
const productionLikeRenderer = runtimeEnvironments.some((value) => !localRendererEnvironments.has(value));

if (!rendererPassword) {
  throw new Error("RENDERER_PASSWORD must be set outside development and test.");
}

const config = {
  serverBundleCachePath: path.resolve(__dirname, "../.node-renderer-bundles"),
  host: env.RENDERER_HOST || (productionLikeRenderer ? "0.0.0.0" : "localhost"),
  port: Number(env.RENDERER_PORT) || 3800,
  logLevel: env.RENDERER_LOG_LEVEL || "info",
  password: rendererPassword,
  workersCount: configuredWorkersCount ?? 3,
  supportModules: true,
  enableHealthEndpoints: true,
  additionalContext: { URL, AbortController, File, FormData },
  stubTimers: false,
  replayServerAsyncOperationLogs: true,
};

if (env.CI && configuredWorkersCount == null) {
  config.workersCount = 2;
}

reactOnRailsProNodeRenderer(config);
