import { abTest, waitForAllImages, waitForFontsReady, waitForNoMutations } from "shaka-shared";

import { prepareShakaPerfNavigation } from "../../config/shakaperf/prepare-navigation";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const PRODUCT_PATH = "/l/bgfjk?layout=discover&recommended_by=search";
const controlUrl = `http://luisfurushio.localhost:${CONTROL_PORT}${PRODUCT_PATH}`;
const experimentUrl = `http://luisfurushio.localhost:${EXPERIMENT_PORT}${PRODUCT_PATH}`;
const RSC_PRODUCT_SELECTOR = '.js-react-on-rails-component[data-component-name="NativeProductRscPage"]';

const assertResidentialReady = async (page: Parameters<typeof waitForAllImages>[0], isControl: boolean) => {
  const expectedSelector = isControl ? "#app[data-page]" : RSC_PRODUCT_SELECTOR;
  const unexpectedSelector = isControl ? RSC_PRODUCT_SELECTOR : "#app[data-page]";
  await page.locator(expectedSelector).waitFor({ state: "attached" });
  if (await page.locator(unexpectedSelector).count()) {
    throw new Error(`Expected ${isControl ? "Inertia" : "React on Rails RSC"} renderer only`);
  }
  await page.locator("article").waitFor({ state: "visible", timeout: 60_000 });
  await page
    .getByRole("heading", { level: 1, name: /Graphic Guide to Residential Design/u })
    .waitFor({ state: "visible" });
  await page.getByLabel("Product preview").waitFor({ state: "visible" });
  await Promise.all([waitForAllImages(page), waitForFontsReady(page), waitForNoMutations(page)]);
};

abTest(
  "v0.0 Residential Design cold product: Inertia control vs React on Rails RSC",
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

    await assertResidentialReady(page, isControl);
    await annotate(`Residential ${isControl ? "Inertia" : "RSC"} rendered`);
  },
);

abTest(
  "v0.0 Residential Design warm product: Inertia control vs React on Rails RSC",
  {
    startingPath: controlUrl,
    experimentPathOverride: experimentUrl,
    testTypes: ["visreg", "perf", "accessibility"],
    config: {
      shared: {
        beforeNavigate: async (context) => {
          await prepareShakaPerfNavigation(context);
          const warmupPage = await context.context.newPage();
          try {
            await warmupPage.goto(context.url, { waitUntil: "domcontentloaded" });
            await assertResidentialReady(warmupPage, context.isControl);
          } finally {
            await warmupPage.close();
          }
        },
      },
      perf: {
        // ShakaPerf clears state before beforeNavigate; prevent Lighthouse from clearing the warmed HTTP cache afterward.
        lighthouseConfig: { disableStorageReset: true },
      },
    },
    visregSelectors: ["article"],
  },
  async ({ page, annotate, isControl }) => {
    const expectedUrl = isControl ? controlUrl : experimentUrl;
    if (page.url() !== expectedUrl) {
      throw new Error(`Expected final URL ${expectedUrl}, received ${page.url()}; redirects are not allowed`);
    }

    await assertResidentialReady(page, isControl);
    await annotate(`Residential ${isControl ? "Inertia" : "React on Rails RSC"} rendered w warm cache`);
  },
);
