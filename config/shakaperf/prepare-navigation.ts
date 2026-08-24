import type { BeforeNavigateHook } from "shaka-shared";
import { installRequestBlocking } from "shaka-shared";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);

export const prepareShakaPerfNavigation: BeforeNavigateHook = async ({ context }) => {
  // Development authorizes rack-mini-profiler on every request; keep its injected UI and requests out of measurements.
  await context.addCookies(
    [CONTROL_PORT, EXPERIMENT_PORT].flatMap((port) =>
      ["o365itpros", "luisfurushio"].map((subdomain) => ({
        name: "__profilin",
        value: "p=t,dp=t",
        url: `http://${subdomain}.localhost:${port}`,
      })),
    ),
  );
  await installRequestBlocking(context, ["/recaptcha/", "/cart_items_count"]);
  await context.addInitScript(() => {
    window.addEventListener(
      "DOMContentLoaded",
      () => {
        const footer = document.querySelector<HTMLElement>("#bullet-footer");
        if (footer) footer.hidden = true;
      },
      { once: true },
    );
  });
};
