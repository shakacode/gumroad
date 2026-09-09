// @vitest-environment happy-dom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useLazyLoadingProps from "$app/hooks/useLazyLoadingProps";

const session = vi.hoisted<{ user: { lazyLoadOffscreenDiscoverImages: boolean } | null }>(() => ({ user: null }));
vi.mock("$app/components/LoggedInUser", () => ({ useLoggedInUser: () => session.user }));

afterEach(() => {
  cleanup();
  session.user = null;
});

describe("anonymous product image loading", () => {
  it("defers images marked offscreen while keeping visible images eager", () => {
    const { result, rerender } = renderHook(({ eager }) => useLazyLoadingProps({ eager }), {
      initialProps: { eager: false },
    });
    expect(result.current).toEqual({ fetchPriority: "auto", loading: "lazy" });
    rerender({ eager: true });
    expect(result.current).toEqual({ fetchPriority: "high", loading: "eager" });
  });

  it("preserves default browser loading when the caller has no visibility hint", () => {
    const { result } = renderHook(() => useLazyLoadingProps({ eager: undefined }));
    expect(result.current).toEqual({});
  });

  it("keeps the signed-in feature flag and updates after logout", () => {
    session.user = { lazyLoadOffscreenDiscoverImages: false };
    const { result, rerender } = renderHook(() => useLazyLoadingProps({ eager: false }));
    expect(result.current).toEqual({});
    session.user = null;
    rerender();
    expect(result.current).toEqual({ fetchPriority: "auto", loading: "lazy" });
  });
});
