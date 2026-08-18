import { abTest, waitForAllImages, waitForFontsReady, waitForNoMutations } from "shaka-shared";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const PRODUCT_PATH = "/l/bgfjk?layout=discover&recommended_by=search";
const controlUrl = `http://luisfurushio.localhost:${CONTROL_PORT}${PRODUCT_PATH}`;
const experimentUrl = `http://luisfurushio.localhost:${EXPERIMENT_PORT}${PRODUCT_PATH}`;

abTest(
  "v0.0 Residential Design product: Inertia control vs React on Rails RSC",
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
    await page
      .getByRole("heading", { level: 1, name: /Graphic Guide to Residential Design/u })
      .waitFor({ state: "visible" });
    await page.getByLabel("Product preview").waitFor({ state: "visible" });
    // Vite's development connection keeps the Inertia control from reaching
    // Playwright's networkidle state; the visual readiness checks still settle both sides.
    await Promise.all([waitForAllImages(page), waitForFontsReady(page), waitForNoMutations(page)]);
    await annotate(`Residential ${isControl ? "Inertia" : "RSC"} rendered`);
  },
);
