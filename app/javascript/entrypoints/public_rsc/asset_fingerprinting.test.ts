import { rspack, type Configuration } from "@rspack/core";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { RSCRspackPlugin } from "react-on-rails-rsc/RspackPlugin";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const configPath = require.resolve("../../../../config/rspack/public_rsc.config.cjs");
const clientNodeRuntime = require.resolve("react-on-rails-rsc/client.node");
type RspackInjectionLoader = {
  _chunkName: string;
  _discoveredClientFiles: string[];
  default: (this: { cacheable: () => void; emitWarning: () => void }, source: string) => string;
};
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
    const loaded: Configuration[] = require(configPath);
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
const configs = loadConfigs("test");
const read = (path: string) => readFileSync(new URL(`../../../../${path}`, import.meta.url), "utf8");
const clientConfigSource = read("config/rspack/public_rsc/client.cjs");
const inertiaLayout = read("app/views/layouts/inertia.html.erb");
const pushAssetsScript = read("docker/web/push_assets_to_s3.sh");
const loadClientConfigWithEntries = (entry: Record<string, string | string[]>): Configuration => {
  const clientModule: { exports: Configuration } = { exports: {} };
  runInNewContext(clientConfigSource, {
    module: clientModule,
    require: (request: string) => {
      if (request === "shakapacker/rspack") {
        return {
          config: {},
          generateRspackConfig: () => ({ entry, module: {}, output: {}, plugins: [], resolve: {} }),
        };
      }
      if (request === "./common.cjs") {
        return {
          assetRule: {},
          baseResolve: {},
          createPlugins: () => [],
          createScriptRules: () => [],
          mode: "development",
          publicAssetPath: "/public-rsc/",
          publicAssetUrl: "/public-rsc/",
          publicOutputPath: "/tmp/public-rsc",
        };
      }
      throw new Error(`Unexpected require: ${request}`);
    },
  });
  return clientModule.exports;
};

describe("public RSC asset fingerprinting", () => {
  it.each([
    [{ BENCHMARK_HOST: "experiment.localhost", DEV_LANE_PORT: "3101" }, "http://experiment.localhost:3101/public-rsc/"],
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
      const manifest: {
        moduleLoading: { prefix: string };
        filePathToModuleMetadata: Record<string, { chunks: (string | number)[] }>;
      } = JSON.parse(readFileSync(join(output, "react-client-manifest.json"), "utf8"));
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

  it.each([
    ["production", "production", "production", "/assets/public-rsc/"],
    ["staging", "production", "production", "/assets/public-rsc/"],
    ["benchmark", "production", "production", "/public-rsc/"],
    ["test", "test", "development", "/public-rsc/"],
    ["development", "development", "development", "/public-rsc/"],
  ])(
    "uses %s Rails deployment paths with %s Node compilation",
    (railsEnvironment, nodeEnvironment, expectedMode, expectedPublicPath) => {
      const environmentConfigs = loadConfigs(railsEnvironment, nodeEnvironment);
      expect(environmentConfigs.map(({ mode }) => mode)).toEqual([expectedMode, expectedMode, expectedMode]);
      expect(environmentConfigs.find(({ name }) => name === "public-rsc-client")?.output?.publicPath).toBe(
        railsEnvironment === "benchmark" ? "http://gumroad.localhost:3000/public-rsc/" : expectedPublicPath,
      );
      const serverAssetPublicPaths = environmentConfigs
        .slice(1)
        .map(({ module }) =>
          module?.rules?.find((rule) => typeof rule === "object" && rule !== null && "generator" in rule),
        )
        .map((rule) => {
          if (!rule || typeof rule !== "object" || !("generator" in rule)) return undefined;
          const generator: unknown = rule.generator;
          if (!generator || typeof generator !== "object" || !("publicPath" in generator)) return undefined;
          return String(generator.publicPath);
        });
      expect(serverAssetPublicPaths).toEqual([expectedPublicPath, expectedPublicPath]);
    },
  );

  it("exports ordered, content-hashed client, server, and RSC bundles", () => {
    expect(configs.map(({ name }) => name)).toEqual(["public-rsc-client", "public-rsc-server", "public-rsc-rsc"]);
    expect(configs.map(({ dependencies }) => dependencies)).toEqual([
      undefined,
      ["public-rsc-client"],
      ["public-rsc-server"],
    ]);

    const clientEntries = Object.keys(configs[0]?.entry ?? {});
    expect(clientEntries).not.toContain("public_rsc_bootstrap");
    expect(clientEntries).not.toContain("product_rsc");
    expect(clientEntries).not.toContain("server-bundle");
    expect(configs.slice(1).map(({ entry }) => Object.keys(entry ?? {}))).toEqual([["server-bundle"], ["rsc-bundle"]]);

    const serverEntrypoints = configs.slice(1).map(({ entry }) => Object.values(entry ?? {})[0]);
    expect(
      serverEntrypoints.every((entry) => String(entry).endsWith("/app/javascript/packs/public_rsc/server-bundle.ts")),
    ).toBe(true);
    expect(configs[0]?.output).toMatchObject({
      filename: "[name].[contenthash:8].js",
      chunkFilename: "[name].[contenthash:8].js",
      clean: true,
    });
    expect(configs[1]?.resolve?.alias).toMatchObject({
      "@rails/activestorage$": expect.stringContaining("activestorage_server.js"),
    });
    expect(inertiaLayout).not.toContain('prepend_javascript_pack_tag "public_rsc_bootstrap"');
  });

  it("prepends the bootstrap to string and array generated entries", () => {
    const clientConfig = loadClientConfigWithEntries({
      public_rsc_bootstrap: "/packs/public_rsc_bootstrap.tsx",
      "generated/ArrayComponent": ["/generated/array-runtime.ts", "/generated/ArrayComponent.tsx"],
      "generated/StringComponent": "/generated/StringComponent.tsx",
      untouched: "/packs/untouched.ts",
      "server-bundle": "/packs/server-bundle.ts",
    });

    expect(clientConfig.entry).toEqual({
      "generated/ArrayComponent": [
        "/packs/public_rsc_bootstrap.tsx",
        "/generated/array-runtime.ts",
        "/generated/ArrayComponent.tsx",
      ],
      "generated/StringComponent": ["/packs/public_rsc_bootstrap.tsx", "/generated/StringComponent.tsx"],
      untouched: "/packs/untouched.ts",
    });
  });

  it("leaves discovered browser chunks for Flight while retaining server imports", () => {
    const rspackPluginPath = require.resolve("react-on-rails-rsc/RspackPlugin");
    const injectionLoader: RspackInjectionLoader = require(join(dirname(rspackPluginPath), "injection-loader.js"));
    const originalClientFiles = injectionLoader._discoveredClientFiles;
    const originalChunkName = injectionLoader._chunkName;

    try {
      injectionLoader._discoveredClientFiles = ["/virtual/DeferredClient.tsx"];
      injectionLoader._chunkName = "client[index]";
      const transformed = injectionLoader.default.call(
        { cacheable: () => undefined, emitWarning: () => undefined },
        "export const runtime = true;",
      );

      expect(transformed).toContain("if (globalThis.window === undefined) import(");
      expect(transformed).not.toMatch(/^import\(/mu);
      expect(transformed).toContain("export const runtime = true;");
    } finally {
      injectionLoader._discoveredClientFiles = originalClientFiles;
      injectionLoader._chunkName = originalChunkName;
    }
  });

  it("publishes server-only assets through the environment-specific public path", async () => {
    expect(pushAssetsScript).toContain("s3://${ASSETS_S3_BUCKET}/assets/public-rsc");
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
        const manifest: {
          "probe.js": string;
          entrypoints: { probe: { assets: { js: string[] } } };
        } = JSON.parse(readFileSync(join(publicOutput, "manifest.json"), "utf8"));
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
