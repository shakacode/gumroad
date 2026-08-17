import { abTest, waitForAllImages, waitForFontsReady, waitForNoMutations } from "shaka-shared";

import {
  ADDITIONAL_SEEDED_NATIVE_PRODUCTS,
  seededDiscoverProductUrl,
} from "../../config/shakaperf/seeded-native-products";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const product = ADDITIONAL_SEEDED_NATIVE_PRODUCTS.find(({ label }) => label === "Power Platform");

if (!product) throw new Error("Missing seeded Power Platform product");

const controlUrl = seededDiscoverProductUrl(product, CONTROL_PORT);
const experimentUrl = seededDiscoverProductUrl(product, EXPERIMENT_PORT);

abTest(
  "v0.0 Seeded creator navigation: Inertia control vs React on Rails RSC",
  {
    startingPath: controlUrl,
    experimentPathOverride: experimentUrl,
    testTypes: ["visreg", "perf", "accessibility"],
  },
  async ({ page, annotate, isControl }) => {
    await page.locator(isControl ? "#app[data-page]" : "#native-product-rsc-root").waitFor({ state: "attached" });
    await page.getByRole("heading", { level: 1, name: product.name, exact: true }).waitFor({ state: "visible" });

    const creatorLink = page.getByRole("link", { name: "Office 365 for IT Pros", exact: true });
    // AuthorByline opens a new tab for buyers. Keep the same navigation in the
    // measured tab so ShakaPerf can capture its interaction timeline and result.
    await creatorLink.evaluate((element: Element) => element.removeAttribute("target"));
    const port = isControl ? CONTROL_PORT : EXPERIMENT_PORT;
    const expectedProfileUrl = `http://o365itpros.localhost:${port}/?recommended_by=search`;
    await Promise.all([page.waitForURL(expectedProfileUrl, { waitUntil: "domcontentloaded" }), creatorLink.click()]);

    await page.locator("main").waitFor({ state: "visible" });
    await page.getByRole("link", { name: product.name, exact: true }).waitFor({ state: "visible" });
    await Promise.all([waitForAllImages(page), waitForFontsReady(page), waitForNoMutations(page)]);
    await annotate(`${isControl ? "Inertia" : "RSC"} product navigated to its creator profile`);
  },
);
