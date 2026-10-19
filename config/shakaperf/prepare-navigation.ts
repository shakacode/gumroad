import type { BeforeNavigateHook } from "shaka-shared";
import { installRequestBlocking } from "shaka-shared";

const CONTROL_PORT = Number(process.env.SHAKAPERF_CONTROL_PORT || 3100);
const EXPERIMENT_PORT = Number(process.env.SHAKAPERF_EXPERIMENT_PORT || 3200);

const BLOCKED_PREFIXES = [
  "www.google.com/recaptcha/",
  "www.google-analytics.com/",
  "www.googletagmanager.com/",
  "www.gstatic.com/recaptcha/",
  "www.recaptcha.net/recaptcha/",
  "connect.facebook.net/",
  "analytics.tiktok.com/",
];

const isBlockedUrl = (url: string) => BLOCKED_PREFIXES.some((prefix) => url.includes(prefix));

let navigationViolations: string[] = [];

export const getNavigationViolations = () => navigationViolations;

export const prepareShakaPerfNavigation: BeforeNavigateHook = async ({ context, url }) => {
  navigationViolations = [];

  // Determine which twin this navigation targets so we can detect cross-twin requests.
  const isControlSide = url.includes("control.localhost");
  const oppositeTwinHost = isControlSide ? "experiment.localhost" : "control.localhost";

  const addViolation = (reason: string, requestUrl: string) => {
    const msg = `[shaka-perf ${reason}] ${requestUrl}`;
    process.stderr.write(`${msg}\n`);
    navigationViolations.push(msg);
  };

  context.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "unknown";
    if (failure === "inspector" || failure === "net::ERR_ABORTED") return;
    if (isBlockedUrl(request.url())) return;
    addViolation(`REQUEST FAILED: ${failure}`, request.url());
  });

  context.on("request", (request) => {
    try {
      const { host } = new URL(request.url());
      if (host === "gumroad.localhost:3000") addViolation("WRONG HOST", request.url());
      else if (host.includes(oppositeTwinHost)) addViolation("CROSS-TWIN", request.url());
    } catch {
      // data: URIs and other non-http schemes
    }
  });

  context.on("response", (response) => {
    const status = response.status();
    if (status >= 400 && !isBlockedUrl(response.url())) {
      addViolation(`HTTP ${status}`, response.url());
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
  await installRequestBlocking(context, BLOCKED_PREFIXES);
  await context.addInitScript(() => {
    window.addEventListener(
      "DOMContentLoaded",
      () => {
        const footer = document.querySelector<HTMLElement>("#bullet-footer");
        if (footer) footer.hidden = true;
      },
      { once: true },
    );

    // Record long tasks from navigation start so we can compute blocking time
    // from page start (not just after FCP, which is what TBT measures).
    (window as any).__longTasks = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        (window as any).__longTasks.push({
          start: entry.startTime,
          duration: entry.duration,
          blocking: Math.max(0, entry.duration - 50),
        });
      }
    }).observe({ type: "longtask", buffered: true });

    // Record interaction events for INP measurement.
    (window as any).__inpEntries = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        (window as any).__inpEntries.push({
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
        });
      }
    }).observe({ type: "event", durationThreshold: 0, buffered: true } as any);
  });
};
