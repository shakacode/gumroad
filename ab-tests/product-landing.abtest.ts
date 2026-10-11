import { abTest, type TestFnContext, waitUntilPageSettled } from "shaka-shared";

type WorkCounts = {
  attempted: number;
  successful: number;
  completed: number;
  excludedAnalytics: number;
  errors: string[];
  consoleErrors: string[];
  pageErrors: string[];
};
const work = new WeakMap<TestFnContext["browserContext"], WorkCounts>();

abTest(
  "Inertia product landing",
  {
    startingPath: "/l/shakaperf?layout=discover",
    config: {
      shared: {
        beforeNavigate: async ({ context }) => {
          const counts: WorkCounts = {
            attempted: 0,
            successful: 0,
            completed: 0,
            excludedAnalytics: 0,
            errors: [],
            consoleErrors: [],
            pageErrors: [],
          };
          const reuse = work.has(context);
          work.set(context, counts);
          if (reuse) return;
          await context.addInitScript(() => {
            const originalFetch = window.fetch.bind(window);
            window.fetch = async (...args) => {
              const response = await originalFetch(...args);
              // The upstream analytics caller leaves this body unread, preventing network idle.
              if (response.url && new URL(response.url).pathname.endsWith("/increment_views")) {
                const result: unknown = await response.clone().json();
                if (!result || typeof result !== "object" || !("success" in result) || result.success !== true)
                  throw new Error("Product view response was not successful");
              }
              return response;
            };
          });
          /* eslint-disable @typescript-eslint/no-non-null-assertion -- Every event follows initialization of its context's current counts. */
          // eslint-disable-next-line require-unicode-regexp -- Preserve the route expression used by the recorded comparison.
          await context.route(/https?:\/\/([^/]+\.)?(google-analytics|googletagmanager)\.com\//, async (route) => {
            work.get(context)!.excludedAnalytics += 1;
            await route.fulfill({ status: 204, body: "" });
          });
          context.on("requestfinished", (request) => {
            if (new URL(request.url()).hostname.endsWith("localhost")) work.get(context)!.completed += 1;
          });
          context.on("request", (request) => {
            if (new URL(request.url()).hostname.endsWith("localhost")) work.get(context)!.attempted += 1;
          });
          context.on("console", (message) => {
            if (message.type() === "error") work.get(context)!.consoleErrors.push(message.text());
          });
          context.on("weberror", (error) => work.get(context)!.pageErrors.push(error.error().message));
          context.on("response", (response) => {
            if (!new URL(response.url()).hostname.endsWith("localhost")) return;
            if (response.status() >= 400) work.get(context)!.errors.push(`${response.status()} ${response.url()}`);
            else work.get(context)!.successful += 1;
          });
          context.on("requestfailed", (request) => {
            if (new URL(request.url()).hostname.endsWith("localhost"))
              work.get(context)!.errors.push(`${request.failure()?.errorText} ${request.url()}`);
          });
          /* eslint-enable @typescript-eslint/no-non-null-assertion */
        },
      },
    },
    testTypes: ["perf", "visreg", "accessibility"],
    visregSelectors: ["article"],
  },
  async ({ page, browserContext, annotate }) => {
    try {
      const product = page.locator("article");
      await product
        .getByRole("heading", { level: 1, name: "ShakaPerf sample guide", exact: true })
        .waitFor({ state: "visible" });
      await product
        .getByText("A synthetic guide for repeatable local checks.", { exact: true })
        .waitFor({ state: "visible" });
      const purchase = product.getByRole("link", { name: "Add to cart", exact: true });
      await purchase.waitFor({ state: "visible" });
      const href = await purchase.getAttribute("href");
      const destination = href ? new URL(href, page.url()) : null;
      if (
        !destination?.pathname.startsWith("/checkout") ||
        !destination.hostname.endsWith("localhost") ||
        destination.port !== new URL(page.url()).port ||
        destination.searchParams.get("product") !== "shakaperf"
      )
        throw new Error("Purchase link does not reach checkout");
      if (!(await page.locator("[data-page]").getAttribute("data-page"))?.includes("Products/Discover/Show"))
        throw new Error("Expected the upstream Inertia product page");
      await waitUntilPageSettled(page);
      if (page.isClosed()) throw new Error("Landing page closed before verification");
      const counts = work.get(browserContext);
      if (
        !counts?.successful ||
        counts.attempted !== counts.completed ||
        counts.errors.length ||
        counts.pageErrors.length
      )
        throw new Error(`Local request failures: ${JSON.stringify(counts)}`);
      await annotate("Product content and checkout link verified");
    } finally {
      // eslint-disable-next-line no-console -- The report retains these counts as evidence of completed and failed work.
      console.log(`SHAKAPERF_WORK ${JSON.stringify(work.get(browserContext))}`);
    }
  },
);
