import { abTest, waitForAllImages, waitForFontsReady, waitForNoMutations } from "shaka-shared";

import {
  ADDITIONAL_SEEDED_NATIVE_PRODUCTS,
  seededProfileProductUrl,
  seededSellerUrl,
} from "../../config/shakaperf/seeded-native-products";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const product = ADDITIONAL_SEEDED_NATIVE_PRODUCTS.find(({ label }) => label === "Power Platform");

if (!product) throw new Error("Missing seeded Power Platform product");

const controlSellerUrl = seededSellerUrl(CONTROL_PORT);
const experimentSellerUrl = seededSellerUrl(EXPERIMENT_PORT);
const controlProductUrl = seededProfileProductUrl(product, CONTROL_PORT);
const experimentProductUrl = seededProfileProductUrl(product, EXPERIMENT_PORT);
const NAVIGATION_START_MARK = "shakaperf-seller-product-navigation-start";
const NAVIGATION_END_MARK = "shakaperf-seller-product-navigation-end";

abTest(
  "v0.0 Office 365 seller to product: Inertia navigation vs full document reload",
  {
    startingPath: controlSellerUrl,
    experimentPathOverride: experimentSellerUrl,
    testTypes: ["visreg", "perf", "accessibility"],
    visregSelectors: ["main"],
    markers: [{ start: NAVIGATION_START_MARK, end: NAVIGATION_END_MARK, label: "seller-to-product navigation" }],
  },
  async ({ page, annotate, isControl }) => {
    const expectedSellerUrl = isControl ? controlSellerUrl : experimentSellerUrl;
    const expectedProductUrl = isControl ? controlProductUrl : experimentProductUrl;
    if (page.url() !== expectedSellerUrl) {
      throw new Error(`Expected seller URL ${expectedSellerUrl}, received ${page.url()}; redirects are not allowed`);
    }

    await page.locator("#app[data-page]").waitFor({ state: "attached" });
    await page.getByRole("link", { name: "Office 365 for IT Pros", exact: true }).waitFor({ state: "visible" });

    const productLink = page.locator(`a[href="${expectedProductUrl}"]`).first();
    await productLink.waitFor({ state: "visible" });
    const initialTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    await page.evaluate((mark: string) => performance.mark(mark), NAVIGATION_START_MARK);
    await annotate(isControl ? "Navigate with Inertia" : "Navigate with a full document reload");
    if (isControl) {
      await Promise.all([page.waitForURL(expectedProductUrl, { waitUntil: "domcontentloaded" }), productLink.click()]);
    } else {
      await page.goto(expectedProductUrl, { waitUntil: "domcontentloaded" });
    }

    await page.locator("#app[data-page]").waitFor({ state: "attached" });
    if (await page.locator("#native-product-rsc-root").count()) {
      throw new Error("Profile-layout product navigation must remain on its existing Inertia renderer");
    }
    await page.locator("main").waitFor({ state: "visible" });
    await page.getByRole("heading", { level: 1, name: product.name, exact: true }).waitFor({ state: "visible" });
    await page.getByLabel("Product preview").waitFor({ state: "visible" });
    await page.locator('[itemprop="price"]:visible').first().waitFor({ state: "visible" });
    await Promise.all([waitForAllImages(page), waitForFontsReady(page), waitForNoMutations(page)]);
    await page.evaluate((mark: string) => performance.mark(mark), NAVIGATION_END_MARK);

    const finalTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    if (isControl ? finalTimeOrigin !== initialTimeOrigin : finalTimeOrigin === initialTimeOrigin) {
      throw new Error(`Expected ${isControl ? "Inertia to preserve" : "native navigation to replace"} the document`);
    }
    await annotate(`${isControl ? "Inertia" : "Full-reload"} profile product rendered`);
  },
);
