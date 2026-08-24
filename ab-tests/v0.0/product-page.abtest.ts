import { abTest, type BeforeNavigateHook, type TestFnContext, waitUntilPageSettled } from "shaka-shared";

import { prepareShakaPerfNavigation } from "../../config/shakaperf/prepare-navigation";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
type Page = TestFnContext["page"];
type ProductFixture = {
  label: string;
  name: string | RegExp;
  controlUrl: string;
  experimentUrl: string;
  layout: "discover" | "profile";
};

const discoverLayoutProduct: ProductFixture = {
  label: "Discover-layout product",
  name: /Graphic Guide to Residential Design/u,
  controlUrl: `http://luisfurushio.localhost:${CONTROL_PORT}/l/bgfjk?layout=discover&recommended_by=search`,
  experimentUrl: `http://luisfurushio.localhost:${EXPERIMENT_PORT}/l/bgfjk?layout=discover&recommended_by=search`,
  layout: "discover",
};

const profileLayoutProduct: ProductFixture = {
  label: "Profile-layout product",
  name: /Graphic Guide to Residential Design/u,
  controlUrl: `http://luisfurushio.localhost:${CONTROL_PORT}/l/bgfjk?layout=profile&recommended_by=search`,
  experimentUrl: `http://luisfurushio.localhost:${EXPERIMENT_PORT}/l/bgfjk?layout=profile&recommended_by=search`,
  layout: "profile",
};

const discoverWarmupProduct: ProductFixture = {
  label: "Discover-layout warmup product",
  name: /Microsoft 365 for IT Pros \(2027 Edition\)/u,
  controlUrl: `http://o365itpros.localhost:${CONTROL_PORT}/l/O365IT?layout=discover&recommended_by=search`,
  experimentUrl: `http://o365itpros.localhost:${EXPERIMENT_PORT}/l/O365IT?layout=discover&recommended_by=search`,
  layout: "discover",
};

const discoverDestinationProduct: ProductFixture = {
  label: "Discover-layout destination product",
  name: "Microsoft 365 Core Guide (2027 Edition)",
  controlUrl: `http://o365itpros.localhost:${CONTROL_PORT}/l/M365Core?layout=discover&recommended_by=search`,
  experimentUrl: `http://o365itpros.localhost:${EXPERIMENT_PORT}/l/M365Core?layout=discover&recommended_by=search`,
  layout: "discover",
};

const waitForProduct = async (page: Page, fixture: ProductFixture) => {
  const product = page.locator("article");
  await product.getByRole("heading", { level: 1, name: fixture.name }).waitFor({ state: "visible" });
  await product.getByLabel("Product preview").waitFor({ state: "visible" });
  await product.getByRole("link", { name: "Add to cart", exact: true }).waitFor({ state: "visible" });
  if (fixture.layout === "profile") {
    await page.getByRole("link", { name: "Luis Furushio", exact: true }).first().waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Subscribe", exact: true }).waitFor({ state: "visible" });
  }
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

const warmPerfConfig = (beforeNavigate: BeforeNavigateHook) => ({
  shared: { beforeNavigate },
  perf: { lighthouseConfig: { disableStorageReset: true } },
});

abTest(
  `${discoverLayoutProduct.label} cold landing performance: Inertia control vs React on Rails RSC`,
  {
    startingPath: discoverLayoutProduct.controlUrl,
    experimentPathOverride: discoverLayoutProduct.experimentUrl,
    // testTypes: ["perf"],
  },
  async ({ page }) => waitForProduct(page, discoverLayoutProduct),
);

abTest(
  `${discoverLayoutProduct.label} warm landing performance: Inertia control vs React on Rails RSC`,
  {
    startingPath: discoverLayoutProduct.controlUrl,
    experimentPathOverride: discoverLayoutProduct.experimentUrl,
    // testTypes: ["perf"],
    config: warmPerfConfig(warmCurrentProduct(discoverLayoutProduct)),
  },
  async ({ page }) => waitForProduct(page, discoverLayoutProduct),
);

abTest(
  `${profileLayoutProduct.label} cold landing performance: Inertia control vs React on Rails RSC`,
  {
    startingPath: profileLayoutProduct.controlUrl,
    experimentPathOverride: profileLayoutProduct.experimentUrl,
    // testTypes: ["perf"],
  },
  async ({ page }) => waitForProduct(page, profileLayoutProduct),
);

abTest(
  `${profileLayoutProduct.label} warm landing performance: Inertia control vs React on Rails RSC`,
  {
    startingPath: profileLayoutProduct.controlUrl,
    experimentPathOverride: profileLayoutProduct.experimentUrl,
    // testTypes: ["perf"],
    config: warmPerfConfig(warmCurrentProduct(profileLayoutProduct)),
  },
  async ({ page }) => waitForProduct(page, profileLayoutProduct),
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
