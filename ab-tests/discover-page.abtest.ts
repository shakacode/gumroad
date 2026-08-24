import { abTest, type BeforeNavigateHook, type TestFnContext, waitUntilPageSettled } from "shaka-shared";

import { prepareShakaPerfNavigation } from "../config/shakaperf/prepare-navigation";

const CATEGORY_NAME = "Programming";
const CATEGORY_PATH = "/software-development/programming";
const MARKETPLACE_SELECTOR = 'section:has(> div > [role="tablist"])';
export const DISCOVER_CARD_COUNTS = { marketplace: 22, programming: 16 } as const;
type Page = TestFnContext["page"];

const waitForStableMarketplace = async (page: Page) => {
  await page.locator(MARKETPLACE_SELECTOR).evaluate(async (element: HTMLElement) => {
    let previous = "";
    let stableFrames = 0;
    for (let attempt = 0; attempt < 60 && stableFrames < 3; attempt += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const rect = element.getBoundingClientRect();
      const current = `${rect.width}:${rect.height}`;
      stableFrames = current === previous ? stableFrames + 1 : 0;
      previous = current;
    }
    if (stableFrames < 3) throw new Error("Discover marketplace size did not settle within 60 animation frames");
  });
};

const waitForMarketplace = async (page: Page, expectedCardCount: number = DISCOVER_CARD_COUNTS.marketplace) => {
  const marketplace = page.locator(MARKETPLACE_SELECTOR);
  await marketplace.getByRole("heading", { level: 2, name: "On the market", exact: true }).waitFor({
    state: "visible",
  });
  await marketplace
    .locator("article")
    .nth(expectedCardCount - 1)
    .waitFor({ state: "visible" });
  await waitUntilPageSettled(page);
  await waitForStableMarketplace(page);
};

const waitForCategory = async (page: Page) => {
  await page
    .getByRole("link", { name: CATEGORY_NAME, exact: true })
    .and(page.locator('[aria-current="page"]'))
    .waitFor({ state: "visible" });
  await waitForMarketplace(page, DISCOVER_CARD_COUNTS.programming);
};

const warmCurrentPage =
  (waitUntilReady: (page: Page) => Promise<void>): BeforeNavigateHook =>
  async (context) => {
    await prepareShakaPerfNavigation(context);
    const page = await context.context.newPage();
    try {
      await page.goto(context.url, { waitUntil: "domcontentloaded" });
      await waitUntilReady(page);
    } finally {
      await page.close();
    }
  };

const warmPerfConfig = (beforeNavigate: BeforeNavigateHook) => ({
  shared: { beforeNavigate },
  perf: { lighthouseConfig: { disableStorageReset: true } },
});

abTest(
  "Discover Page - Marketplace cold landing",
  {
    startingPath: "/discover",
    testTypes: ["perf", "visreg", "accessibility", "audit"],
    visregSelectors: [MARKETPLACE_SELECTOR],
  },
  async ({ page }) => waitForMarketplace(page),
);

abTest(
  "Discover Page - Marketplace warm landing",
  {
    startingPath: "/discover",
    testTypes: ["perf", "audit"],
    config: warmPerfConfig(warmCurrentPage(waitForMarketplace)),
  },
  async ({ page }) => waitForMarketplace(page),
);

abTest(
  "Discover Page - Programming category cold landing",
  {
    startingPath: CATEGORY_PATH,
    testTypes: ["perf", "visreg", "accessibility", "audit"],
    visregSelectors: [MARKETPLACE_SELECTOR],
  },
  async ({ page }) => waitForCategory(page),
);

abTest(
  "Discover Page - Programming category warm landing",
  {
    startingPath: CATEGORY_PATH,
    testTypes: ["perf", "audit"],
    config: warmPerfConfig(warmCurrentPage(waitForCategory)),
  },
  async ({ page }) => waitForCategory(page),
);
