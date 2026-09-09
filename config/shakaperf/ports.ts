import { assignPortsAutomatically } from "shaka-shared";

const pinnedControl = Number(process.env.SHAKAPERF_CONTROL_PORT);
const pinnedExperiment = Number(process.env.SHAKAPERF_EXPERIMENT_PORT);
const conductorBase = Number(process.env.CONDUCTOR_PORT);

// Resolve once so server URLs and navigation hooks use the same remembered pair.
export const benchmarkPorts =
  pinnedControl > 0 && pinnedExperiment > 0
    ? { control: pinnedControl, experiment: pinnedExperiment }
    : conductorBase > 0
      ? { control: conductorBase, experiment: conductorBase + 1 }
      : assignPortsAutomatically({ control: 3100, experiment: 3200 });
