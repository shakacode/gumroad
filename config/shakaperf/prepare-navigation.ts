import type { BeforeNavigateHook } from "shaka-shared";
import { installRequestBlocking } from "shaka-shared";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);

export const prepareShakaPerfNavigation: BeforeNavigateHook = async ({ context }) => {
  // Catch requests to the image-time default host, which means a build still
  // has the wrong origin baked into routes.js. Log to stderr and record for
  // later assertion in the test.
  context.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "unknown";
    if (failure !== "inspector" && failure !== "net::ERR_ABORTED") {
      process.stderr.write(`[shaka-perf request failed] ${failure} ${request.url()}\n`);
    }
  });
  context.on("request", (request) => {
    try {
      const { host } = new URL(request.url());
      if (host === "gumroad.localhost:3000") {
        process.stderr.write(`[shaka-perf WRONG HOST] ${request.url()}\n`);
      }
    } catch {
      // data: URIs and other non-http schemes — ignore
    }
  });

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
    "www.google-analytics.com/",
    "www.googletagmanager.com/",
    "www.gstatic.com/recaptcha/",
    "www.recaptcha.net/recaptcha/",
    "connect.facebook.net/",
    "analytics.tiktok.com/",
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
