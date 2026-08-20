import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

type RspackConfig = {
  name?: string;
  output?: {
    chunkFilename?: string;
    clean?: boolean;
    filename?: string;
  };
};

const configs: RspackConfig[] = createRequire(import.meta.url)("../../../config/rspack/product_rsc.config.cjs");

describe("public RSC asset fingerprinting", () => {
  it("content-hashes the entry and every lazy client chunk", () => {
    const clientConfig = configs.find(({ name }) => name === "public-rsc-client");

    expect(clientConfig?.output).toMatchObject({
      filename: "[name].[contenthash:8].js",
      chunkFilename: "[name].[contenthash:8].js",
      clean: true,
    });
  });
});
