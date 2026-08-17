import { abTest, waitForAllImages, waitForFontsReady, waitForNoMutations } from "shaka-shared";

import { ADDITIONAL_SEEDED_NATIVE_PRODUCTS, seededSellerUrl } from "../../config/shakaperf/seeded-native-products";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const SELLER_NAME = "Office 365 for IT Pros";
const PRIMARY_PRODUCT_NAME = "Microsoft 365 for IT Pros (2027 Edition). The Ultimate Guide to Managing Microsoft 365.";
const controlUrl = seededSellerUrl(CONTROL_PORT);
const experimentUrl = seededSellerUrl(EXPERIMENT_PORT);

abTest(
  "v0.0 Office 365 seller page: control vs migration branch",
  {
    startingPath: controlUrl,
    experimentPathOverride: experimentUrl,
    testTypes: ["visreg", "perf", "accessibility"],
    visregSelectors: ["main"],
  },
  async ({ page, annotate, isControl }) => {
    const expectedUrl = isControl ? controlUrl : experimentUrl;
    if (page.url() !== expectedUrl) {
      throw new Error(`Expected final URL ${expectedUrl}, received ${page.url()}; redirects are not allowed`);
    }

    await page.locator("#app[data-page]").waitFor({ state: "attached" });
    if (await page.locator("#native-product-rsc-root").count()) {
      throw new Error("Seller pages must remain on their existing Inertia renderer");
    }

    await page.locator("main").waitFor({ state: "visible" });
    await page.getByRole("heading", { level: 1, name: SELLER_NAME, exact: true }).waitFor({ state: "visible" });
    for (const productName of [PRIMARY_PRODUCT_NAME, ...ADDITIONAL_SEEDED_NATIVE_PRODUCTS.map(({ name }) => name)]) {
      await page.getByText(productName, { exact: true }).first().waitFor({ state: "visible" });
    }
    await Promise.all([waitForAllImages(page), waitForFontsReady(page), waitForNoMutations(page)]);
    await annotate(`${isControl ? "Control" : "Migration branch"} seller page rendered`);
  },
);
