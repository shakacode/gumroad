import { abTest, type BeforeNavigateHook, type TestFnContext, type TestType, waitUntilPageSettled } from "shaka-shared";

import { prepareShakaPerfNavigation } from "../config/shakaperf/prepare-navigation";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
type Page = TestFnContext["page"];
type ProductFixture = {
  name: string | RegExp;
  controlUrl: string;
  experimentUrl: string;
  purchaseLabel: "Add to cart" | "I want this!";
};

const standardProduct: ProductFixture = {
  name: /Graphic Guide to Residential Design/u,
  controlUrl: `http://luisfurushio.localhost:${CONTROL_PORT}/l/bgfjk?layout=discover&recommended_by=search`,
  experimentUrl: `http://luisfurushio.localhost:${EXPERIMENT_PORT}/l/bgfjk?layout=discover&recommended_by=search`,
  purchaseLabel: "Add to cart",
};

const sellerProfileProduct: ProductFixture = {
  name: /Graphic Guide to Residential Design/u,
  controlUrl: `http://luisfurushio.localhost:${CONTROL_PORT}/l/bgfjk?recommended_by=search`,
  experimentUrl: `http://luisfurushio.localhost:${EXPERIMENT_PORT}/l/bgfjk?recommended_by=search`,
  purchaseLabel: "I want this!",
};

const discoverWarmupProduct: ProductFixture = {
  name: /Microsoft 365 for IT Pros \(2027 Edition\)/u,
  controlUrl: `http://o365itpros.localhost:${CONTROL_PORT}/l/O365IT?layout=discover&recommended_by=search`,
  experimentUrl: `http://o365itpros.localhost:${EXPERIMENT_PORT}/l/O365IT?layout=discover&recommended_by=search`,
  purchaseLabel: "Add to cart",
};

const discoverDestinationProduct: ProductFixture = {
  name: "Microsoft 365 Core Guide (2027 Edition)",
  controlUrl: `http://o365itpros.localhost:${CONTROL_PORT}/l/M365Core?layout=discover&recommended_by=search`,
  experimentUrl: `http://o365itpros.localhost:${EXPERIMENT_PORT}/l/M365Core?layout=discover&recommended_by=search`,
  purchaseLabel: "Add to cart",
};

const waitForStableSize = async (page: Page, selector: string) => {
  await page.locator(selector).evaluate(async (element: HTMLElement) => {
    let previous = "";
    let stableFrames = 0;
    for (let attempt = 0; attempt < 60 && stableFrames < 3; attempt += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const rect = element.getBoundingClientRect();
      const current = `${rect.width}:${rect.height}`;
      stableFrames = current === previous ? stableFrames + 1 : 0;
      previous = current;
    }
    if (stableFrames < 3) throw new Error("Product article size did not settle within 60 animation frames");
  });
};

const waitForProduct = async (page: Page, fixture: ProductFixture) => {
  const product = page.locator("article");
  await product.getByRole("heading", { level: 1, name: fixture.name }).waitFor({ state: "visible" });
  await product.getByLabel("Product preview").waitFor({ state: "visible" });
  await product.getByRole("link", { name: fixture.purchaseLabel, exact: true }).waitFor({ state: "visible" });
  await waitUntilPageSettled(page);
  await waitForStableSize(page, "article");
};

const warmCurrentProduct =
  (fixture: ProductFixture): BeforeNavigateHook =>
  async (context) => {
    await prepareShakaPerfNavigation(context);
    const page = await context.context.newPage();
    try {
      await page.goto(context.url, { waitUntil: "domcontentloaded" });
      await waitForProduct(page, fixture);
    } finally {
      await page.close();
    }
  };

const warmProductBeforeLanding =
  (fixture: ProductFixture): BeforeNavigateHook =>
  async (context) => {
    await prepareShakaPerfNavigation(context);
    const page = await context.context.newPage();
    try {
      await page.goto(context.isControl ? fixture.controlUrl : fixture.experimentUrl, {
        waitUntil: "domcontentloaded",
      });
      await waitForProduct(page, fixture);
    } finally {
      await page.close();
    }
  };

const warmPerfConfig = (beforeNavigate: BeforeNavigateHook) => ({
  shared: { beforeNavigate },
  perf: { lighthouseConfig: { disableStorageReset: true } },
});

const landingCoverage: { testTypes: TestType[]; visregSelectors: string[] } = {
  testTypes: ["perf", "visreg", "accessibility", "audit"],
  visregSelectors: ["article"],
};

abTest(
  "Product Page - Discover layout cold landing",
  {
    startingPath: standardProduct.controlUrl,
    experimentPathOverride: standardProduct.experimentUrl,
    ...landingCoverage,
  },
  async ({ page }) => waitForProduct(page, standardProduct),
);

abTest(
  "Product Page - Discover layout warm landing",
  {
    startingPath: standardProduct.controlUrl,
    experimentPathOverride: standardProduct.experimentUrl,
    testTypes: ["perf", "audit"],
    config: warmPerfConfig(warmCurrentProduct(standardProduct)),
  },
  async ({ page }) => waitForProduct(page, standardProduct),
);

abTest(
  "Product Page - Profile layout cold landing",
  {
    startingPath: sellerProfileProduct.controlUrl,
    experimentPathOverride: sellerProfileProduct.experimentUrl,
    ...landingCoverage,
  },
  async ({ page }) => waitForProduct(page, sellerProfileProduct),
);

abTest(
  "Product Page - Profile layout warm landing",
  {
    startingPath: sellerProfileProduct.controlUrl,
    experimentPathOverride: sellerProfileProduct.experimentUrl,
    testTypes: ["perf", "audit"],
    config: warmPerfConfig(warmCurrentProduct(sellerProfileProduct)),
  },
  async ({ page }) => waitForProduct(page, sellerProfileProduct),
);

abTest(
  "Product Page - Discover layout landing after different product warmup",
  {
    startingPath: discoverDestinationProduct.controlUrl,
    experimentPathOverride: discoverDestinationProduct.experimentUrl,
    testTypes: ["perf", "audit"],
    config: warmPerfConfig(warmProductBeforeLanding(discoverWarmupProduct)),
  },
  async ({ page }) => waitForProduct(page, discoverDestinationProduct),
);
