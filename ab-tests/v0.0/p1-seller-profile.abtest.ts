import { abTest, type TestFnContext, waitForAllImages, waitForFontsReady, waitForNoMutations } from "shaka-shared";

import { P1_PROFILE, p1ProfileProductUrl, p1ProfileUrl } from "../../config/shakaperf/p1-catalog";
import { prepareShakaPerfNavigation } from "../../config/shakaperf/prepare-navigation";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const PAGE_READY_TIMEOUT_MS = 60_000;
const controlProfileUrl = p1ProfileUrl(CONTROL_PORT);
const experimentProfileUrl = p1ProfileUrl(EXPERIMENT_PORT);
const controlProductUrl = p1ProfileProductUrl(CONTROL_PORT);
const experimentProductUrl = p1ProfileProductUrl(EXPERIMENT_PORT);
const RSC_PROFILE_SELECTOR = '.js-react-on-rails-component[data-component-name="NativeProfileRscPage"]';
type Page = TestFnContext["page"];

const assertProfileReady = async (page: Page, isControl: boolean) => {
  const expectedSelector = isControl ? "#app[data-page]" : RSC_PROFILE_SELECTOR;
  const unexpectedSelector = isControl ? RSC_PROFILE_SELECTOR : "#app[data-page]";
  await page.locator(expectedSelector).waitFor({ state: "attached", timeout: PAGE_READY_TIMEOUT_MS });
  if (await page.locator(unexpectedSelector).count()) {
    throw new Error(`Expected ${isControl ? "Inertia" : "React on Rails RSC"} profile renderer only`);
  }
  await page.locator("main").waitFor({ state: "visible", timeout: PAGE_READY_TIMEOUT_MS });
  await page.getByRole("link", { name: P1_PROFILE.sellerName, exact: true }).waitFor({ state: "visible" });
  await page.getByRole("heading", { level: 2, name: "Microsoft 365 Lab", exact: true }).waitFor({ state: "visible" });
  await page
    .getByText(`1-9 of ${P1_PROFILE.visibleProductCount} products`, { exact: true })
    .waitFor({ state: "visible" });
  await page.getByText(P1_PROFILE.firstProductName, { exact: true }).first().waitFor({ state: "visible" });
  const cardImages = page.locator("main article img");
  if ((await cardImages.count()) < 9) throw new Error("Expected at least nine product-card images");
  const hasBelowFoldImage = await cardImages.evaluateAll((images: HTMLElement[]) =>
    images.some((image: HTMLElement) => image.getBoundingClientRect().top >= window.innerHeight),
  );
  if (!hasBelowFoldImage) throw new Error("Expected product-card images below the fold");
  await Promise.all([waitForAllImages(page), waitForFontsReady(page), waitForNoMutations(page)]);
};

abTest(
  "v0.0 P1 seller profile cold landing: Inertia control vs React on Rails RSC",
  {
    startingPath: controlProfileUrl,
    experimentPathOverride: experimentProfileUrl,
    testTypes: ["visreg", "perf", "accessibility"],
    visregSelectors: ["main"],
  },
  async ({ page, annotate, isControl }) => {
    const expectedUrl = isControl ? controlProfileUrl : experimentProfileUrl;
    if (page.url() !== expectedUrl) {
      throw new Error(`Expected final URL ${expectedUrl}, received ${page.url()}; redirects are not allowed`);
    }
    await assertProfileReady(page, isControl);
    await annotate(`P1 seller profile ${isControl ? "Inertia" : "React on Rails RSC"} cold landing rendered`);
  },
);

abTest(
  "v0.0 P1 seller profile warm landing: Inertia control vs React on Rails RSC",
  {
    startingPath: controlProfileUrl,
    experimentPathOverride: experimentProfileUrl,
    testTypes: ["visreg", "perf", "accessibility"],
    config: {
      shared: {
        beforeNavigate: async (context) => {
          await prepareShakaPerfNavigation(context);
          const warmupPage = await context.context.newPage();
          try {
            await warmupPage.goto(context.url, { waitUntil: "domcontentloaded" });
            await assertProfileReady(warmupPage, context.isControl);
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
    const expectedUrl = isControl ? controlProfileUrl : experimentProfileUrl;
    if (page.url() !== expectedUrl) {
      throw new Error(`Expected final URL ${expectedUrl}, received ${page.url()}; redirects are not allowed`);
    }
    await assertProfileReady(page, isControl);
    await annotate(`P1 seller profile ${isControl ? "Inertia" : "React on Rails RSC"} warm landing rendered`);
  },
);

const PROFILE_TO_PRODUCT_START = "shakaperf-p1-profile-product-start";
const PROFILE_TO_PRODUCT_END = "shakaperf-p1-profile-product-end";
abTest(
  "v0.0 P1 seller profile to product: Inertia navigation vs full document reload",
  {
    startingPath: controlProfileUrl,
    experimentPathOverride: experimentProfileUrl,
    testTypes: ["visreg", "perf", "accessibility"],
    visregSelectors: ["main"],
    markers: [{ start: PROFILE_TO_PRODUCT_START, end: PROFILE_TO_PRODUCT_END, label: "profile-to-product navigation" }],
  },
  async ({ page, annotate, isControl }) => {
    await assertProfileReady(page, isControl);
    const expectedProductUrl = isControl ? controlProductUrl : experimentProductUrl;
    const productLink = page.locator(`a[href="${expectedProductUrl}"]`).first();
    await productLink.waitFor({ state: "visible", timeout: PAGE_READY_TIMEOUT_MS });
    const initialTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    await page.evaluate((mark: string) => performance.mark(mark), PROFILE_TO_PRODUCT_START);
    await annotate(
      isControl ? "Navigate from profile with Inertia" : "Navigate from profile with a full document reload",
    );
    if (isControl) {
      await Promise.all([
        page.waitForURL(expectedProductUrl, { waitUntil: "domcontentloaded", timeout: PAGE_READY_TIMEOUT_MS }),
        productLink.click(),
      ]);
    } else {
      await page.goto(expectedProductUrl, { waitUntil: "domcontentloaded" });
    }
    await page.locator("#app[data-page]").waitFor({ state: "attached", timeout: PAGE_READY_TIMEOUT_MS });
    await page
      .getByRole("heading", { level: 1, name: P1_PROFILE.firstProductName, exact: true })
      .waitFor({ state: "visible" });
    await Promise.all([waitForAllImages(page), waitForFontsReady(page), waitForNoMutations(page)]);
    await page.evaluate((mark: string) => performance.mark(mark), PROFILE_TO_PRODUCT_END);
    const finalTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    if (isControl ? finalTimeOrigin !== initialTimeOrigin : finalTimeOrigin === initialTimeOrigin) {
      throw new Error(`Expected ${isControl ? "Inertia to preserve" : "full navigation to replace"} the document`);
    }
  },
);

const PRODUCT_TO_PROFILE_START = "shakaperf-p1-product-profile-start";
const PRODUCT_TO_PROFILE_END = "shakaperf-p1-product-profile-end";
abTest(
  "v0.0 P1 product to seller profile: full navigation to Inertia vs React on Rails RSC",
  {
    startingPath: controlProductUrl,
    experimentPathOverride: experimentProductUrl,
    testTypes: ["visreg", "perf", "accessibility"],
    visregSelectors: ["main"],
    markers: [{ start: PRODUCT_TO_PROFILE_START, end: PRODUCT_TO_PROFILE_END, label: "product-to-profile navigation" }],
  },
  async ({ page, annotate, isControl }) => {
    const expectedProductUrl = isControl ? controlProductUrl : experimentProductUrl;
    const expectedProfileUrl = isControl ? controlProfileUrl : experimentProfileUrl;
    if (page.url() !== expectedProductUrl)
      throw new Error(`Expected product URL ${expectedProductUrl}, received ${page.url()}`);
    await page.locator("#app[data-page]").waitFor({ state: "attached", timeout: PAGE_READY_TIMEOUT_MS });
    await page
      .getByRole("heading", { level: 1, name: P1_PROFILE.firstProductName, exact: true })
      .waitFor({ state: "visible" });
    const sellerLink = page.getByRole("link", { name: P1_PROFILE.sellerName, exact: true }).first();
    await sellerLink.evaluate((element: Element) => element.removeAttribute("target"));
    const initialTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    await page.evaluate((mark: string) => performance.mark(mark), PRODUCT_TO_PROFILE_START);
    await annotate("Navigate from product to seller profile with a full document request");
    await Promise.all([
      page.waitForURL(expectedProfileUrl, { waitUntil: "domcontentloaded", timeout: PAGE_READY_TIMEOUT_MS }),
      sellerLink.click(),
    ]);
    await assertProfileReady(page, isControl);
    await page.evaluate((mark: string) => performance.mark(mark), PRODUCT_TO_PROFILE_END);
    const finalTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    if (finalTimeOrigin === initialTimeOrigin)
      throw new Error("Expected product-to-profile navigation to replace the document");
  },
);
