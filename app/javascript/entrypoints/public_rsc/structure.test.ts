import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

const clientEntry = read("./client.tsx");
const serverEntry = read("./server.tsx");
const rspackCommonConfig = read("../../../../config/rspack/public_rsc/common.cjs");
const rspackCompatibilityConfig = read("../../../../config/rspack/public_rsc.config.cjs");
const inertiaLayout = read("../../../../app/views/layouts/inertia.html.erb");
const productView = read("../../../../app/views/links/rsc_show.html.erb");
const publicView = read("../../../../app/views/public_rsc/show.html.erb");

const roots = [
  {
    name: "ProductPage",
    module: "$app/components/Product/ProductPage",
    component: "../../components/Product/ProductPage.tsx",
    wrapper: "../../components/PublicPages/ror_components/ProductPage.tsx",
    rails: "../../../../app/views/links/rsc_show.html.erb",
    client: false,
  },
  {
    name: "DiscoverPage",
    module: "$app/components/Discover/DiscoverPage",
    component: "../../components/Discover/DiscoverPage.tsx",
    wrapper: "../../components/PublicPages/ror_components/DiscoverPage.tsx",
    rails: "../../../../app/controllers/discover_rsc_controller.rb",
    client: false,
  },
  {
    name: "ProfileRscCompatibilityPage",
    module: "$app/components/Profile/ProfileRscCompatibilityPage.client",
    component: "../../components/Profile/ProfileRscCompatibilityPage.client.tsx",
    wrapper: "../../components/PublicPages/ror_components/ProfileRscCompatibilityPage.tsx",
    rails: "../../../../app/controllers/profile_rsc_users_controller.rb",
    client: true,
  },
] as const;

describe("public RSC structure", () => {
  it.each(roots)("exposes $name through a server-classified autobundling wrapper", (root) => {
    const wrapper = read(root.wrapper);

    expect(wrapper).toBe(`export { default } from "${root.module}";\n`);
    expect(wrapper).not.toMatch(/^"use client";/u);
  });

  it.each(roots)("keeps $name aligned across Rails and React on Rails registration", (root) => {
    expect(read(root.rails)).toContain(`"${root.name}"`);
    expect(read(root.component).startsWith('"use client";')).toBe(root.client);
  });

  it("leaves browser and server root registration to the generated packs", () => {
    expect(clientEntry).not.toContain("registerServerComponent");
    expect(serverEntry).not.toContain("registerServerComponent");
    roots.forEach(({ name }) => {
      expect(clientEntry).not.toContain(name);
      expect(serverEntry).not.toContain(name);
    });
    expect(read("../../packs/public_rsc/public_rsc_bootstrap.tsx")).toBe(
      'import "$app/entrypoints/public_rsc/client";\n',
    );
  });

  it("queues autobundled roots in the views and flushes their packs once from the layout", () => {
    [productView, publicView].forEach((view) => {
      expect(view).not.toContain("product_rsc_javascript_path");
      expect(view).not.toContain("auto_load_bundle: false");
    });
    expect(inertiaLayout).not.toContain('prepend_javascript_pack_tag "public_rsc_bootstrap"');
    expect(inertiaLayout).toContain("stylesheet_pack_tag");
    expect(inertiaLayout).toContain("javascript_pack_tag");
    expect(inertiaLayout.match(/javascript_pack_tag/gu)).toHaveLength(1);
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
