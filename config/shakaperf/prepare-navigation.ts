import type { BeforeNavigateHook } from "shaka-shared";
import { installRequestBlocking } from "shaka-shared";

import { benchmarkPorts } from "./ports";

const { control: CONTROL_PORT, experiment: EXPERIMENT_PORT } = benchmarkPorts;

export const prepareShakaPerfNavigation: BeforeNavigateHook = async ({ context }) => {
  // Development authorizes rack-mini-profiler on every request; keep its injected UI and requests out of measurements.
  await context.addCookies(
    (
      [
        ["control.localhost", CONTROL_PORT],
        ["experiment.localhost", EXPERIMENT_PORT],
      ] as const
    ).flatMap(([host, port]) =>
      ["o365itpros", "luisfurushio"].map((subdomain) => ({
        name: "__profilin",
        value: "p=t,dp=t",
        url: `http://${subdomain}.${host}:${port}`,
      })),
    ),
  );
  // RSC payload query strings contain recaptcha prop names; block only provider resources.
  await installRequestBlocking(context, [
    "www.google.com/recaptcha/",
    "www.gstatic.com/recaptcha/",
    "www.recaptcha.net/recaptcha/",
  ]);
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
