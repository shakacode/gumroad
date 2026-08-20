import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

type RspackConfig = {
  entry?: Record<string, string>;
  name?: string;
  output?: {
    chunkFilename?: string;
    clean?: boolean;
    filename?: string;
  };
};

const configs: RspackConfig[] = createRequire(import.meta.url)("../../../../config/rspack/public_rsc.config.cjs");

describe("public RSC asset fingerprinting", () => {
  it("exports the client, server, and RSC bundles through the compatibility entry", () => {
    expect(configs.map(({ name }) => name)).toEqual(["public-rsc-client", "public-rsc-server", "public-rsc-rsc"]);
    expect(configs.map(({ entry }) => Object.keys(entry ?? {}))).toEqual([
      ["product_rsc"],
      ["server-bundle"],
      ["rsc-bundle"],
    ]);
  });

  it("content-hashes the entry and every lazy client chunk", () => {
    const clientConfig = configs.find(({ name }) => name === "public-rsc-client");

    expect(clientConfig?.output).toMatchObject({
      filename: "[name].[contenthash:8].js",
      chunkFilename: "[name].[contenthash:8].js",
      clean: true,
    });
  });
});
