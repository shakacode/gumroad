// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TaxonomyDropdown from "$app/components/Discover/TaxonomyMenu.client";

beforeEach(() => {
  vi.stubGlobal("Routes", {
    discover_path: () => "/discover",
    discover_taxonomy_path: (path: string) => `/${path}`,
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const taxonomies = [
  { key: "software", label: "Software Development", slug: "software-development", parent_key: null },
  { key: "programming", label: "Programming", slug: "programming", parent_key: "software" },
];

describe("TaxonomyDropdown", () => {
  it("defers descendant links until the closed menu is opened", () => {
    render(
      <TaxonomyDropdown
        currentPath={undefined}
        discoverDomain="gumroad.com"
        forceDomain={false}
        label="Software Development"
        offerCode={undefined}
        rootTaxonomies={taxonomies.slice(0, 1)}
        taxonomies={taxonomies}
      />,
    );

    const menu = screen.getByText("Software Development").closest("details");
    expect(menu).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Programming" })).toBeNull();

    if (!menu) throw new Error("expected taxonomy menu");
    menu.open = true;
    fireEvent(menu, new Event("toggle"));

    expect(screen.getByRole("link", { name: "Programming" })).toBeTruthy();
  });
});
