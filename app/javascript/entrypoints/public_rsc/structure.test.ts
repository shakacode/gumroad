import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const clientEntry = read("./client.tsx");
const serverEntry = read("./server.tsx");
const rspackCommonConfig = read("../../../../config/rspack/public_rsc/common.cjs");
const rspackCompatibilityConfig = read("../../../../config/rspack/public_rsc.config.cjs");

describe("public RSC structure", () => {
  it("leaves browser and server root registration to generated packs", () => {
    expect(clientEntry).not.toContain("registerServerComponent");
    expect(serverEntry).not.toContain("registerServerComponent");
    expect(read("../../packs/public_rsc/public_rsc_bootstrap.tsx")).toBe(
      'import "$app/entrypoints/public_rsc/client";\n',
    );
    expect(read("../../packs/public_rsc/server-bundle.ts")).toContain("../generated/server-bundle-generated.js");
  });

  it("does not retain the temporary product RSC source folder", () => {
    expect(existsSync(new URL("../../product_rsc", import.meta.url))).toBe(false);
  });

  it("discovers client boundaries recursively from the JavaScript source tree", () => {
    expect(rspackCommonConfig).toContain("{ directory: sourcePath, recursive: true, include: /\\.[cm]?[jt]sx?$/u }");
    expect(rspackCommonConfig).not.toContain("existsSync");
  });

  it("keeps the legacy Rspack entry as a minimal compatibility export", () => {
    expect(rspackCompatibilityConfig.trim()).toBe('module.exports = require("./public_rsc/index.cjs");');
  });
});
