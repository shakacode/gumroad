import {
  abTest,
  type BeforeNavigateHook,
  type TestFnContext,
  type TestType,
  waitUntilPageSettled,
  waitForAllImages,
  waitForFontsReady,
  waitForNoMutations,
} from "shaka-shared";

import { prepareShakaPerfNavigation } from "../config/shakaperf/prepare-navigation";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);
type Page = TestFnContext["page"];
type ProductFixture = {
  name: string | RegExp;
  controlUrl: string;
  experimentUrl: string;
  layout: "discover" | "profile";
};

const standardProduct: ProductFixture = {
  name: /Graphic Guide to Residential Design/u,
  controlUrl: `http://luisfurushio.control.localhost:${CONTROL_PORT}/l/bgfjk?layout=discover&recommended_by=search`,
  experimentUrl: `http://luisfurushio.experiment.localhost:${EXPERIMENT_PORT}/l/bgfjk?layout=discover&recommended_by=search`,
  layout: "discover",
};

const sellerProfileProduct: ProductFixture = {
  name: /Graphic Guide to Residential Design/u,
  controlUrl: `http://luisfurushio.control.localhost:${CONTROL_PORT}/l/bgfjk?layout=profile&recommended_by=search`,
  experimentUrl: `http://luisfurushio.experiment.localhost:${EXPERIMENT_PORT}/l/bgfjk?layout=profile&recommended_by=search`,
  layout: "profile",
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
  await product.getByRole("link", { name: "Add to cart", exact: true }).waitFor({ state: "visible" });
  if (fixture.layout === "profile") {
    await page.getByRole("link", { name: "Luis Furushio", exact: true }).first().waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Subscribe", exact: true }).waitFor({ state: "visible" });
  }
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

const warmPerfConfig = (beforeNavigate: BeforeNavigateHook) => ({
  shared: { beforeNavigate },
  perf: { lighthouseConfig: { disableStorageReset: true } },
  audit: { lighthouseConfig: { disableStorageReset: true } },
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

// The benchmark Rails launcher supplies a PayPal sandbox demo ID; this flow exercises card checkout only.
const profileCheckoutConfig: Parameters<typeof abTest>[1] = {
  startingPath: sellerProfileProduct.controlUrl,
  experimentPathOverride: sellerProfileProduct.experimentUrl,
  config: {
    shared: {
      viewports: ["phone"],
      beforeNavigate: async (context) => {
        await prepareShakaPerfNavigation(context);
        const checkoutOrigin = new URL(context.url);
        checkoutOrigin.hostname = checkoutOrigin.hostname.replace(/^luisfurushio\./u, "");
        await context.context.grantPermissions(["local-network-access"], { origin: checkoutOrigin.origin });
        await context.context.grantPermissions(["local-network-access"], { origin: new URL(context.url).origin });
        await context.context.route("**/braintree/client_token", (route) =>
          route.request().method() === "GET" ? route.fulfill({ json: { clientToken: null } }) : route.continue(),
        );
        await context.context.route(
          (url) => url.pathname === "/checkout",
          async (route) => {
            const request = route.request();
            if (request.method() !== "PATCH") return route.continue();
            const payload: unknown = request.postDataJSON();
            if (typeof payload !== "object" || payload === null || !("cart" in payload)) {
              throw new Error("Checkout save is missing its cart payload");
            }

            // Echo the cart locally; checkout's debounced save must not alter shared fixtures.
            await route.fulfill({
              json: {
                component: "Checkout/Show",
                props: { cart: payload.cart, flash: {} },
                url: new URL(request.url()).pathname,
                version: request.headers()["x-inertia-version"] ?? null,
              },
              headers: { "X-Inertia": "true" },
            });
          },
        );
      },
    },
  },
  ...landingCoverage,
  visregSelectors: ["[data-checkout-scope]"],
};

const completeProfileCheckout = async ({ page, annotate }: TestFnContext) => {
  const addToCart = page.locator("article").getByRole("link", { name: "Add to cart", exact: true });
  // The local SSR fixture can retain the default app origin after hydration.
  await addToCart.evaluate((link: HTMLAnchorElement) => {
    const url = new URL(link.href);
    if (url.origin === "http://gumroad.localhost:3000") {
      url.host = window.location.host.replace(/^luisfurushio\./u, "");
      link.href = url.href;
    }
  });
  await annotate("Add product to cart");
  await addToCart.click();
  const checkout = page.locator("[data-checkout-scope]");
  await checkout.getByRole("heading", { name: "Checkout", exact: true }).waitFor({ state: "visible" });
  const stripeKey = await page.locator('meta[property="stripe:pk"]').getAttribute("value");
  if (!stripeKey?.startsWith("pk_test_")) throw new Error("Checkout benchmark requires a Stripe test-mode key");
  await checkout.getByRole("link", { name: sellerProfileProduct.name }).first().waitFor({ state: "visible" });
  await checkout
    .frameLocator('iframe[title^="Secure card payment"]')
    .getByRole("textbox", { name: "Credit or debit card number", exact: true })
    .waitFor({ state: "visible" });
  // Stripe's background requests can outlive its ready card field.
  await Promise.all([waitForAllImages(page), waitForFontsReady(page), waitForNoMutations(page)]);
  // Axe otherwise reports the same Stripe issue as new/fixed because its iframe name is random.
  await checkout.locator('iframe[name^="cardButton"]').evaluateAll((frames) => {
    frames.forEach((frame, index) => {
      frame.id = `benchmark-stripe-card-button-${index}`;
    });
  });
  await waitForStableSize(page, "[data-checkout-scope]");
};

// Retained for comparison; this path lets Playwright scroll to the inline purchase link.
// abTest("Product Page - Profile layout add to cart", profileCheckoutConfig, completeProfileCheckout);

abTest(
  "Product Page - Profile layout sticky add to cart",
  {
    ...profileCheckoutConfig,
    config: {
      ...profileCheckoutConfig.config,
      perf: { viewports: ["phone"] },
      audit: { viewports: ["phone"] },
      visreg: { viewports: ["phone"] },
      accessibility: { viewports: ["phone"] },
    },
  },
  async (context) => {
    const { page, annotate } = context;
    const stickyCta = page.getByRole("region", { name: "Product information bar", exact: true });
    const addToCart = stickyCta.getByRole("link", { name: "Add to cart", exact: true });
    await addToCart.waitFor({ state: "visible" });
    // Visibility alone accepts the bar while its entrance transition is still outside the viewport.
    await page.waitForFunction(() => {
      const bar = document.querySelector('[aria-label="Product information bar"]');
      const link = Array.from(bar?.querySelectorAll("a") ?? []).find(
        (link) => link.textContent?.trim() === "Add to cart",
      );
      if (!link) return false;
      const rect = link.getBoundingClientRect();
      return (
        window.scrollY === 0 &&
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.left >= 0 &&
        rect.right <= window.innerWidth &&
        link.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))
      );
    });
    await addToCart.evaluate((link: HTMLAnchorElement) => {
      const url = new URL(link.href);
      if (url.origin === "http://gumroad.localhost:3000") {
        url.host = window.location.host.replace(/^luisfurushio\./u, "");
        link.href = url.href;
      }
    });
    const bounds = await addToCart.boundingBox();
    if (!bounds) throw new Error("Sticky Add to cart has no clickable bounds");
    await annotate("Click sticky Add to cart without scrolling");
    // A pointer click cannot auto-scroll an offscreen locator into view.
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    // This fixture has multiple editions, so the app reveals its purchase selection before checkout.
    await page.waitForFunction(() => {
      const link = Array.from(document.querySelectorAll("article a")).find(
        (link) => link.textContent?.trim() === "Add to cart",
      );
      if (!link) return false;
      const rect = link.getBoundingClientRect();
      return window.scrollY > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight;
    });
    await completeProfileCheckout(context);
  },
);
