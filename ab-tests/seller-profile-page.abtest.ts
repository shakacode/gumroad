import { abTest, type BeforeNavigateHook, type TestFnContext, waitUntilPageSettled } from "shaka-shared";

import { prepareShakaPerfNavigation } from "../config/shakaperf/prepare-navigation";
import { SELLER_PROFILE, sellerProfileProductUrl, sellerProfileUrl } from "../config/shakaperf/seller-profile-page";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const controlProfileUrl = sellerProfileUrl(CONTROL_PORT);
const experimentProfileUrl = sellerProfileUrl(EXPERIMENT_PORT);
const controlProductUrl = sellerProfileProductUrl(CONTROL_PORT);
const experimentProductUrl = sellerProfileProductUrl(EXPERIMENT_PORT);
type Page = TestFnContext["page"];

const waitForStableMain = async (page: Page) => {
  await page.locator("main").evaluate(async (element: HTMLElement) => {
    let previous = "";
    let stableFrames = 0;
    for (let attempt = 0; attempt < 60 && stableFrames < 3; attempt += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const rect = element.getBoundingClientRect();
      const current = `${rect.width}:${rect.height}`;
      stableFrames = current === previous ? stableFrames + 1 : 0;
      previous = current;
    }
    if (stableFrames < 3) throw new Error("Seller profile size did not settle within 60 animation frames");
  });
};

const waitForSellerProfile = async (page: Page) => {
  await page.getByRole("heading", { level: 2, name: "Microsoft 365 Lab", exact: true }).waitFor({ state: "visible" });
  await page.getByText(SELLER_PROFILE.firstProductName, { exact: true }).first().waitFor({ state: "visible" });
  await page.locator("main article").first().waitFor({ state: "visible" });
  await waitUntilPageSettled(page);
  await waitForStableMain(page);
};

const waitForProfileProduct = async (page: Page) => {
  const product = page.locator("article");
  await product
    .getByRole("heading", { level: 1, name: SELLER_PROFILE.firstProductName, exact: true })
    .waitFor({ state: "visible" });
  await product.getByRole("link", { name: "Add to cart", exact: true }).waitFor({ state: "visible" });
  await product.locator('[itemprop="price"]:visible').first().waitFor({ state: "visible" });
  await waitUntilPageSettled(page);
};

const warmCurrentPage: BeforeNavigateHook = async (context) => {
  await prepareShakaPerfNavigation(context);
  const page = await context.context.newPage();
  try {
    await page.goto(context.url, { waitUntil: "domcontentloaded" });
    await waitForSellerProfile(page);
  } finally {
    await page.close();
  }
};

const warmProductBeforeProfileLanding: BeforeNavigateHook = async (context) => {
  await prepareShakaPerfNavigation(context);
  const page = await context.context.newPage();
  try {
    await page.goto(context.isControl ? controlProductUrl : experimentProductUrl, { waitUntil: "domcontentloaded" });
    await waitForProfileProduct(page);
  } finally {
    await page.close();
  }
};

const warmPerfConfig = (beforeNavigate: BeforeNavigateHook) => ({
  shared: { beforeNavigate },
  perf: { lighthouseConfig: { disableStorageReset: true } },
});

abTest(
  "Seller Profile - Cold landing",
  {
    startingPath: controlProfileUrl,
    experimentPathOverride: experimentProfileUrl,
    testTypes: ["perf", "visreg", "accessibility", "audit"],
    visregSelectors: ["main"],
  },
  async ({ page }) => waitForSellerProfile(page),
);

abTest(
  "Seller Profile - Warm landing",
  {
    startingPath: controlProfileUrl,
    experimentPathOverride: experimentProfileUrl,
    testTypes: ["perf", "audit"],
    config: warmPerfConfig(warmCurrentPage),
  },
  async ({ page }) => waitForSellerProfile(page),
);

abTest(
  "Seller Profile - Landing after product page warmup",
  {
    startingPath: controlProfileUrl,
    experimentPathOverride: experimentProfileUrl,
    testTypes: ["perf", "audit"],
    config: warmPerfConfig(warmProductBeforeProfileLanding),
  },
  async ({ page }) => waitForSellerProfile(page),
);
