import { rspack, type Configuration } from "@rspack/core";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const configPath = require.resolve("../../../../config/rspack/public_rsc.config.cjs");
const clientNodeRuntime = require.resolve("react-on-rails-rsc/client.node");
const loadConfigs = (environment: string): Configuration[] => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = environment;
  try {
    for (const path of Object.keys(require.cache))
      if (String(path).includes("/config/rspack/public_rsc")) Reflect.deleteProperty(require.cache, path);
    const loaded: Configuration[] = require(configPath);
    return loaded;
  } finally {
    process.env.NODE_ENV = previousEnvironment;
  }
};
const configs = loadConfigs("test");
const packageJson: { scripts: Record<string, string> } = require("../../../../package.json");
const read = (path: string) => readFileSync(new URL(`../../../../${path}`, import.meta.url), "utf8");
const productionDockerfile = read("docker/web/Dockerfile");
const testDockerfile = read("docker/web/Dockerfile.test");
const compileAssetsScript = read("docker/web/compile_assets.sh");
const previewCompile = read(".buildkite/scripts/compile_assets.sh");
const pushAssetsScript = read("docker/web/push_assets_to_s3.sh");
const previewCache = read(".buildkite/scripts/preview_asset_cache.sh");
const makefile = read("Makefile");

describe("public RSC asset fingerprinting", () => {
  it("exports ordered, content-hashed client, server, and RSC bundles", () => {
    expect(configs.map(({ name }) => name)).toEqual(["public-rsc-client", "public-rsc-server", "public-rsc-rsc"]);
    expect(configs.map(({ dependencies }) => dependencies)).toEqual([
      undefined,
      ["public-rsc-client"],
      ["public-rsc-server"],
    ]);

    const clientEntries = Object.keys(configs[0]?.entry ?? {});
    expect(clientEntries).toContain("public_rsc_bootstrap");
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
  });

  it("generates React on Rails packs before every public RSC compilation path", () => {
    expect(packageJson.scripts).toMatchObject({
      "generate:public-rsc-packs": "bundle exec rails js:export && bundle exec rake react_on_rails:generate_packs",
      "build:public-rsc": "npm run generate:public-rsc-packs && rspack --config config/rspack/public_rsc.config.cjs",
      "build:public-rsc:test": "RAILS_ENV=test NODE_ENV=test npm run build:public-rsc",
      "watch:public-rsc":
        "npm run generate:public-rsc-packs && rspack --watch --config config/rspack/public_rsc.config.cjs",
    });
    expect(productionDockerfile).toContain(
      "&& gosu app env DEVISE_SECRET_KEY=asset-build-only RENDERER_PASSWORD=asset-build-only REVISION=asset-build-only SECRET_KEY_BASE_DUMMY=1 RAILS_ENV=production NODE_ENV=production npm run build:public-rsc",
    );
    expect(productionDockerfile).not.toMatch(/^ENV.*(?:DEVISE_SECRET_KEY|RENDERER_PASSWORD|SECRET_KEY_BASE_DUMMY)/mu);
    expect(productionDockerfile).not.toContain("chmod -R 755 $APP_DIR");
    expect(productionDockerfile).toContain("COPY --chown=app:app . $APP_DIR/");
    expect(compileAssetsScript).toContain("npm run setup\nNODE_ENV=production npm run build:public-rsc");
    expect(previewCompile).toContain("rm -rf public/product-rsc ssr-generated && tar -xzf");
    expect(testDockerfile.indexOf("ENV DATABASE_HOST=db_test")).toBeLessThan(
      testDockerfile.indexOf("npm run build:public-rsc:test"),
    );
    expect(makefile.match(/RENDERER_PASSWORD=asset-build-only docker\/web\/compile_assets\.sh/gu)).toHaveLength(2);
    expect(previewCache).toMatch(
      /PREVIEW_ASSET_CACHE_VERSION="v2"[\s\S]*config\/rspack[\s\S]*public\/product-rsc ssr-generated/u,
    );
  });

  it("publishes server-only assets through the environment-specific public path", async () => {
    expect(pushAssetsScript).toContain("s3://${ASSETS_S3_BUCKET}/assets/product-rsc");
    const root = mkdtempSync(fileURLToPath(new URL("./.public-rsc-probe-", import.meta.url)));
    const source = join(root, "source");
    mkdirSync(source);
    writeFileSync(join(source, "client.js"), "export default true;");
    writeFileSync(
      join(source, "server.js"),
      `import ${JSON.stringify(clientNodeRuntime)}; import cover from "./cover.png"; export default cover;`,
    );
    writeFileSync(join(source, "boundary.tsx"), '"use client"; export default () => null;');
    writeFileSync(join(source, "cover.png"), Buffer.alloc(8193, 1));

    try {
      for (const [environment, publicPath] of [
        ["test", "/product-rsc/"],
        ["production", "/assets/product-rsc/"],
      ] as const) {
        const publicOutput = join(root, environment, "public/product-rsc");
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
        const serverManifest = readFileSync(join(privateOutput, "react-server-client-manifest.json"), "utf8");
        expect(serverManifest).toContain("server-bundle");
        expect(serverManifest).not.toContain("rsc-bundle");
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
