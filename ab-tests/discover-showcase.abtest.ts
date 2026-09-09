import { abTest, waitUntilPageSettled } from "shaka-shared";

import { prepareShakaPerfNavigation } from "../config/shakaperf/prepare-navigation";

for (const colorScheme of ["light", "dark"] as const) {
  abTest(
    `Discover showcase - ${colorScheme} cold landing`,
    {
      // Category recommendations avoid the marketplace's randomized featured order.
      startingPath: "/software-development",
      testTypes: colorScheme === "light" ? ["perf", "visreg", "accessibility"] : ["visreg", "accessibility"],
      visregSelectors: ["viewport"],
      config: {
        shared: {
          beforeNavigate: async (context) => {
            await prepareShakaPerfNavigation(context);
          },
        },
      },
    },
    async ({ page }) => {
      if (colorScheme === "dark") await page.emulateMedia({ colorScheme });
      await page.getByRole("heading", { name: "On the market", exact: true }).waitFor({ state: "visible" });
      await page.locator("article").first().waitFor({ state: "visible" });
      await waitUntilPageSettled(page);
    },
  );
}
