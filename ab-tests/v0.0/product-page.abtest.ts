import { abTest, type BeforeNavigateHook, type TestFnContext, waitUntilPageSettled } from "shaka-shared";

import { prepareShakaPerfNavigation } from "../../config/shakaperf/prepare-navigation";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
const PRODUCT_TO_SELLER_START = "shakaperf-product-seller-start";
const PRODUCT_TO_SELLER_END = "shakaperf-product-seller-end";
type Page = TestFnContext["page"];
type ProductFixture = {
  label: string;
  name: string | RegExp;
  controlUrl: string;
  experimentUrl: string;
  isSellerProfile: boolean;
};

const standardProduct: ProductFixture = {
  label: "Standard product",
  name: /Graphic Guide to Residential Design/u,
  controlUrl: `http://luisfurushio.localhost:${CONTROL_PORT}/l/bgfjk?layout=discover&recommended_by=search`,
  experimentUrl: `http://luisfurushio.localhost:${EXPERIMENT_PORT}/l/bgfjk?layout=discover&recommended_by=search`,
  isSellerProfile: false,
};

const sellerProfileProduct: ProductFixture = {
  label: "Seller profile product",
  name: /Graphic Guide to Residential Design/u,
  controlUrl: `http://luisfurushio.localhost:${CONTROL_PORT}/l/bgfjk?recommended_by=search`,
  experimentUrl: `http://luisfurushio.localhost:${EXPERIMENT_PORT}/l/bgfjk?recommended_by=search`,
  isSellerProfile: true,
};

const discoverWarmupProduct: ProductFixture = {
  label: "Discover-layout warmup product",
  name: /Microsoft 365 for IT Pros \(2027 Edition\)/u,
  controlUrl: `http://o365itpros.localhost:${CONTROL_PORT}/l/O365IT?layout=discover&recommended_by=search`,
  experimentUrl: `http://o365itpros.localhost:${EXPERIMENT_PORT}/l/O365IT?layout=discover&recommended_by=search`,
  isSellerProfile: false,
};

const discoverDestinationProduct: ProductFixture = {
  label: "Discover-layout destination product",
  name: "Microsoft 365 Core Guide (2027 Edition)",
  controlUrl: `http://o365itpros.localhost:${CONTROL_PORT}/l/M365Core?layout=discover&recommended_by=search`,
  experimentUrl: `http://o365itpros.localhost:${EXPERIMENT_PORT}/l/M365Core?layout=discover&recommended_by=search`,
  isSellerProfile: false,
};

const controlSellerUrl = `http://luisfurushio.localhost:${CONTROL_PORT}/?recommended_by=search`;
const experimentSellerUrl = `http://luisfurushio.localhost:${EXPERIMENT_PORT}/?recommended_by=search`;

const waitForProduct = async (page: Page, fixture: ProductFixture) => {
  const product = page.locator("article");
  await product.getByRole("heading", { level: 1, name: fixture.name }).waitFor({ state: "visible" });
  await product.getByLabel("Product preview").waitFor({ state: "visible" });
  await product
    .getByRole("link", { name: fixture.isSellerProfile ? "I want this!" : "Add to cart", exact: true })
    .waitFor({ state: "visible" });
  await waitUntilPageSettled(page);
};

const waitForSeller = async (page: Page) => {
  await page.getByRole("link", { name: "Luis Furushio", exact: true }).waitFor({ state: "visible" });
  await page
    .getByRole("link", { name: /Graphic Guide to Residential Design/u })
    .first()
    .waitFor({ state: "visible" });
  await waitUntilPageSettled(page);
};

const warmCurrentProduct =
  (fixture: ProductFixture): BeforeNavigateHook =>
  async (context) => {
    await prepareShakaPerfNavigation(context);
    const warmupPage = await context.context.newPage();
    try {
      await warmupPage.goto(context.url, { waitUntil: "domcontentloaded" });
      await waitForProduct(warmupPage, fixture);
    } finally {
      await warmupPage.close();
    }
  };

const warmProductBeforeLanding =
  (fixture: ProductFixture): BeforeNavigateHook =>
  async (context) => {
    await prepareShakaPerfNavigation(context);
    const warmupPage = await context.context.newPage();
    try {
      const warmupUrl = context.isControl ? fixture.controlUrl : fixture.experimentUrl;
      await warmupPage.goto(warmupUrl, { waitUntil: "domcontentloaded" });
      await waitForProduct(warmupPage, fixture);
    } finally {
      await warmupPage.close();
    }
  };

const warmProductToSeller: BeforeNavigateHook = async (context) => {
  await prepareShakaPerfNavigation(context);
  const warmupPage = await context.context.newPage();
  try {
    await warmupPage.goto(context.url, { waitUntil: "domcontentloaded" });
    await waitForProduct(warmupPage, standardProduct);
    const sellerUrl = context.isControl ? controlSellerUrl : experimentSellerUrl;
    await warmupPage.goto(sellerUrl, { waitUntil: "domcontentloaded" });
    await waitForSeller(warmupPage);
  } finally {
    await warmupPage.close();
  }
};

const warmPerfConfig = (beforeNavigate: BeforeNavigateHook) => ({
  shared: { beforeNavigate },
  perf: { lighthouseConfig: { disableStorageReset: true } },
});

abTest(
  `${standardProduct.label} cold landing performance: Inertia control vs React on Rails RSC`,
  {
    startingPath: standardProduct.controlUrl,
    experimentPathOverride: standardProduct.experimentUrl,
    // testTypes: ["perf"],
  },
  async ({ page }) => waitForProduct(page, standardProduct),
);

abTest(
  `${standardProduct.label} warm landing performance: Inertia control vs React on Rails RSC`,
  {
    startingPath: standardProduct.controlUrl,
    experimentPathOverride: standardProduct.experimentUrl,
    // testTypes: ["perf"],
    config: warmPerfConfig(warmCurrentProduct(standardProduct)),
  },
  async ({ page }) => waitForProduct(page, standardProduct),
);

abTest(
  `${sellerProfileProduct.label} cold landing performance: Inertia control vs React on Rails RSC`,
  {
    startingPath: sellerProfileProduct.controlUrl,
    experimentPathOverride: sellerProfileProduct.experimentUrl,
    // testTypes: ["perf"],
  },
  async ({ page }) => waitForProduct(page, sellerProfileProduct),
);

abTest(
  `${sellerProfileProduct.label} warm landing performance: Inertia control vs React on Rails RSC`,
  {
    startingPath: sellerProfileProduct.controlUrl,
    experimentPathOverride: sellerProfileProduct.experimentUrl,
    // testTypes: ["perf"],
    config: warmPerfConfig(warmCurrentProduct(sellerProfileProduct)),
  },
  async ({ page }) => waitForProduct(page, sellerProfileProduct),
);

abTest(
  "Product landing performance after a different discover-layout ProductPage cache warmup: Inertia control vs React on Rails RSC",
  {
    startingPath: discoverDestinationProduct.controlUrl,
    experimentPathOverride: discoverDestinationProduct.experimentUrl,
    // testTypes: ["perf"],
    config: warmPerfConfig(warmProductBeforeLanding(discoverWarmupProduct)),
  },
  async ({ page }) => waitForProduct(page, discoverDestinationProduct),
);

const navigateFromProductToSeller = async ({ page, annotate, isControl }: TestFnContext) => {
  await waitForProduct(page, standardProduct);
  const expectedSellerUrl = isControl ? controlSellerUrl : experimentSellerUrl;
  const sellerLink = page.getByRole("link", { name: "Luis Furushio", exact: true }).first();
  await sellerLink.evaluate((element: Element) => element.removeAttribute("target"));

  await annotate("Navigate from the product to its seller profile");
  await page.evaluate((mark: string) => performance.mark(mark), PRODUCT_TO_SELLER_START);
  await Promise.all([page.waitForURL(expectedSellerUrl, { waitUntil: "domcontentloaded" }), sellerLink.click()]);
  await waitForSeller(page);
  await page.evaluate((mark: string) => performance.mark(mark), PRODUCT_TO_SELLER_END);
};

// abTest(
//   "Product to seller cold navigation performance: Inertia control vs React on Rails RSC",
//   {
//     startingPath: standardProduct.controlUrl,
//     experimentPathOverride: standardProduct.experimentUrl,
//     testTypes: ["perf"],
//     markers: [{ start: PRODUCT_TO_SELLER_START, end: PRODUCT_TO_SELLER_END, label: "product-to-seller navigation" }],
//   },
//   navigateFromProductToSeller,
// );

// abTest(
//   "Product to seller warm navigation performance: Inertia control vs React on Rails RSC",
//   {
//     startingPath: standardProduct.controlUrl,
//     experimentPathOverride: standardProduct.experimentUrl,
//     testTypes: ["perf"],
//     markers: [{ start: PRODUCT_TO_SELLER_START, end: PRODUCT_TO_SELLER_END, label: "product-to-seller navigation" }],
//     config: warmPerfConfig(warmProductToSeller),
//   },
//   navigateFromProductToSeller,
// );
