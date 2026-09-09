"use client";

import { ChevronDown } from "@boxicons/react";
import * as React from "react";

import { classNames } from "$app/utils/classNames";
import type { Taxonomy } from "$app/utils/discover";

type LinkProps = {
  currentPath?: string | undefined;
  discoverDomain: string;
  forceDomain: boolean;
  offerCode?: string | undefined;
  taxonomies: Taxonomy[];
};

const taxonomyPaths = (taxonomies: Taxonomy[]) => {
  const taxonomyByKey = new Map(taxonomies.map((taxonomy) => [taxonomy.key, taxonomy]));

  return new Map(
    taxonomies.map((taxonomy) => {
      const slugs = [taxonomy.slug];
      let parentKey = taxonomy.parent_key;
      while (parentKey) {
        const parent = taxonomyByKey.get(parentKey);
        if (!parent) break;
        slugs.unshift(parent.slug);
        parentKey = parent.parent_key;
      }
      return [taxonomy.key, slugs.join("/")];
    }),
  );
};

const taxonomyHref = ({
  discoverDomain,
  forceDomain,
  offerCode,
  path,
}: {
  discoverDomain: string;
  forceDomain: boolean;
  offerCode?: string | undefined;
  path?: string | undefined;
}) =>
  forceDomain
    ? path
      ? Routes.discover_taxonomy_url(path, { host: discoverDomain, offer_code: offerCode })
      : Routes.discover_url({ host: discoverDomain, offer_code: offerCode })
    : path
      ? Routes.discover_taxonomy_path(path, { offer_code: offerCode })
      : Routes.discover_path({ offer_code: offerCode });

const taxonomyTree = (taxonomies: Taxonomy[]) => {
  const childrenByParent = new Map<string | null, Taxonomy[]>();
  for (const taxonomy of taxonomies) {
    const siblings = childrenByParent.get(taxonomy.parent_key) ?? [];
    siblings.push(taxonomy);
    childrenByParent.set(taxonomy.parent_key, siblings);
  }
  return childrenByParent;
};

export default function TaxonomyDropdown({
  currentPath,
  discoverDomain,
  forceDomain,
  label,
  offerCode,
  rootTaxonomies,
  taxonomies,
  align = "left",
}: LinkProps & {
  align?: "left" | "right";
  label: string;
  rootTaxonomies: Taxonomy[];
}) {
  const [open, setOpen] = React.useState(false);

  if (!open) {
    return (
      <details className="group relative shrink-0" onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary className="flex cursor-pointer list-none items-center rounded-full px-3 py-2 hover:bg-background">
          {label}
          <ChevronDown className="size-5" />
        </summary>
      </details>
    );
  }

  const paths = taxonomyPaths(taxonomies);
  const childrenByParent = taxonomyTree(taxonomies);
  const link = (taxonomy: Taxonomy) => {
    const path = paths.get(taxonomy.key);
    return (
      <a
        href={taxonomyHref({ discoverDomain, forceDomain, offerCode, path })}
        aria-current={currentPath === path ? "page" : undefined}
        className="block rounded-full px-3 py-2 no-underline hover:bg-background aria-[current=page]:bg-background aria-[current=page]:text-foreground"
      >
        {taxonomy.label}
      </a>
    );
  };
  const renderBranch = (parentKey: string, depth = 0): React.ReactNode =>
    childrenByParent.get(parentKey)?.map((taxonomy) => (
      <div key={taxonomy.key} style={{ paddingLeft: `${depth}rem` }}>
        {link(taxonomy)}
        {renderBranch(taxonomy.key, depth + 1)}
      </div>
    ));

  return (
    <details open className="group relative shrink-0" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none items-center rounded-full px-3 py-2 hover:bg-background">
        {label}
        <ChevronDown className="size-5" />
      </summary>
      <div
        className={classNames(
          "absolute top-full z-30 mt-1 max-h-[min(70vh,40rem)] overflow-y-auto rounded border border-border bg-background p-2 shadow",
          align === "right" ? "right-0 w-72" : "left-0 w-64",
        )}
      >
        {rootTaxonomies.map((taxonomy) => (
          <div key={taxonomy.key}>
            {link(taxonomy)}
            {renderBranch(taxonomy.key, 1)}
          </div>
        ))}
      </div>
    </details>
  );
}

export const MobileTaxonomyLinks = ({ currentPath, discoverDomain, forceDomain, offerCode, taxonomies }: LinkProps) => {
  const paths = taxonomyPaths(taxonomies);
  const childrenByParent = taxonomyTree(taxonomies);
  const renderBranch = (parentKey: string | null, depth = 0): React.ReactNode =>
    childrenByParent.get(parentKey)?.map((taxonomy) => {
      const path = paths.get(taxonomy.key);
      return (
        <li key={taxonomy.key}>
          <div style={{ paddingLeft: `${depth}rem` }}>
            <a
              href={taxonomyHref({ discoverDomain, forceDomain, offerCode, path })}
              aria-current={currentPath === path ? "page" : undefined}
              className="block border-b border-border px-4 py-3 no-underline aria-[current=page]:bg-background aria-[current=page]:text-foreground"
            >
              {taxonomy.label}
            </a>
          </div>
          {renderBranch(taxonomy.key, depth + 1)}
        </li>
      );
    });

  return (
    <ul className="list-none p-0">
      <li>
        <a
          href={taxonomyHref({ discoverDomain, forceDomain, offerCode })}
          className="block border-b border-border px-4 py-3 no-underline"
        >
          All
        </a>
      </li>
      {renderBranch(null)}
    </ul>
  );
};
