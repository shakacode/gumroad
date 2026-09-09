import { BookmarkHeart } from "@boxicons/react";
import * as React from "react";

import { classNames } from "$app/utils/classNames";
import { getRootTaxonomy, getRootTaxonomyCss, type Taxonomy } from "$app/utils/discover";

import Cart from "$app/components/Discover/Cart.client";
import MobileMenu from "$app/components/Discover/MobileMenu.client";
import Search from "$app/components/Discover/Search.client";
import TaxonomyDropdown, { MobileTaxonomyLinks } from "$app/components/Discover/TaxonomyMenu.client";
import { Logo } from "$app/components/Logo";
import type { GlobalProps } from "$app/components/PublicPages/PageShell.client";
import { Avatar } from "$app/components/ui/Avatar";

type Props = {
  domainSettings: GlobalProps["domain_settings"];
  currentSeller?: unknown;
  forceDomain?: boolean;
  offerCode?: string | undefined;
  query?: string | undefined;
  showTaxonomy?: boolean;
  taxonomiesForNav: Taxonomy[];
  taxonomyPath?: string | undefined;
};

type HeaderSeller = {
  avatar_url: string;
  has_published_products: boolean;
};

const headerSeller = (value: unknown): HeaderSeller | null => {
  if (typeof value !== "object" || value === null) return null;
  if (!("avatar_url" in value) || typeof value.avatar_url !== "string") return null;
  if (!("has_published_products" in value) || typeof value.has_published_products !== "boolean") return null;
  return { avatar_url: value.avatar_url, has_published_products: value.has_published_products };
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

const TaxonomyLinks = ({
  currentPath,
  discoverDomain,
  forceDomain,
  offerCode,
  mobile = false,
  taxonomies,
}: {
  currentPath?: string | undefined;
  discoverDomain: string;
  forceDomain: boolean;
  offerCode?: string | undefined;
  mobile?: boolean;
  taxonomies: Taxonomy[];
}) => {
  const paths = taxonomyPaths(taxonomies);
  const childrenByParent = new Map<string | null, Taxonomy[]>();
  for (const taxonomy of taxonomies) {
    const siblings = childrenByParent.get(taxonomy.parent_key) ?? [];
    siblings.push(taxonomy);
    childrenByParent.set(taxonomy.parent_key, siblings);
  }

  const link = (taxonomy: Taxonomy) => {
    const path = paths.get(taxonomy.key);
    return (
      <a
        href={taxonomyHref({ discoverDomain, forceDomain, offerCode, path })}
        aria-current={currentPath === path ? "page" : undefined}
        className={classNames(
          "block no-underline aria-[current=page]:bg-background aria-[current=page]:text-foreground",
          "rounded-full px-3 py-2 hover:bg-background",
        )}
      >
        {taxonomy.label}
      </a>
    );
  };

  if (mobile) {
    return (
      <MobileTaxonomyLinks
        currentPath={currentPath}
        discoverDomain={discoverDomain}
        forceDomain={forceDomain}
        offerCode={offerCode}
        taxonomies={taxonomies}
      />
    );
  }

  const rootTaxonomies = childrenByParent.get(null) ?? [];
  const visibleRootTaxonomies = rootTaxonomies.slice(0, 5);
  const overflowRootTaxonomies = rootTaxonomies.slice(5);

  const rootLink = (taxonomy: Taxonomy) => {
    const children = childrenByParent.get(taxonomy.key) ?? [];
    return children.length ? (
      <TaxonomyDropdown
        key={taxonomy.key}
        currentPath={currentPath}
        discoverDomain={discoverDomain}
        forceDomain={forceDomain}
        label={taxonomy.label}
        offerCode={offerCode}
        rootTaxonomies={[taxonomy]}
        taxonomies={taxonomies}
      />
    ) : (
      <React.Fragment key={taxonomy.key}>{link(taxonomy)}</React.Fragment>
    );
  };

  return (
    <nav className="flex items-center" aria-label="Categories">
      <a
        href={taxonomyHref({ discoverDomain, forceDomain, offerCode })}
        aria-current={currentPath ? undefined : "page"}
        className="rounded-full px-3 py-2 no-underline hover:bg-background aria-[current=page]:bg-background"
      >
        All
      </a>
      {visibleRootTaxonomies.map(rootLink)}
      {overflowRootTaxonomies.length ? (
        <TaxonomyDropdown
          align="right"
          currentPath={currentPath}
          discoverDomain={discoverDomain}
          forceDomain={forceDomain}
          label="More Categories"
          offerCode={offerCode}
          rootTaxonomies={overflowRootTaxonomies}
          taxonomies={taxonomies}
        />
      ) : null}
    </nav>
  );
};

const serverButtonClasses =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded border border-border px-4 py-3 font-[inherit] leading-snug text-current no-underline transition-transform hover:-translate-1 hover:shadow-[0.25rem_0.25rem_0_var(--color-black)] active:translate-0 active:shadow-none";

const UserActions = ({ seller }: { seller: HeaderSeller | null }) =>
  seller ? (
    <>
      <a href={Routes.library_url()} className={classNames(serverButtonClasses, "flex-1 bg-transparent lg:flex-none")}>
        <BookmarkHeart pack="filled" className="size-5" /> Library
      </a>
      {seller.has_published_products ? null : (
        <a
          href={Routes.products_url()}
          className={classNames(
            serverButtonClasses,
            "flex-1 bg-primary text-primary-foreground hover:bg-accent-with-text hover:text-accent-foreground lg:flex-none",
          )}
        >
          Start selling
        </a>
      )}
    </>
  ) : (
    <>
      <a href={Routes.login_url()} className={classNames(serverButtonClasses, "flex-1 bg-transparent lg:flex-none")}>
        Log in
      </a>
      <a
        href={Routes.signup_url()}
        className={classNames(
          serverButtonClasses,
          "flex-1 bg-primary text-primary-foreground hover:bg-accent-with-text hover:text-accent-foreground lg:flex-none",
        )}
      >
        Start selling
      </a>
    </>
  );

const Breadcrumbs = ({
  discoverDomain,
  forceDomain,
  offerCode,
  taxonomies,
  taxonomyPath,
}: {
  discoverDomain: string;
  forceDomain: boolean;
  offerCode?: string | undefined;
  taxonomies: Taxonomy[];
  taxonomyPath: string;
}) => (
  <nav className="mt-4" aria-label="Breadcrumbs">
    <ol
      itemScope
      itemType="https://schema.org/BreadcrumbList"
      className="flex list-none flex-wrap p-0 text-xl leading-[1.3]"
    >
      {taxonomyPath.split("/").map((slug, index, breadcrumbs) => {
        const path = breadcrumbs.slice(0, index + 1).join("/");
        const isPage = index === breadcrumbs.length - 1;
        return (
          <li key={path} itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            {index ? (
              <span className="mx-2 select-none" aria-hidden="true">
                /
              </span>
            ) : null}
            <a
              href={taxonomyHref({ discoverDomain, forceDomain, offerCode, path })}
              aria-current={isPage ? "page" : undefined}
              itemProp="item"
              className={classNames({ "no-underline": isPage })}
            >
              <span itemProp="name">{taxonomies.find((taxonomy) => taxonomy.slug === slug)?.label ?? slug}</span>
            </a>
            <meta itemProp="position" content={(index + 1).toString()} />
          </li>
        );
      })}
    </ol>
  </nav>
);

export default function DiscoverHeader({
  currentSeller,
  domainSettings,
  forceDomain = false,
  offerCode,
  query,
  showTaxonomy,
  taxonomiesForNav,
  taxonomyPath,
}: Props) {
  const seller = headerSeller(currentSeller);
  const rootTaxonomy = getRootTaxonomy(taxonomyPath);
  const logo = (
    <a href={Routes.discover_url({ host: domainSettings.discover_domain })} className="shrink-0" aria-label="Gumroad">
      <Logo className="h-auto w-[245px]" />
    </a>
  );
  const avatar = seller ? (
    <a href={Routes.dashboard_url({ host: domainSettings.app_domain })} aria-label="Dashboard" className="shrink-0">
      <Avatar src={seller.avatar_url} />
    </a>
  ) : null;
  const mobileTaxonomies = (
    <>
      <TaxonomyLinks
        currentPath={taxonomyPath}
        discoverDomain={domainSettings.discover_domain}
        forceDomain={forceDomain}
        offerCode={offerCode}
        mobile
        taxonomies={taxonomiesForNav}
      />
      <div className="flex gap-4 border-b p-4">
        <UserActions seller={seller} />
      </div>
    </>
  );

  return (
    <header
      className="hero relative z-20 border-t-0 border-b border-border bg-body px-4 py-8 lg:ps-16 lg:pe-16"
      style={showTaxonomy && rootTaxonomy ? getRootTaxonomyCss(rootTaxonomy) : undefined}
    >
      <div className="hidden w-full flex-col gap-4 lg:flex">
        <div className="flex w-full items-center gap-4">
          {logo}
          <div className="min-w-0 grow">
            <Search offerCode={offerCode} query={query} taxonomyPath={taxonomyPath} />
          </div>
          <div className="flex shrink-0 items-center space-x-4">
            <UserActions seller={seller} />
            <Cart className="link-button shrink-0" />
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-4">
          <div className="min-w-0 grow">
            <TaxonomyLinks
              currentPath={taxonomyPath}
              discoverDomain={domainSettings.discover_domain}
              forceDomain={forceDomain}
              offerCode={offerCode}
              taxonomies={taxonomiesForNav}
            />
          </div>
          {avatar}
        </div>
      </div>
      <div className="flex w-full flex-col gap-4 lg:hidden">
        <div className="flex w-full items-center justify-between">
          {logo}
          <div className="flex items-center gap-4">
            {avatar}
            <Cart className="link-button shrink-0" />
          </div>
        </div>
        <div className="flex w-full items-center gap-4">
          <div className="min-w-0 grow">
            <Search offerCode={offerCode} query={query} taxonomyPath={taxonomyPath} />
          </div>
          <MobileMenu>{mobileTaxonomies}</MobileMenu>
        </div>
      </div>
      {showTaxonomy && taxonomyPath ? (
        <Breadcrumbs
          discoverDomain={domainSettings.discover_domain}
          forceDomain={forceDomain}
          offerCode={offerCode}
          taxonomies={taxonomiesForNav}
          taxonomyPath={taxonomyPath}
        />
      ) : null}
    </header>
  );
}
