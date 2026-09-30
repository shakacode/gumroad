import { assignPortsAutomatically } from "shaka-shared";

type PortEnvironmentVariable =
  | "SHAKAPERF_CONTROL_PORT"
  | "SHAKAPERF_EXPERIMENT_PORT"
  | "SHAKAPERF_CONTROL_S3_PORT"
  | "SHAKAPERF_EXPERIMENT_S3_PORT";

const resolvePorts = (
  controlEnv: PortEnvironmentVariable,
  experimentEnv: PortEnvironmentVariable,
  controlDefault: number,
  experimentDefault: number,
  key: string,
) => {
  const configuredControl = process.env[controlEnv];
  const configuredExperiment = process.env[experimentEnv];

  if (configuredControl || configuredExperiment) {
    if (!configuredControl || !configuredExperiment) {
      throw new Error(`${controlEnv} and ${experimentEnv} must be set together`);
    }

    const control = Number(configuredControl);
    const experiment = Number(configuredExperiment);
    if (
      !Number.isInteger(control) ||
      control <= 0 ||
      !Number.isInteger(experiment) ||
      experiment <= 0 ||
      control === experiment
    ) {
      throw new Error(`${controlEnv} and ${experimentEnv} must be distinct positive integer ports`);
    }
    return { control, experiment };
  }

  return assignPortsAutomatically({ control: controlDefault, experiment: experimentDefault, key });
};

const projectKey = process.cwd();

export const benchmarkPorts = resolvePorts(
  "SHAKAPERF_CONTROL_PORT",
  "SHAKAPERF_EXPERIMENT_PORT",
  3100,
  3200,
  projectKey,
);

export const benchmarkStoragePorts = resolvePorts(
  "SHAKAPERF_CONTROL_S3_PORT",
  "SHAKAPERF_EXPERIMENT_S3_PORT",
  9100,
  9101,
  `${projectKey}:storage`,
);

process.env.SHAKAPERF_CONTROL_PORT = String(benchmarkPorts.control);
process.env.SHAKAPERF_EXPERIMENT_PORT = String(benchmarkPorts.experiment);
process.env.SHAKAPERF_CONTROL_S3_PORT = String(benchmarkStoragePorts.control);
process.env.SHAKAPERF_EXPERIMENT_S3_PORT = String(benchmarkStoragePorts.experiment);
