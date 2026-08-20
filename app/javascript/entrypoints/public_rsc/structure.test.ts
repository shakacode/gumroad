import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const clientEntry = read("./client.tsx");
const serverEntry = read("./server.tsx");
const rspackConfig = read("../../../../config/rspack/public_rsc.config.cjs");

const roots = [
  {
    name: "ProductPage",
    module: "$app/components/Product/ProductPage",
    component: "../../components/Product/ProductPage.tsx",
    rails: "../../../../app/views/links/rsc_show.html.erb",
  },
  {
    name: "DiscoverPage",
    module: "$app/components/Discover/DiscoverPage",
    component: "../../components/Discover/DiscoverPage.tsx",
    rails: "../../../../app/controllers/discover_rsc_controller.rb",
  },
  {
    name: "ProfileRscCompatibilityPage",
    module: "$app/components/Profile/ProfileRscCompatibilityPage.client",
    component: "../../components/Profile/ProfileRscCompatibilityPage.client.tsx",
    rails: "../../../../app/controllers/profile_rsc_users_controller.rb",
  },
] as const;

describe("public RSC structure", () => {
  it.each(roots)("keeps $name aligned across Rails and React on Rails registration", (root) => {
    expect(clientEntry).toContain(`registerServerComponent("${root.name}");`);
    expect(serverEntry).toContain(`import ${root.name} from "${root.module}";`);
    expect(serverEntry).toContain(root.name);
    expect(read(root.rails)).toContain(`"${root.name}"`);
    expect(read(root.component)).toMatch(/^"use client";/u);
  });

  it("preserves the Discover and Profile legacy compatibility imports", () => {
    expect(read("../../components/Discover/DiscoverPage.tsx")).toContain("$app/pages/Discover/Index");
    expect(read("../../components/Profile/ProfileRscCompatibilityPage.client.tsx")).toContain("$app/pages/Users/Show");
  });

  it("removes the temporary product_rsc application folder", () => {
    expect(existsSync(new URL("../../product_rsc", import.meta.url))).toBe(false);
  });

  it("discovers client boundaries recursively from the JavaScript source tree", () => {
    expect(rspackConfig).toContain("{ directory: sourcePath, recursive: true, include: /\\.[cm]?[jt]sx?$/u }");
    expect(rspackConfig).not.toContain("existsSync");
    roots.forEach(({ component }) => expect(rspackConfig).not.toContain(component.split("/").at(-1)));
  });
});
