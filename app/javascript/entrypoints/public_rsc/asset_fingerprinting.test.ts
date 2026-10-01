import { rspack, type Configuration } from "@rspack/core";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { RSCRspackPlugin } from "react-on-rails-rsc/RspackPlugin";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const configPath = require.resolve("../../../../config/rspack/public_rsc.config.cjs");
const clientNodeRuntime = require.resolve("react-on-rails-rsc/client.node");
const loadConfigs = (
  railsEnvironment: string,
  nodeEnvironment = railsEnvironment,
  benchmarkEnvironment: Record<string, string> = {},
): Configuration[] => {
  const benchmarkKeys = ["CUSTOM_DOMAIN", "BENCHMARK_HOST", "DEV_LANE_PORT", "BENCHMARK_PROTOCOL"];
  const previousBenchmarkEnvironment = benchmarkKeys.map((key) => {
    const value: unknown = Reflect.get(process.env, key);
    return [key, typeof value === "string" ? value : undefined] as const;
  });
  for (const key of benchmarkKeys) {
    if (benchmarkEnvironment[key] === undefined) Reflect.deleteProperty(process.env, key);
    else Reflect.set(process.env, key, benchmarkEnvironment[key]);
  }
  const previousNodeEnvironment = process.env.NODE_ENV;
  const hadRailsEnvironment = Object.prototype.hasOwnProperty.call(process.env, "RAILS_ENV");
  const previousRailsEnvironment = String(Reflect.get(process.env, "RAILS_ENV") ?? "");
  process.env.NODE_ENV = nodeEnvironment;
  Reflect.set(process.env, "RAILS_ENV", railsEnvironment);
  try {
    for (const path of Object.keys(require.cache))
      if (String(path).includes("/config/rspack/public_rsc")) Reflect.deleteProperty(require.cache, path);
    const loaded = require(configPath) as Configuration[]; // eslint-disable-line @typescript-eslint/consistent-type-assertions
    return loaded;
  } finally {
    for (const [key, value] of previousBenchmarkEnvironment) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
    process.env.NODE_ENV = previousNodeEnvironment;
    if (hadRailsEnvironment) Reflect.set(process.env, "RAILS_ENV", previousRailsEnvironment);
    else Reflect.deleteProperty(process.env, "RAILS_ENV");
  }
};
describe("public RSC asset fingerprinting", () => {
  it.each([
    [{ BENCHMARK_HOST: "experim.localhost", DEV_LANE_PORT: "3101" }, "http://experim.localhost:3101/public-rsc/"],
    [{ CUSTOM_DOMAIN: "rorp.example.com", BENCHMARK_PROTOCOL: "https" }, "https://rorp.example.com/public-rsc/"],
  ])("serializes the benchmark chunk origin for both SSR and the browser (%j)", async (environment, prefix) => {
    const root = mkdtempSync(fileURLToPath(new URL("./.public-rsc-prefix-probe-", import.meta.url)));
    const output = join(root, "output");
    const clientRuntime = require.resolve("react-on-rails-rsc/client.browser");
    writeFileSync(join(root, "entry.js"), `import ${JSON.stringify(clientRuntime)};`);
    writeFileSync(join(root, "client.js"), '"use client"; export const Client = () => "loaded";');
    try {
      const client = loadConfigs("benchmark", "production", environment)[0];
      await new Promise<void>((resolve, reject) =>
        rspack(
          {
            mode: "production",
            entry: join(root, "entry.js"),
            output: { ...client?.output, path: output },
            plugins: [
              new RSCRspackPlugin({
                isServer: false,
                clientReferences: [{ directory: root, include: /client\.js$/u }],
              }),
            ],
          },
          (error, stats) =>
            error || !stats || stats.hasErrors()
              ? reject(error ?? new Error(stats?.toString({ all: false, errors: true })))
              : resolve(),
        ),
      );
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const manifest = JSON.parse(readFileSync(join(output, "react-client-manifest.json"), "utf8")) as {
        moduleLoading: { prefix: string };
        filePathToModuleMetadata: Record<string, { chunks: (string | number)[] }>;
      };
      expect(manifest.moduleLoading.prefix).toBe(prefix);
      expect(client?.output?.publicPath).toBe(prefix);
      const chunks = Object.values(manifest.filePathToModuleMetadata).flatMap(({ chunks }) =>
        chunks.filter((_, index) => index % 2 === 1).map(String),
      );
      expect(chunks.length).toBeGreaterThan(0);
      for (const chunk of chunks) {
        expect(existsSync(join(output, chunk))).toBe(true);
        const hint = new URL(`${manifest.moduleLoading.prefix}${chunk}`, "https://seller.example.com/");
        expect(hint.href).toBe(`${prefix}${chunk}`);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("publishes server-only assets through the environment-specific public path", async () => {
    const root = mkdtempSync(fileURLToPath(new URL("./.public-rsc-probe-", import.meta.url)));
    const source = join(root, "source");
    mkdirSync(source);
    writeFileSync(join(source, "client.js"), "export default true;");
    writeFileSync(
      join(source, "server.js"),
      `import ${JSON.stringify(clientNodeRuntime)}; import cover from "./cover.png"; export default cover;`,
    );
    writeFileSync(join(source, "cover.png"), Buffer.alloc(8193, 1));

    try {
      for (const [environment, publicPath] of [
        ["test", "/public-rsc/"],
        ["production", "/assets/public-rsc/"],
      ] as const) {
        const publicOutput = join(root, environment, "public/public-rsc");
        const privateOutput = join(root, environment, "private");
        const probeConfigs: Configuration[] = loadConfigs(environment).map((config, index) => ({
          ...config,
          entry:
            index === 0
              ? { probe: join(source, "client.js") }
              : { [index === 1 ? "server-bundle" : "rsc-bundle"]: join(source, "server.js") },
          output: { ...config.output, path: index === 0 ? publicOutput : privateOutput },
        }));
        await new Promise<void>((resolve, reject) =>
          rspack(probeConfigs, (error, stats) =>
            error || !stats || stats.hasErrors()
              ? reject(error ?? new Error(stats?.toString({ all: false, errors: true })))
              : resolve(),
          ),
        );
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const manifest = JSON.parse(readFileSync(join(publicOutput, "manifest.json"), "utf8")) as {
          "probe.js": string;
          entrypoints: { probe: { assets: { js: string[] } } };
        };
        expect(manifest["probe.js"].startsWith(publicPath)).toBe(true);
        expect(manifest.entrypoints.probe.assets.js.every((asset) => asset.startsWith(publicPath))).toBe(true);
        const [asset] = readdirSync(join(publicOutput, "static"));
        expect(asset).toMatch(/^[\da-f]+\.png$/u);
        expect(
          ["server-bundle.js", "rsc-bundle.js"].every((bundle) =>
            readFileSync(join(privateOutput, bundle), "utf8").includes(`${publicPath}static/${asset}`),
          ),
        ).toBe(true);
        expect(existsSync(join(privateOutput, "static"))).toBe(false);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 120_000);
});
