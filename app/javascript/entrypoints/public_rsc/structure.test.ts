import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const clientEntry = read("./client.tsx");
const serverEntry = read("./server.tsx");
const rspackCommonConfig = read("../../../../config/rspack/public_rsc/common.cjs");
const rspackCompatibilityConfig = read("../../../../config/rspack/public_rsc.config.cjs");

const roots = [
  {
    name: "ProductPage",
    module: "$app/components/Product/ProductPage",
    component: "../../components/Product/ProductPage.tsx",
    rails: "../../../../app/views/links/rsc_show.html.erb",
    client: false,
  },
  {
    name: "DiscoverPage",
    module: "$app/components/Discover/DiscoverPage",
    component: "../../components/Discover/DiscoverPage.tsx",
    rails: "../../../../app/controllers/discover_rsc_controller.rb",
    client: false,
  },
  {
    name: "ProfileRscCompatibilityPage",
    module: "$app/components/Profile/ProfileRscCompatibilityPage.client",
    component: "../../components/Profile/ProfileRscCompatibilityPage.client.tsx",
    rails: "../../../../app/controllers/profile_rsc_users_controller.rb",
    client: true,
  },
] as const;

describe("public RSC structure", () => {
  it.each(roots)("keeps $name aligned across Rails and React on Rails registration", (root) => {
    expect(clientEntry).toContain(`registerServerComponent("${root.name}");`);
    expect(serverEntry).toContain(`import ${root.name} from "${root.module}";`);
    expect(serverEntry).toContain(root.name);
    expect(read(root.rails)).toContain(`"${root.name}"`);
    expect(read(root.component).startsWith('"use client";')).toBe(root.client);
  });

  it("keeps only the Profile legacy compatibility import", () => {
    expect(read("../../components/Discover/DiscoverPage.tsx")).not.toContain("$app/pages/Discover/Index");
    expect(read("../../components/Profile/ProfileRscCompatibilityPage.client.tsx")).toContain("$app/pages/Users/Show");
  });

  it("keeps the Discover results client directive at the server boundary", () => {
    expect(read("../../components/Discover/DiscoverResults.client.tsx")).toMatch(/^"use client";/u);
    expect(read("../../components/Discover/DiscoverResultsCore.client.tsx")).not.toMatch(/^"use client";/u);
  });

  it("removes the temporary product_rsc application folder", () => {
    expect(existsSync(new URL("../../product_rsc", import.meta.url))).toBe(false);
  });

  it("discovers client boundaries recursively from the JavaScript source tree", () => {
    expect(rspackCommonConfig).toContain("{ directory: sourcePath, recursive: true, include: /\\.[cm]?[jt]sx?$/u }");
    expect(rspackCommonConfig).not.toContain("existsSync");
    roots.forEach(({ component }) => expect(rspackCommonConfig).not.toContain(component.split("/").at(-1)));
  });

  it("keeps the legacy Rspack entry as a minimal compatibility export", () => {
    expect(rspackCompatibilityConfig.trim()).toBe('module.exports = require("./public_rsc/index.cjs");');
  });
});
