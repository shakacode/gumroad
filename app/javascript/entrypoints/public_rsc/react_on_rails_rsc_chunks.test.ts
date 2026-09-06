import { rspack, type Configuration } from "@rspack/core";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { RSCRspackPlugin } from "react-on-rails-rsc/RspackPlugin";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const clientBrowserRuntime = require.resolve("react-on-rails-rsc/client.browser");

type ClientManifest = {
  filePathToModuleMetadata: Record<string, { chunks: (string | number)[] }>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isClientManifest = (value: unknown): value is ClientManifest =>
  isRecord(value) &&
  isRecord(value.filePathToModuleMetadata) &&
  Object.values(value.filePathToModuleMetadata).every(
    (metadata) =>
      isRecord(metadata) &&
      Array.isArray(metadata.chunks) &&
      metadata.chunks.every((chunk) => typeof chunk === "string" || typeof chunk === "number"),
  );

const compile = (config: Configuration) =>
  new Promise<void>((resolve, reject) =>
    rspack(config, (error, stats) =>
      error || !stats || stats.hasErrors()
        ? reject(error ?? new Error(stats?.toString({ all: false, errors: true })))
        : resolve(),
    ),
  );

describe("react-on-rails-rsc shared chunks", () => {
  it("allows Rspack to extract shared dependencies from generated client-reference chunks", async () => {
    const root = mkdtempSync(fileURLToPath(new URL("./.rsc-split-chunks-probe-", import.meta.url)));
    const source = join(root, "source");
    const output = join(root, "output");
    mkdirSync(source);
    writeFileSync(join(source, "entry.js"), `import ${JSON.stringify(clientBrowserRuntime)};`);
    writeFileSync(join(source, "shared.js"), `export const shared = ${JSON.stringify("shared".repeat(5_000))};`);
    for (const name of ["alpha", "beta"]) {
      writeFileSync(
        join(source, `${name}.js`),
        `"use client"; import { shared } from "./shared.js"; export const ${name} = () => shared;`,
      );
    }

    try {
      await compile({
        context: root,
        mode: "production",
        entry: { entry: join(source, "entry.js") },
        output: {
          path: output,
          filename: "[name].js",
          chunkFilename: "[name].js",
          publicPath: "/public-rsc/",
        },
        optimization: {
          minimize: false,
          splitChunks: { chunks: "all", minChunks: 2, minSize: 0 },
        },
        plugins: [
          new RSCRspackPlugin({
            isServer: false,
            clientReferences: [{ directory: source, recursive: true, include: /\.js$/u }],
          }),
        ],
        resolve: { modules: [join(process.cwd(), "node_modules"), "node_modules"] },
      });

      const manifest: unknown = JSON.parse(readFileSync(join(output, "react-client-manifest.json"), "utf8"));
      if (!isClientManifest(manifest)) throw new Error("Rspack emitted an invalid React client manifest");
      const clientReferences = Object.entries(manifest.filePathToModuleMetadata).filter(([path]) =>
        /\/(?:alpha|beta)\.js$/u.test(path),
      );
      expect(clientReferences).toHaveLength(2);
      const [alphaChunks, betaChunks] = clientReferences.map(([, metadata]) =>
        metadata.chunks.filter((_, index) => index % 2 === 1).map(String),
      );
      expect(alphaChunks).not.toEqual(betaChunks);
      expect(alphaChunks?.filter((chunk) => betaChunks?.includes(chunk))).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 120_000);
});
