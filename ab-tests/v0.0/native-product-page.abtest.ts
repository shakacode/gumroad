import { abTest, waitForAllImages, waitForFontsReady, waitForNoMutations } from "shaka-shared";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const PRODUCT_PATH = "/l/O365IT?layout=discover&recommended_by=search";
const controlUrl = `http://o365itpros.localhost:${CONTROL_PORT}${PRODUCT_PATH}`;
const experimentUrl = `http://o365itpros.localhost:${EXPERIMENT_PORT}${PRODUCT_PATH}`;
const RSC_PRODUCT_SELECTOR = '.js-react-on-rails-component[data-component-name="NativeProductRscPage"]';
const BUNDLE_PRODUCT_NAMES = [
  "Microsoft 365 Core Guide (2027 Edition)",
  "Automating Microsoft 365 with PowerShell (2027 edition)",
  "Microsoft Purview for IT Pros (2027 Edition)",
  "Power Platform for IT Pros (2027 Edition)",
] as const;

abTest(
  "v0.0 Microsoft 365 cold bundle product: Inertia control vs React on Rails RSC",
  {
    startingPath: controlUrl,
    experimentPathOverride: experimentUrl,
    testTypes: ["visreg", "perf", "accessibility"],
    visregSelectors: ["article"],
    config: { visreg: { mismatchThreshold: 0.5, maxNumDiffPixels: 4_000 } },
  },
  async ({ page, annotate, isControl }) => {
    const expectedUrl = isControl ? controlUrl : experimentUrl;
    if (page.url() !== expectedUrl) {
      throw new Error(`Expected final URL ${expectedUrl}, received ${page.url()}; redirects are not allowed`);
    }

    await page.locator(isControl ? "#app[data-page]" : RSC_PRODUCT_SELECTOR).waitFor({ state: "attached" });
    if (await page.locator(isControl ? RSC_PRODUCT_SELECTOR : "#app[data-page]").count()) {
      throw new Error(`Expected ${isControl ? "Inertia" : "React on Rails RSC"} renderer only`);
    }
    await page.locator("article").waitFor({ state: "visible", timeout: 60_000 });
    await page.getByRole("heading", { level: 1, name: /Microsoft 365 for IT Pros/u }).waitFor({ state: "visible" });
    await page.getByLabel("Product preview").waitFor({ state: "visible" });
    await page.locator('article [itemprop="price"]:visible').first().waitFor({ state: "visible" });
    await page.getByRole("heading", { level: 2, name: "This bundle contains...", exact: true }).waitFor();
    for (const name of BUNDLE_PRODUCT_NAMES) {
      await page.getByRole("heading", { level: 4, name, exact: true }).waitFor({ state: "visible" });
    }
    // Vite's development connection keeps the Inertia control from reaching
    // Playwright's networkidle state; the visual readiness checks still settle both sides.
    await Promise.all([waitForAllImages(page), waitForFontsReady(page), waitForNoMutations(page)]);
    await annotate(`Microsoft ${isControl ? "Inertia" : "RSC"} rendered`);
  },
);
