import { createRequire } from "node:module";
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

const configs: RspackConfig[] = createRequire(import.meta.url)("../../../../config/rspack/public_rsc.config.cjs");

describe("public RSC asset fingerprinting", () => {
  it("exports the client, server, and RSC bundles through the compatibility entry", () => {
    expect(configs.map(({ name }) => name)).toEqual(["public-rsc-client", "public-rsc-server", "public-rsc-rsc"]);

    const clientEntries = Object.keys(configs[0]?.entry ?? {});
    expect(clientEntries).toContain("public_rsc_bootstrap");
    expect(clientEntries).not.toContain("product_rsc");
    expect(clientEntries).not.toContain("server-bundle");
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
});
