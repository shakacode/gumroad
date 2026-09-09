import { type BeforeNavigateHook, type TestFnContext } from "shaka-shared";

import { prepareShakaPerfNavigation } from "../../config/shakaperf/prepare-navigation";

type Page = TestFnContext["page"];

export const warmCurrentPage =
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

export const warmPerfConfig = (beforeNavigate: BeforeNavigateHook) => ({
  shared: { beforeNavigate },
  perf: { lighthouseConfig: { disableStorageReset: true } },
  audit: { lighthouseConfig: { disableStorageReset: true } },
});
