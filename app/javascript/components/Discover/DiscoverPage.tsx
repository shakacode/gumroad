import * as React from "react";

import type { MetaTag } from "$app/layouts/components/MetaTags";
import type { CardProduct } from "$app/parsers/product";
import type { CurrencyCode } from "$app/utils/currency";
import type { Taxonomy } from "$app/utils/discover";

import AsyncRecentlyViewed from "$app/components/Discover/AsyncRecentlyViewed";
import AsyncRecommendedProducts from "$app/components/Discover/AsyncRecommendedProducts";
import AsyncRecommendedWishlists from "$app/components/Discover/AsyncRecommendedWishlists";
import BlackFridayHero, {
  BlackFridayButtonFrame,
  type BlackFridayStats,
  blackFridayButtonClassName,
} from "$app/components/Discover/BlackFridayHero";
import DiscoverLayout from "$app/components/Discover/DiscoverLayout";
import DiscoverResults from "$app/components/Discover/DiscoverResults.client";
import type { RecentlyViewedProps } from "$app/components/Discover/RecentlyViewed.types";
import { RecommendedProductsSkeleton } from "$app/components/Discover/RecommendedProducts.client";
import { RecommendedWishlists } from "$app/components/Discover/RecommendedWishlists";
import PageShell, { type GlobalProps } from "$app/components/PublicPages/PageShell.client";
import type { CardWishlist } from "$app/components/Wishlist/Card";

type AsyncDiscoverPageProps = {
  recommended_products: CardProduct[];
  recommended_wishlists: CardWishlist[];
  recently_viewed: RecentlyViewedProps | null;
};

export type DiscoverPageProps = Record<string, unknown> & {
  _inertia_meta?: MetaTag[];
  black_friday_offer_code: string;
  black_friday_stats?: BlackFridayStats | null;
  currency_code: CurrencyCode;
  global: GlobalProps;
  is_black_friday_page: boolean;
  show_black_friday_hero?: boolean;
  taxonomies_for_nav: Taxonomy[];
  getReactOnRailsAsyncProp: <PropName extends keyof AsyncDiscoverPageProps>(
    propName: PropName,
  ) => Promise<AsyncDiscoverPageProps[PropName]>;
};

export default function DiscoverPage({
  _inertia_meta: inertiaMeta,
  getReactOnRailsAsyncProp,
  global,
  ...discoverProps
}: DiscoverPageProps) {
  const url = new URL(global.href);
  const taxonomyPath = url.pathname === Routes.discover_path() ? undefined : url.pathname.replace(/^\//u, "");
  const {
    black_friday_stats: blackFridayStats,
    is_black_friday_page: isBlackFridayPage,
    show_black_friday_hero: showBlackFridayHero,
    ...clientDiscoverProps
  } = discoverProps;
  const dealUrl = taxonomyPath
    ? Routes.discover_taxonomy_path(taxonomyPath, { offer_code: clientDiscoverProps.black_friday_offer_code })
    : Routes.discover_path({ offer_code: clientDiscoverProps.black_friday_offer_code });
  const blackFridayHero = showBlackFridayHero ? (
    <BlackFridayHero
      currencyCode={clientDiscoverProps.currency_code}
      stats={blackFridayStats}
      cta={
        isBlackFridayPage ? null : (
          <BlackFridayButtonFrame>
            <a href={dealUrl} className={blackFridayButtonClassName()}>
              Get Black Friday deals
            </a>
          </BlackFridayButtonFrame>
        )
      }
    />
  ) : null;
  const recommendedProducts = (
    <React.Suspense fallback={<RecommendedProductsSkeleton />}>
      <AsyncRecommendedProducts
        originalLocation={global.href}
        productsPromise={getReactOnRailsAsyncProp("recommended_products")}
      />
    </React.Suspense>
  );
  const wishlistTaxonomy = clientDiscoverProps.taxonomies_for_nav.find(
    (taxonomy) => taxonomy.slug === taxonomyPath?.split("/").at(-1),
  );
  const recommendedWishlistsTitle = wishlistTaxonomy
    ? `Wishlists for ${wishlistTaxonomy.label}`
    : "Wishlists you might like";
  const recommendedWishlists = (
    <React.Suspense fallback={<RecommendedWishlists wishlists={null} title={recommendedWishlistsTitle} />}>
      <AsyncRecommendedWishlists
        title={recommendedWishlistsTitle}
        wishlistsPromise={getReactOnRailsAsyncProp("recommended_wishlists")}
      />
    </React.Suspense>
  );
  const recentlyViewed = (
    <React.Suspense fallback={null}>
      <AsyncRecentlyViewed recentlyViewedPromise={getReactOnRailsAsyncProp("recently_viewed")} />
    </React.Suspense>
  );

  return (
    <PageShell component="Discover/Index" global={global} inertiaMeta={inertiaMeta} pageProps={clientDiscoverProps}>
      <DiscoverLayout
        currentSeller={global.current_seller}
        domainSettings={global.domain_settings}
        taxonomyPath={taxonomyPath}
        taxonomiesForNav={clientDiscoverProps.taxonomies_for_nav}
        offerCode={url.searchParams.get("offer_code") ?? undefined}
        query={url.searchParams.get("query") ?? undefined}
        showTaxonomy
      >
        <DiscoverResults
          blackFridayHero={blackFridayHero}
          recentlyViewed={recentlyViewed}
          recommendedProducts={recommendedProducts}
          recommendedWishlists={recommendedWishlists}
        />
      </DiscoverLayout>
    </PageShell>
  );
}
