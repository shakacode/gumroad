import { abTest, type TestFnContext, waitForAllImages, waitForFontsReady, waitForNoMutations } from "shaka-shared";

import {
  P1_DISCOVER,
  p1DiscoverCategoryUrl,
  p1DiscoverProductUrl,
  p1DiscoverSearchUrl,
} from "../../config/shakaperf/p1-catalog";
import { prepareShakaPerfNavigation } from "../../config/shakaperf/prepare-navigation";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const PAGE_READY_TIMEOUT_MS = 60_000;
const controlCategoryUrl = p1DiscoverCategoryUrl(CONTROL_PORT);
const experimentCategoryUrl = p1DiscoverCategoryUrl(EXPERIMENT_PORT);
const controlSearchUrl = p1DiscoverSearchUrl(CONTROL_PORT);
const experimentSearchUrl = p1DiscoverSearchUrl(EXPERIMENT_PORT);
const controlProductUrl = p1DiscoverProductUrl(CONTROL_PORT);
const experimentProductUrl = p1DiscoverProductUrl(EXPERIMENT_PORT);
const RSC_DISCOVER_SELECTOR = '.js-react-on-rails-component[data-component-name="NativeDiscoverRscPage"]';
const RSC_PRODUCT_SELECTOR = '.js-react-on-rails-component[data-component-name="NativeProductRscPage"]';
type Page = TestFnContext["page"];

const assertDiscoverReady = async (page: Page, isControl: boolean, kind: "category" | "search") => {
  const expectedSelector = isControl ? "#app[data-page]" : RSC_DISCOVER_SELECTOR;
  const unexpectedSelector = isControl ? RSC_DISCOVER_SELECTOR : "#app[data-page]";
  await page.locator(expectedSelector).waitFor({ state: "attached", timeout: PAGE_READY_TIMEOUT_MS });
  if (await page.locator(unexpectedSelector).count()) {
    throw new Error(`Expected ${isControl ? "Inertia" : "React on Rails RSC"} Discover renderer only`);
  }
  await page.locator("main").waitFor({ state: "visible", timeout: PAGE_READY_TIMEOUT_MS });
  if (kind === "category") {
    await page
      .locator('a[aria-current="page"]', { hasText: P1_DISCOVER.categoryHeading })
      .waitFor({ state: "visible" });
  } else {
    await page
      .getByRole("heading", {
        level: 2,
        name: `Showing 1-${P1_DISCOVER.productCount} of ${P1_DISCOVER.productCount} products`,
        exact: true,
      })
      .waitFor({ state: "visible" });
  }
  await page.getByText(P1_DISCOVER.firstProductName, { exact: true }).first().waitFor({ state: "visible" });
  await page.getByText(P1_DISCOVER.lastProductName, { exact: true }).first().waitFor({ state: "visible" });
  const cardImages = page.locator("main article img");
  if ((await cardImages.count()) < P1_DISCOVER.productCount) {
    throw new Error(`Expected at least ${P1_DISCOVER.productCount} product-card images`);
  }
  const hasBelowFoldImage = await cardImages.evaluateAll((images: HTMLElement[]) =>
    images.some((image: HTMLElement) => image.getBoundingClientRect().top >= window.innerHeight),
  );
  if (!hasBelowFoldImage) throw new Error("Expected Discover product-card images below the fold");
  await Promise.all([waitForAllImages(page), waitForFontsReady(page), waitForNoMutations(page)]);
};

abTest(
  "v0.0 P1 Discover category cold landing: Inertia control vs React on Rails RSC",
  {
    startingPath: controlCategoryUrl,
    experimentPathOverride: experimentCategoryUrl,
    testTypes: ["visreg", "perf", "accessibility"],
    visregSelectors: ["main"],
  },
  async ({ page, annotate, isControl }) => {
    const expectedUrl = isControl ? controlCategoryUrl : experimentCategoryUrl;
    if (page.url() !== expectedUrl) {
      throw new Error(`Expected final URL ${expectedUrl}, received ${page.url()}; redirects are not allowed`);
    }
    await assertDiscoverReady(page, isControl, "category");
    await annotate(`P1 Discover category ${isControl ? "Inertia" : "React on Rails RSC"} cold landing rendered`);
  },
);

abTest(
  "v0.0 P1 Discover category warm landing: Inertia control vs React on Rails RSC",
  {
    startingPath: controlCategoryUrl,
    experimentPathOverride: experimentCategoryUrl,
    testTypes: ["visreg", "perf", "accessibility"],
    config: {
      shared: {
        beforeNavigate: async (context) => {
          await prepareShakaPerfNavigation(context);
          const warmupPage = await context.context.newPage();
          try {
            await warmupPage.goto(context.url, { waitUntil: "domcontentloaded" });
            await assertDiscoverReady(warmupPage, context.isControl, "category");
          } finally {
            await warmupPage.close();
          }
        },
      },
      perf: { lighthouseConfig: { disableStorageReset: true } },
    },
    visregSelectors: ["main"],
  },
  async ({ page, annotate, isControl }) => {
    const expectedUrl = isControl ? controlCategoryUrl : experimentCategoryUrl;
    if (page.url() !== expectedUrl) {
      throw new Error(`Expected final URL ${expectedUrl}, received ${page.url()}; redirects are not allowed`);
    }
    await assertDiscoverReady(page, isControl, "category");
    await annotate(`P1 Discover category ${isControl ? "Inertia" : "React on Rails RSC"} warm landing rendered`);
  },
);

abTest(
  "v0.0 P1 Discover search landing: Inertia control vs React on Rails RSC",
  {
    startingPath: controlSearchUrl,
    experimentPathOverride: experimentSearchUrl,
    testTypes: ["visreg", "perf", "accessibility"],
    visregSelectors: ["main"],
  },
  async ({ page, annotate, isControl }) => {
    const expectedUrl = isControl ? controlSearchUrl : experimentSearchUrl;
    if (page.url() !== expectedUrl) {
      throw new Error(`Expected final URL ${expectedUrl}, received ${page.url()}; redirects are not allowed`);
    }
    await assertDiscoverReady(page, isControl, "search");
    await annotate(`P1 Discover search ${isControl ? "Inertia" : "React on Rails RSC"} rendered`);
  },
);

const CATEGORY_TO_PRODUCT_START = "shakaperf-p1-discover-product-start";
const CATEGORY_TO_PRODUCT_END = "shakaperf-p1-discover-product-end";
abTest(
  "v0.0 P1 Discover category to product: full navigation to Inertia vs React on Rails RSC",
  {
    startingPath: controlCategoryUrl,
    experimentPathOverride: experimentCategoryUrl,
    testTypes: ["visreg", "perf", "accessibility"],
    visregSelectors: ["main"],
    markers: [
      { start: CATEGORY_TO_PRODUCT_START, end: CATEGORY_TO_PRODUCT_END, label: "discover-to-product navigation" },
    ],
  },
  async ({ page, annotate, isControl }) => {
    await assertDiscoverReady(page, isControl, "category");
    const expectedProductUrl = isControl ? controlProductUrl : experimentProductUrl;
    const productLink = page.locator(`a[href="${expectedProductUrl}"]`).first();
    await productLink.waitFor({ state: "visible", timeout: PAGE_READY_TIMEOUT_MS });
    const initialTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    await page.evaluate((mark: string) => performance.mark(mark), CATEGORY_TO_PRODUCT_START);
    await annotate("Navigate from Discover category to the first seeded product");
    await Promise.all([
      page.waitForURL(expectedProductUrl, { waitUntil: "domcontentloaded", timeout: PAGE_READY_TIMEOUT_MS }),
      productLink.click(),
    ]);
    await page
      .locator(isControl ? "#app[data-page]" : RSC_PRODUCT_SELECTOR)
      .waitFor({ state: "attached", timeout: PAGE_READY_TIMEOUT_MS });
    await page
      .getByRole("heading", { level: 1, name: P1_DISCOVER.firstProductName, exact: true })
      .waitFor({ state: "visible" });
    await Promise.all([waitForAllImages(page), waitForFontsReady(page), waitForNoMutations(page)]);
    await page.evaluate((mark: string) => performance.mark(mark), CATEGORY_TO_PRODUCT_END);
    const finalTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    if (finalTimeOrigin === initialTimeOrigin)
      throw new Error("Expected category-to-product navigation to replace the document");
  },
);
