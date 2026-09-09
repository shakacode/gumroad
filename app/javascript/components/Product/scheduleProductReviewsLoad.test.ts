// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import { scheduleProductReviewsLoad } from "$app/components/Product/scheduleProductReviewsLoad";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("scheduleProductReviewsLoad", () => {
  it("waits for browser idle time and cancels pending work", () => {
    const load = vi.fn();
    const cancelIdleCallback = vi.fn();
    let idleCallback: (() => void) | undefined;
    vi.stubGlobal(
      "requestIdleCallback",
      vi.fn((callback: () => void) => {
        idleCallback = callback;
        return 123;
      }),
    );
    vi.stubGlobal("cancelIdleCallback", cancelIdleCallback);

    const cancel = scheduleProductReviewsLoad(load);

    expect(load).not.toHaveBeenCalled();
    idleCallback?.();
    expect(load).toHaveBeenCalledTimes(1);

    cancel();
    expect(cancelIdleCallback).toHaveBeenCalledWith(123);
  });

  it("uses a cancellable delay when idle callbacks are unavailable", () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestIdleCallback", undefined);
    const setTimeout = vi.spyOn(window, "setTimeout");
    const load = vi.fn();

    const cancel = scheduleProductReviewsLoad(load);

    vi.advanceTimersByTime(499);
    expect(load).not.toHaveBeenCalled();
    expect(setTimeout).toHaveBeenCalledWith(load, 500);
    cancel();
    vi.runAllTimers();
    expect(load).not.toHaveBeenCalled();
  });
});
