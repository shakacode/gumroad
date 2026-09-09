// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, expect, it, vi } from "vitest";

import { Nav } from "$app/components/Discover/Nav";

vi.mock("$app/components/DomainSettings", () => ({ useDomains: () => ({ discoverDomain: "gumroad.localhost" }) }));
vi.mock("$app/components/useIsAboveBreakpoint", () => ({ useIsAboveBreakpoint: () => true }));
vi.mock("$app/components/NestedMenu", () => ({ NestedMenu: () => <div role="menubar" /> }));
vi.mock("$app/utils/discover", () => ({}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("exposes the category menu in a named navigation landmark", () => {
  vi.stubGlobal("Routes", { discover_url: () => "/discover", discover_path: () => "/discover" });
  render(<Nav wholeTaxonomy={[]} onClickTaxonomy={() => {}} />);

  expect(screen.getByRole("navigation", { name: "Product categories" }).contains(screen.getByRole("menubar"))).toBe(
    true,
  );
});
