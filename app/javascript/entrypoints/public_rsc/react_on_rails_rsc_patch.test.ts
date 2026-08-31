import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve("react-on-rails-rsc/package.json"));
const dependencyPackageJson: { version: string } = require("react-on-rails-rsc/package.json");
const injectionLoader = readFileSync(join(packageRoot, "dist/react-server-dom-rspack/injection-loader.js"), "utf8");
const rspackPlugin = readFileSync(join(packageRoot, "dist/react-server-dom-rspack/plugin.js"), "utf8");
const patch = readFileSync(
  new URL(`../../../../patches/react-on-rails-rsc+${dependencyPackageJson.version}.patch`, import.meta.url),
  "utf8",
);
const packageJson: { scripts: Record<string, string> } = JSON.parse(
  readFileSync(new URL("../../../../package.json", import.meta.url), "utf8"),
);
const deploymentDockerfiles = ["docker/web/Dockerfile", "twin-servers/Dockerfile"].map((path) =>
  readFileSync(new URL(`../../../../${path}`, import.meta.url), "utf8"),
);

describe("react-on-rails-rsc patch", () => {
  it("keeps generated boundaries lazy while allowing shared chunk extraction", () => {
    expect(injectionLoader).toContain('if (typeof window === "undefined") import(');
    expect(rspackPlugin).not.toContain("Prevent splitChunks from extracting modules");
    expect(rspackPlugin).not.toContain("guardedSplitChunks");
    expect(rspackPlugin).not.toContain("installSplitChunksGuard");
    expect(rspackPlugin).not.toContain("RSCRspackPlugin.splitChunksGuard");

    const changedFiles = [...patch.matchAll(/^diff --git a\/(.+) b\/(.+)$/gmu)].map(([, before, after]) => [
      before,
      after,
    ]);
    expect(changedFiles).toEqual([
      [
        "node_modules/react-on-rails-rsc/dist/react-server-dom-rspack/injection-loader.js",
        "node_modules/react-on-rails-rsc/dist/react-server-dom-rspack/injection-loader.js",
      ],
      [
        "node_modules/react-on-rails-rsc/dist/react-server-dom-rspack/plugin.js",
        "node_modules/react-on-rails-rsc/dist/react-server-dom-rspack/plugin.js",
      ],
    ]);
    expect(patch).not.toContain(".js.map");

    expect(packageJson.scripts.postinstall).toContain("patch-package");
    for (const dockerfile of deploymentDockerfiles) {
      const patchesCopyIndex = dockerfile.search(/^COPY .*patches.*$/mu);
      const npmInstallIndex = dockerfile.indexOf("npm ci");
      expect(patchesCopyIndex).toBeGreaterThanOrEqual(0);
      expect(npmInstallIndex).toBeGreaterThanOrEqual(0);
      expect(patchesCopyIndex).toBeLessThan(npmInstallIndex);
    }
  });
});
