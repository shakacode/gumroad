// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { ProfilePostsContent } from "$app/components/Profile/ProfilePostsContent";

beforeEach(() => {
  vi.stubGlobal("Routes", { custom_domain_view_post_path: (slug: string) => `/posts/${slug}` });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("renders profile post links and localized dates as server content", () => {
  render(
    <ProfilePostsContent
      locale="en-US"
      posts={[{ id: "post-id", slug: "release-notes", name: "Release notes", published_at: "2026-01-02" }]}
    />,
  );

  expect(screen.getByRole("link", { name: /Release notes/u }).getAttribute("href")).toBe("/posts/release-notes");
  expect(screen.getByText("January 2, 2026").tagName).toBe("TIME");
});
