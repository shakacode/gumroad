const REVIEWS_IDLE_TIMEOUT_MS = 2000;
const REVIEWS_FALLBACK_DELAY_MS = 500;

export const scheduleProductReviewsLoad = (load: () => void) => {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(load, { timeout: REVIEWS_IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(handle);
  }

  const timer = window.setTimeout(load, REVIEWS_FALLBACK_DELAY_MS);
  return () => window.clearTimeout(timer);
};
