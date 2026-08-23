import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

type RspackConfig = {
  entry?: Record<string, string | string[]>;
  name?: string;
  output?: {
    chunkFilename?: string;
    clean?: boolean;
    filename?: string;
  };
  plugins?: { constructor?: { name?: string } }[];
};

type RspackInjectionLoader = {
  _chunkName: string;
  _discoveredClientFiles: string[];
  default: (this: { cacheable: (cacheable: boolean) => void }, source: string) => string;
};

const configs: RspackConfig[] = createRequire(import.meta.url)("../../../../config/rspack/public_rsc.config.cjs");
const packageJson: {
  scripts: Record<string, string>;
} = JSON.parse(readFileSync(new URL("../../../../package.json", import.meta.url), "utf8"));
const productionDockerfile = readFileSync(new URL("../../../../docker/web/Dockerfile", import.meta.url), "utf8");
const testDockerfile = readFileSync(new URL("../../../../docker/web/Dockerfile.test", import.meta.url), "utf8");

describe("public RSC asset fingerprinting", () => {
  it("exports the client, server, and RSC bundles through the compatibility entry", () => {
    expect(configs.map(({ name }) => name)).toEqual(["public-rsc-client", "public-rsc-server", "public-rsc-rsc"]);

    const clientEntries = configs[0]?.entry ?? {};
    const generatedEntries = Object.entries(clientEntries).filter(([name]) => name.startsWith("generated/"));
    expect(Object.keys(clientEntries)).not.toContain("public_rsc_bootstrap");
    expect(generatedEntries.map(([name]) => name)).toContain("generated/DiscoverPage");
    expect(
      generatedEntries.every(([, entry]) =>
        entry[0]?.endsWith("/app/javascript/packs/public_rsc/public_rsc_bootstrap.tsx"),
      ),
    ).toBe(true);
    expect(Object.keys(clientEntries)).not.toContain("product_rsc");
    expect(Object.keys(clientEntries)).not.toContain("server-bundle");
    expect(configs.slice(1).map(({ entry }) => Object.keys(entry ?? {}))).toEqual([["server-bundle"], ["rsc-bundle"]]);

    const serverEntrypoints = configs.slice(1).map(({ entry }) => Object.values(entry ?? {}).flat()[0]);
    expect(
      serverEntrypoints.every((entry) => entry?.endsWith("/app/javascript/packs/public_rsc/server-bundle.ts")),
    ).toBe(true);
  });

  it("content-hashes the entry and every lazy client chunk", () => {
    const clientConfig = configs.find(({ name }) => name === "public-rsc-client");

    expect(clientConfig?.output).toMatchObject({
      filename: "[name].[contenthash:8].js",
      chunkFilename: "[name].[contenthash:8].js",
      clean: true,
    });
  });

  it("uses Shakapacker's manifest plugin for nested entrypoint assets", () => {
    const clientConfig = configs.find(({ name }) => name === "public-rsc-client");
    const pluginNames = clientConfig?.plugins?.map((plugin) => plugin.constructor?.name);

    expect(pluginNames).toContain("WebpackManifestPlugin");
    expect(pluginNames).not.toContain("PublicRscAssetManifestPlugin");
  });

  it("leaves discovered client chunks for Flight to load in the browser", () => {
    const require = createRequire(import.meta.url);
    const rspackPluginPath = require.resolve("react-on-rails-rsc/RspackPlugin");
    const injectionLoader: RspackInjectionLoader = require(join(dirname(rspackPluginPath), "injection-loader.js"));
    const originalClientFiles = injectionLoader._discoveredClientFiles;
    const originalChunkName = injectionLoader._chunkName;

    try {
      injectionLoader._discoveredClientFiles = ["/virtual/DeferredClient.tsx"];
      injectionLoader._chunkName = "client[index]";
      const transformed = injectionLoader.default.call({ cacheable: () => undefined }, "export const runtime = true;");

      expect(transformed).toContain('if (typeof window === "undefined") import(');
      expect(transformed).not.toMatch(/^import\(/mu);
    } finally {
      injectionLoader._discoveredClientFiles = originalClientFiles;
      injectionLoader._chunkName = originalChunkName;
    }
  });

  it("generates React on Rails packs before every public RSC compilation path", () => {
    expect(packageJson.scripts["generate:public-rsc-packs"]).toBe("bundle exec rake react_on_rails:generate_packs");
    expect(packageJson.scripts["build:public-rsc"]).toBe(
      "npm run generate:public-rsc-packs && rspack --config config/rspack/public_rsc.config.cjs",
    );
    expect(packageJson.scripts["build:public-rsc:test"]).toBe("RAILS_ENV=test NODE_ENV=test npm run build:public-rsc");
    expect(packageJson.scripts["watch:public-rsc"]).toBe(
      "npm run generate:public-rsc-packs && rspack --watch --config config/rspack/public_rsc.config.cjs",
    );
    expect(productionDockerfile.indexOf('ENV DATABASE_HOST="db"')).toBeLessThan(
      productionDockerfile.indexOf("npm run build:public-rsc"),
    );
    expect(testDockerfile.indexOf("ENV DATABASE_HOST=db_test")).toBeLessThan(
      testDockerfile.indexOf("npm run build:public-rsc:test"),
    );
  });
});
