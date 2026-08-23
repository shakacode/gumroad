import { abTest, type BeforeNavigateHook, type TestFnContext, waitUntilPageSettled } from "shaka-shared";

import { prepareShakaPerfNavigation } from "../../config/shakaperf/prepare-navigation";

const CATEGORY_NAME = "Programming";
const CATEGORY_PATH = "/software-development/programming";
const MARKETPLACE_SELECTOR = 'section:has(> div > [role="tablist"])';
const NAVIGATION_START = "shakaperf-discover-category-start";
const NAVIGATION_END = "shakaperf-discover-category-end";
type Page = TestFnContext["page"];

const waitForMarketplace = async (page: Page) => {
  const marketplace = page.locator(MARKETPLACE_SELECTOR);
  await marketplace.getByRole("heading", { level: 2, name: "On the market", exact: true }).waitFor({
    state: "visible",
  });
  await marketplace.locator("article").first().waitFor({ state: "visible" });
  await waitUntilPageSettled(page);
};

const waitForCategory = async (page: Page) => {
  await page
    .getByRole("link", { name: CATEGORY_NAME, exact: true })
    .and(page.locator('[aria-current="page"]'))
    .waitFor({ state: "visible" });
  await waitForMarketplace(page);
};

const warmCurrentPage =
  (waitUntilReady: (page: Page) => Promise<void>): BeforeNavigateHook =>
  async (context) => {
    await prepareShakaPerfNavigation(context);
    const warmupPage = await context.context.newPage();
    try {
      await warmupPage.goto(context.url, { waitUntil: "domcontentloaded" });
      await waitUntilReady(warmupPage);
    } finally {
      await warmupPage.close();
    }
  };

const warmDiscoverNavigation: BeforeNavigateHook = async (context) => {
  await prepareShakaPerfNavigation(context);
  const warmupPage = await context.context.newPage();
  try {
    await warmupPage.goto(context.url, { waitUntil: "domcontentloaded" });
    await waitForMarketplace(warmupPage);
    await warmupPage.goto(new URL(CATEGORY_PATH, context.url).href, { waitUntil: "domcontentloaded" });
    await waitForCategory(warmupPage);
  } finally {
    await warmupPage.close();
  }
};

const warmPerfConfig = (beforeNavigate: BeforeNavigateHook) => ({
  shared: { beforeNavigate },
  perf: { lighthouseConfig: { disableStorageReset: true } },
});

const navigateToCategory = async ({ page, annotate }: TestFnContext) => {
  await waitForMarketplace(page);

  await page.getByRole("menuitem", { name: "Software Development", exact: true }).hover();
  const programming = page.getByRole("menuitem", { name: CATEGORY_NAME, exact: true });
  await programming.waitFor({ state: "visible" });
  await programming.click();

  const categoryLink = page.getByRole("menuitem", {
    name: `All ${CATEGORY_NAME}`,
    exact: true,
  });
  await categoryLink.waitFor({ state: "visible" });
  await annotate(`Navigate from Discover to the ${CATEGORY_NAME} category`);
  await page.evaluate((mark: string) => performance.mark(mark), NAVIGATION_START);
  await Promise.all([page.waitForURL(`**${CATEGORY_PATH}`, { waitUntil: "domcontentloaded" }), categoryLink.click()]);
  await waitForCategory(page);
  await page.evaluate((mark: string) => performance.mark(mark), NAVIGATION_END);
};

abTest(
  "Discover cold landing performance: Inertia control vs React on Rails RSC",
  {
    startingPath: "/discover",
    // testTypes: ["perf"],
  },
  async ({ page }) => waitForMarketplace(page),
);

abTest(
  "Discover warm landing performance: Inertia control vs React on Rails RSC",
  {
    startingPath: "/discover",
    // testTypes: ["perf"],
    config: warmPerfConfig(warmCurrentPage(waitForMarketplace)),
  },
  async ({ page }) => waitForMarketplace(page),
);

abTest(
  "Discover category cold landing performance: Inertia control vs React on Rails RSC",
  {
    startingPath: CATEGORY_PATH,
    // testTypes: ["perf"],
  },
  async ({ page }) => waitForCategory(page),
);

abTest(
  "Discover category warm landing performance: Inertia control vs React on Rails RSC",
  {
    startingPath: CATEGORY_PATH,
    // testTypes: ["perf"],
    config: warmPerfConfig(warmCurrentPage(waitForCategory)),
  },
  async ({ page }) => waitForCategory(page),
);

// abTest(
//   "Discover to category cold navigation performance: Inertia control vs React on Rails RSC",
//   {
//     startingPath: "/discover",
// testTypes: ["perf"],
//     markers: [{ start: NAVIGATION_START, end: NAVIGATION_END, label: "discover-to-category navigation" }],
//   },
//   navigateToCategory,
// );

// abTest(
//   "Discover to category warm navigation performance: Inertia control vs React on Rails RSC",
//   {
//     startingPath: "/discover",
//     testTypes: ["perf"],
//     markers: [{ start: NAVIGATION_START, end: NAVIGATION_END, label: "discover-to-category navigation" }],
//     config: warmPerfConfig(warmDiscoverNavigation),
//   },
//   navigateToCategory,
// );
