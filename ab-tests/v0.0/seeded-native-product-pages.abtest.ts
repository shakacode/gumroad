import { abTest, waitForAllImages, waitForFontsReady, waitForNoMutations } from "shaka-shared";

import {
  ADDITIONAL_SEEDED_NATIVE_PRODUCTS,
  seededDiscoverProductUrl,
} from "../../config/shakaperf/seeded-native-products";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);

for (const product of ADDITIONAL_SEEDED_NATIVE_PRODUCTS) {
  const controlUrl = seededDiscoverProductUrl(product, CONTROL_PORT);
  const experimentUrl = seededDiscoverProductUrl(product, EXPERIMENT_PORT);

  abTest(
    `v0.0 ${product.label} product: Inertia control vs React on Rails RSC`,
    {
      startingPath: controlUrl,
      experimentPathOverride: experimentUrl,
      testTypes: ["visreg", "perf", "accessibility"],
      visregSelectors: ["article"],
    },
    async ({ page, annotate, isControl }) => {
      const expectedUrl = isControl ? controlUrl : experimentUrl;
      if (page.url() !== expectedUrl) {
        throw new Error(`Expected final URL ${expectedUrl}, received ${page.url()}; redirects are not allowed`);
      }

      await page.locator(isControl ? "#app[data-page]" : "#native-product-rsc-root").waitFor({ state: "attached" });
      if (await page.locator(isControl ? "#native-product-rsc-root" : "#app[data-page]").count()) {
        throw new Error(`Expected ${isControl ? "Inertia" : "React on Rails RSC"} renderer only`);
      }

      await page.locator("article").waitFor({ state: "visible", timeout: 60_000 });
      await page.getByRole("heading", { level: 1, name: product.name, exact: true }).waitFor({ state: "visible" });
      await page.getByLabel("Product preview").waitFor({ state: "visible" });
      await page.locator('article [itemprop="price"]:visible').first().waitFor({ state: "visible" });
      await Promise.all([waitForAllImages(page), waitForFontsReady(page), waitForNoMutations(page)]);
      await annotate(`${product.label} ${isControl ? "Inertia" : "RSC"} rendered`);
    },
  );
}
