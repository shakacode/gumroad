import { abTest, type TestFnContext, waitUntilPageSettled } from "shaka-shared";

import { benchmarkPorts } from "../config/shakaperf/ports";
import { SELLER_PROFILE, sellerProfileUrl } from "../config/shakaperf/seller-profile-page";

import { warmCurrentPage, warmPerfConfig } from "./helpers/warm-cache";

const { control: CONTROL_PORT, experiment: EXPERIMENT_PORT } = benchmarkPorts;
const controlProfileUrl = sellerProfileUrl(CONTROL_PORT);
const experimentProfileUrl = sellerProfileUrl(EXPERIMENT_PORT);
type Page = TestFnContext["page"];

const waitForStableMain = async (page: Page) => {
  await page.locator("main").evaluate(async (element: HTMLElement) => {
    let previous = "";
    let stableFrames = 0;
    for (let attempt = 0; attempt < 60 && stableFrames < 3; attempt += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const rect = element.getBoundingClientRect();
      const current = `${rect.width}:${rect.height}`;
      stableFrames = current === previous ? stableFrames + 1 : 0;
      previous = current;
    }
    if (stableFrames < 3) throw new Error("Seller profile size did not settle within 60 animation frames");
  });
};

const waitForSellerProfile = async (page: Page) => {
  await page.getByRole("heading", { level: 2, name: "Microsoft 365 Lab", exact: true }).waitFor({ state: "visible" });
  await page.getByText(SELLER_PROFILE.firstProductName, { exact: true }).first().waitFor({ state: "visible" });
  await page.locator("main article").first().waitFor({ state: "visible" });
  await waitUntilPageSettled(page);
  await waitForStableMain(page);
};

abTest(
  "Seller Profile - Cold landing",
  {
    startingPath: controlProfileUrl,
    experimentPathOverride: experimentProfileUrl,
    testTypes: ["perf", "visreg", "accessibility", "audit"],
    visregSelectors: ["main"],
  },
  async ({ page }) => waitForSellerProfile(page),
);

abTest(
  "Seller Profile - Warm landing",
  {
    startingPath: controlProfileUrl,
    experimentPathOverride: experimentProfileUrl,
    testTypes: ["perf", "audit"],
    config: warmPerfConfig(warmCurrentPage(waitForSellerProfile)),
  },
  async ({ page }) => waitForSellerProfile(page),
);
