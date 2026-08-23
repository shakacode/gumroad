import { abTest, type BeforeNavigateHook, type TestFnContext, waitUntilPageSettled } from "shaka-shared";

import { prepareShakaPerfNavigation } from "../../config/shakaperf/prepare-navigation";
import { SELLER_PROFILE, sellerProfileProductUrl, sellerProfileUrl } from "../../config/shakaperf/seller-profile-page";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const PROFILE_TO_PRODUCT_START = "shakaperf-profile-product-start";
const PROFILE_TO_PRODUCT_END = "shakaperf-profile-product-end";
const PRODUCT_TO_PROFILE_START = "shakaperf-product-profile-start";
const PRODUCT_TO_PROFILE_END = "shakaperf-product-profile-end";
const controlProfileUrl = sellerProfileUrl(CONTROL_PORT);
const experimentProfileUrl = sellerProfileUrl(EXPERIMENT_PORT);
const controlProductUrl = sellerProfileProductUrl(CONTROL_PORT);
const experimentProductUrl = sellerProfileProductUrl(EXPERIMENT_PORT);
type Page = TestFnContext["page"];

const waitForSellerProfile = async (page: Page) => {
  await page.getByRole("heading", { level: 2, name: "Microsoft 365 Lab", exact: true }).waitFor({ state: "visible" });
  await page.getByText(SELLER_PROFILE.firstProductName, { exact: true }).first().waitFor({ state: "visible" });
  await page.locator("main article").first().waitFor({ state: "visible" });
  await waitUntilPageSettled(page);
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

const warmProductBeforeProfileLanding: BeforeNavigateHook = async (context) => {
  await prepareShakaPerfNavigation(context);
  const warmupPage = await context.context.newPage();
  try {
    const productUrl = context.isControl ? controlProductUrl : experimentProductUrl;
    await warmupPage.goto(productUrl, { waitUntil: "domcontentloaded" });
    await waitForProfileProduct(warmupPage);
  } finally {
    await warmupPage.close();
  }
};

const warmNavigation =
  (
    destinationPath: string,
    waitForSource: (page: Page) => Promise<void>,
    waitForDestination: (page: Page) => Promise<void>,
  ): BeforeNavigateHook =>
  async (context) => {
    await prepareShakaPerfNavigation(context);
    const warmupPage = await context.context.newPage();
    try {
      await warmupPage.goto(context.url, { waitUntil: "domcontentloaded" });
      await waitForSource(warmupPage);
      await warmupPage.goto(new URL(destinationPath, context.url).href, { waitUntil: "domcontentloaded" });
      await waitForDestination(warmupPage);
    } finally {
      await warmupPage.close();
    }
  };

const warmPerfConfig = (beforeNavigate: BeforeNavigateHook) => ({
  shared: { beforeNavigate },
  perf: { lighthouseConfig: { disableStorageReset: true } },
});

const navigateFromProfileToProduct = async ({ page, annotate, isControl }: TestFnContext) => {
  await waitForSellerProfile(page);
  const expectedProductUrl = isControl ? controlProductUrl : experimentProductUrl;
  const productLink = page.locator(`a[href="${expectedProductUrl}"]`).first();
  await productLink.waitFor({ state: "visible" });

  await annotate(`Navigate from the seller profile to ${SELLER_PROFILE.firstProductName}`);
  await page.evaluate((mark: string) => performance.mark(mark), PROFILE_TO_PRODUCT_START);
  await Promise.all([page.waitForURL(expectedProductUrl, { waitUntil: "domcontentloaded" }), productLink.click()]);
  await waitForProfileProduct(page);
  await page.evaluate((mark: string) => performance.mark(mark), PROFILE_TO_PRODUCT_END);
};

const navigateFromProductToProfile = async ({ page, annotate, isControl }: TestFnContext) => {
  await waitForProfileProduct(page);
  const expectedProfileUrl = isControl ? controlProfileUrl : experimentProfileUrl;
  const sellerLink = page.getByRole("link", { name: SELLER_PROFILE.sellerName, exact: true }).first();
  await sellerLink.evaluate((element: Element) => element.removeAttribute("target"));

  await annotate("Navigate from the product to its seller profile");
  await page.evaluate((mark: string) => performance.mark(mark), PRODUCT_TO_PROFILE_START);
  await Promise.all([page.waitForURL(expectedProfileUrl, { waitUntil: "domcontentloaded" }), sellerLink.click()]);
  await waitForSellerProfile(page);
  await page.evaluate((mark: string) => performance.mark(mark), PRODUCT_TO_PROFILE_END);
};

abTest(
  "Seller profile cold landing performance: Inertia control vs React on Rails RSC",
  {
    startingPath: controlProfileUrl,
    experimentPathOverride: experimentProfileUrl,
    // testTypes: ["perf"],
  },
  async ({ page }) => waitForSellerProfile(page),
);

abTest(
  "Seller profile warm landing performance: Inertia control vs React on Rails RSC",
  {
    startingPath: controlProfileUrl,
    experimentPathOverride: experimentProfileUrl,
    // testTypes: ["perf"],
    config: warmPerfConfig(warmCurrentPage(waitForSellerProfile)),
  },
  async ({ page }) => waitForSellerProfile(page),
);

abTest(
  "Seller profile landing performance after ProductPage cache warmup: Inertia control vs React on Rails RSC",
  {
    startingPath: controlProfileUrl,
    experimentPathOverride: experimentProfileUrl,
    // testTypes: ["perf"],
    config: warmPerfConfig(warmProductBeforeProfileLanding),
  },
  async ({ page }) => waitForSellerProfile(page),
);

// abTest(
//   "Seller profile to product cold navigation performance",
//   {
//     startingPath: controlProfileUrl,
//     experimentPathOverride: experimentProfileUrl,
//     testTypes: ["perf"],
//     markers: [{ start: PROFILE_TO_PRODUCT_START, end: PROFILE_TO_PRODUCT_END, label: "profile-to-product navigation" }],
//   },
//   navigateFromProfileToProduct,
// );

// abTest(
//   "Seller profile to product warm navigation performance",
//   {
//     startingPath: controlProfileUrl,
//     experimentPathOverride: experimentProfileUrl,
//     testTypes: ["perf"],
//     markers: [{ start: PROFILE_TO_PRODUCT_START, end: PROFILE_TO_PRODUCT_END, label: "profile-to-product navigation" }],
//     config: warmPerfConfig(
//       warmNavigation(
//         `/l/${SELLER_PROFILE.firstProductPermalink}?layout=profile`,
//         waitForSellerProfile,
//         waitForProfileProduct,
//       ),
//     ),
//   },
//   navigateFromProfileToProduct,
// );

// abTest(
//   "Product to seller profile cold navigation performance",
//   {
//     startingPath: controlProductUrl,
//     experimentPathOverride: experimentProductUrl,
//     testTypes: ["perf"],
//     markers: [{ start: PRODUCT_TO_PROFILE_START, end: PRODUCT_TO_PROFILE_END, label: "product-to-profile navigation" }],
//   },
//   navigateFromProductToProfile,
// );

// abTest(
//   "Product to seller profile warm navigation performance",
//   {
//     startingPath: controlProductUrl,
//     experimentPathOverride: experimentProductUrl,
//     testTypes: ["perf"],
//     markers: [{ start: PRODUCT_TO_PROFILE_START, end: PRODUCT_TO_PROFILE_END, label: "product-to-profile navigation" }],
//     config: warmPerfConfig(warmNavigation("/", waitForProfileProduct, waitForSellerProfile)),
//   },
//   navigateFromProductToProfile,
// );
