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
};

const standardProduct: ProductFixture = {
  label: "Standard product",
  name: /Graphic Guide to Residential Design/u,
  controlUrl: `http://luisfurushio.localhost:${CONTROL_PORT}/l/bgfjk?layout=discover&recommended_by=search`,
  experimentUrl: `http://luisfurushio.localhost:${EXPERIMENT_PORT}/l/bgfjk?layout=discover&recommended_by=search`,
};

const controlSellerUrl = `http://luisfurushio.localhost:${CONTROL_PORT}/?recommended_by=search`;
const experimentSellerUrl = `http://luisfurushio.localhost:${EXPERIMENT_PORT}/?recommended_by=search`;

const waitForProduct = async (page: Page, fixture: ProductFixture) => {
  const product = page.locator("article");
  await product.getByRole("heading", { level: 1, name: fixture.name }).waitFor({ state: "visible" });
  await product.getByLabel("Product preview").waitFor({ state: "visible" });
  await product.locator('[itemprop="price"]:visible').first().waitFor({ state: "visible" });
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
    testTypes: ["perf"],
  },
  async ({ page }) => waitForProduct(page, standardProduct),
);

abTest(
  `${standardProduct.label} warm landing performance: Inertia control vs React on Rails RSC`,
  {
    startingPath: standardProduct.controlUrl,
    experimentPathOverride: standardProduct.experimentUrl,
    testTypes: ["perf"],
    config: warmPerfConfig(warmCurrentProduct(standardProduct)),
  },
  async ({ page }) => waitForProduct(page, standardProduct),
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

abTest(
  "Product to seller cold navigation performance: Inertia control vs React on Rails RSC",
  {
    startingPath: standardProduct.controlUrl,
    experimentPathOverride: standardProduct.experimentUrl,
    testTypes: ["perf"],
    markers: [{ start: PRODUCT_TO_SELLER_START, end: PRODUCT_TO_SELLER_END, label: "product-to-seller navigation" }],
  },
  navigateFromProductToSeller,
);

abTest(
  "Product to seller warm navigation performance: Inertia control vs React on Rails RSC",
  {
    startingPath: standardProduct.controlUrl,
    experimentPathOverride: standardProduct.experimentUrl,
    testTypes: ["perf"],
    markers: [{ start: PRODUCT_TO_SELLER_START, end: PRODUCT_TO_SELLER_END, label: "product-to-seller navigation" }],
    config: warmPerfConfig(warmProductToSeller),
  },
  navigateFromProductToSeller,
);
