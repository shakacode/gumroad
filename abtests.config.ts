import { basename, join } from "node:path";
import { DESKTOP_VIEWPORT, PHONE_VIEWPORT, defineConfig } from "shaka-shared";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const projectDir = process.cwd();

export default defineConfig({
  shared: {
    controlURL: `http://localhost:${CONTROL_PORT}`,
    experimentURL: `http://localhost:${EXPERIMENT_PORT}`,
    viewportDefinitions: [DESKTOP_VIEWPORT, PHONE_VIEWPORT],
    viewports: ["desktop", "phone"],
    parallelism: 1,
    playwrightOptions: {
      browser: "chromium",
      args: ["--no-sandbox"],
      waitTimeout: 60_000,
    },
    browserConsole: { failOn: ["error"], allowList: [] },
  },
  twinServers: {
    controlDir: process.env.SHAKAPERF_CONTROL_DIR || join(projectDir, "..", `${basename(projectDir)}-control`),
    experimentDir: process.env.SHAKAPERF_EXPERIMENT_DIR || projectDir,
    dockerBuildDir: ".",
    dockerfile: "twin-servers/Dockerfile",
    procfile: "twin-servers/Procfile",
    composeFile: "twin-servers/docker-compose.yml",
    ports: { control: CONTROL_PORT, experiment: EXPERIMENT_PORT },
    setupCommands: [
      {
        command: "/shakaperf-twin/setup-database",
        description: "Resetting and normally seeding isolated databases",
      },
    ],
  },
});
