import { X } from "@boxicons/react";
import { Deferred, router, usePage } from "@inertiajs/react";
import { range } from "lodash-es";
import * as React from "react";
import typia from "typia";

import { SearchRequest, SearchResults } from "$app/data/search";
import { useScrollToElement } from "$app/hooks/useScrollToElement";
import type { CardProduct } from "$app/parsers/product";
import { last } from "$app/utils/array";
import { CurrencyCode } from "$app/utils/currency";
import { discoverTitleGenerator, Taxonomy } from "$app/utils/discover";

import { RecentlyViewed } from "$app/components/Discover/RecentlyViewed";
import type { RecentlyViewedProps } from "$app/components/Discover/RecentlyViewed.types";
import { RecommendedProducts, RecommendedProductsSkeleton } from "$app/components/Discover/RecommendedProducts.client";
import { RecommendedWishlists } from "$app/components/Discover/RecommendedWishlists";
import { HomeFooter } from "$app/components/Home/Shared/Footer";
import { CardGrid, useSearchReducer } from "$app/components/Product/CardGrid";
import { RatingStars } from "$app/components/RatingStars";
import { CardContent } from "$app/components/ui/Card";
import { Details, DetailsToggle } from "$app/components/ui/Details";
import { Fieldset } from "$app/components/ui/Fieldset";
import { Label } from "$app/components/ui/Label";
import { Radio } from "$app/components/ui/Radio";
import { Tab, Tabs } from "$app/components/ui/Tabs";
import { useOriginalLocation } from "$app/components/useOriginalLocation";
import type { CardWishlist } from "$app/components/Wishlist/Card";

type Props = {
  currency_code: CurrencyCode;
  search_results: SearchResults;
  taxonomies_for_nav: Taxonomy[];
  recommended_products?: CardProduct[];
  recommended_wishlists?: CardWishlist[];
  recently_viewed?: RecentlyViewedProps | null;
  curated_product_ids: string[];
  black_friday_offer_code: string;
};

const sortTitles = {
  curated: "Curated for you",
  trending: "On the market",
  hot_and_new: "Hot and new products",
  best_sellers: "Best selling products",
};

// Featured products and search results overlap when there are no filters, so skip them in the search request.
const recommendedProductsCount = 8;
const addInitialOffset = (params: SearchRequest) =>
  Object.entries(params).every(([key, value]) => !value || ["taxonomy", "curated_product_ids"].includes(key))
    ? { ...params, from: recommendedProductsCount + 1 }
    : params;

const parseUrlParams = (href: string, curatedProductIds: string[], defaultSortOrder: string | undefined) => {
  const url = new URL(href);
  const parsedParams: SearchRequest = {
    taxonomy: url.pathname === Routes.discover_path() ? undefined : url.pathname.replace("/", ""),
    curated_product_ids: curatedProductIds.slice(
      url.pathname === Routes.discover_path() ? recommendedProductsCount : 0,
    ),
  };

  function parseParams<T extends keyof SearchRequest>(keys: T[], transform: (value: string) => SearchRequest[T]) {
    for (const key of keys) {
      const value = url.searchParams.get(key);
      parsedParams[key] = value ? transform(value) : undefined;
    }
  }

  const sortWasExplicit = url.searchParams.has("sort");
  parseParams(["sort", "query", "offer_code"], (value) => value);
  parseParams(["min_price", "max_price", "rating"], (value) => Number(value));
  parseParams(["filetypes", "tags", "taxonomy_attribute_filters"], (value) => value.split(","));
  if (!parsedParams.sort) parsedParams.sort = defaultSortOrder;
  return { params: parsedParams, sortWasExplicit };
};

export function DiscoverResultsCore({
  blackFridayHero,
  recentlyViewed: recentlyViewedSlot,
  recommendedProducts: recommendedProductsSlot,
  recommendedWishlists: recommendedWishlistsSlot,
}: {
  blackFridayHero: React.ReactNode;
  recentlyViewed?: React.ReactNode;
  recommendedProducts?: React.ReactNode;
  recommendedWishlists?: React.ReactNode;
}) {
  const props = typia.assert<Props>(usePage().props);
  const originalLocation = useOriginalLocation();
  const defaultSortOrder = props.curated_product_ids.length > 0 ? "curated" : undefined;

  const initialParsed = parseUrlParams(originalLocation, props.curated_product_ids, defaultSortOrder);
  const sortWasExplicitRef = React.useRef(initialParsed.sortWasExplicit);

  const [state, dispatch] = useSearchReducer({
    params: addInitialOffset(initialParsed.params),
    results: props.search_results,
  });

  const isBlackFridayPage = state.params.offer_code === props.black_friday_offer_code;
  const showBlackFridayHero = blackFridayHero != null;
  const resultsRef = useScrollToElement(isBlackFridayPage && showBlackFridayHero, undefined, [state.params]);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (state.params.taxonomy) {
      url.pathname = state.params.taxonomy;
    } else if (url.pathname !== Routes.discover_path()) {
      url.pathname = Routes.discover_path();
    }

    const serializeParams = <T extends keyof SearchRequest>(
      keys: T[],
      transform: (value: NonNullable<SearchRequest[T]>) => string,
    ) => {
      for (const key of keys) {
        const value = state.params[key];
        if (value && (!Array.isArray(value) || value.length)) url.searchParams.set(key, transform(value));
        else url.searchParams.delete(key);
      }
    };
    serializeParams(["sort", "query", "offer_code"], (value) => value);
    serializeParams(["min_price", "max_price", "rating"], (value) => value.toString());
    serializeParams(["filetypes", "tags", "taxonomy_attribute_filters"], (value) => value.join(","));

    const urlString = url.pathname + url.search;
    const currentUrlString = window.location.pathname + window.location.search;
    if (urlString !== currentUrlString) {
      const currentParams = parseUrlParams(window.location.href, props.curated_product_ids, defaultSortOrder).params;
      const offerCodeChanged = state.params.offer_code !== currentParams.offer_code;
      const shouldFetchRecommendations = url.pathname !== new URL(window.location.href).pathname;

      if (offerCodeChanged) {
        window.location.assign(url.toString());
      } else if (shouldFetchRecommendations) {
        router.get(url.toString(), {}, { preserveState: true, preserveScroll: true });
      } else {
        router.get(
          url.toString(),
          {},
          {
            preserveState: true,
            preserveScroll: true,
            only: ["search_results"],
          },
        );
      }
    }

    document.title = discoverTitleGenerator(
      state.params,
      props.taxonomies_for_nav,
      url.search,
      sortWasExplicitRef.current ? undefined : defaultSortOrder,
    );
  }, [state.params, props.taxonomies_for_nav, defaultSortOrder, props.curated_product_ids]);

  React.useEffect(() => {
    const handlePopstate = () => {
      const { params: newParams, sortWasExplicit } = parseUrlParams(
        window.location.href,
        props.curated_product_ids,
        defaultSortOrder,
      );
      sortWasExplicitRef.current = sortWasExplicit;
      dispatch({ type: "set-params", params: addInitialOffset(newParams) });
    };
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, [defaultSortOrder, props.curated_product_ids]);

  const updateParams = (newParams: Partial<SearchRequest>) => {
    if ("sort" in newParams) sortWasExplicitRef.current = true;
    dispatch({ type: "set-params", params: { ...state.params, from: undefined, ...newParams } });
  };

  const hasOfferCode = !!state.params.offer_code;
  const taxonomyPath = state.params.taxonomy;
  const recommendedProducts = props.recommended_products ?? [];
  const isCuratedProducts = (() => {
    try {
      if (!recommendedProducts.length || !recommendedProducts[0]?.url) return false;
      const url = new URL(recommendedProducts[0].url, originalLocation);
      return url.searchParams.get("recommended_by") === "products_for_you";
    } catch {
      return false;
    }
  })();
  const showRecommendationSections = !state.params.query && !hasOfferCode;
  const wishlistTaxonomy = taxonomyPath
    ? props.taxonomies_for_nav.find((taxonomy) => taxonomy.slug === last(taxonomyPath.split("/")))
    : undefined;
  const recommendedWishlistsTitle = wishlistTaxonomy
    ? `Wishlists for ${wishlistTaxonomy.label}`
    : "Wishlists you might like";

  return (
    <>
      {blackFridayHero}
      <div className="grid gap-16! px-4 py-16 lg:ps-16 lg:pe-16">
        {showRecommendationSections && recommendedProductsSlot !== undefined ? (
          recommendedProductsSlot
        ) : showRecommendationSections ? (
          <Deferred data={["recommended_products"]} fallback={<RecommendedProductsSkeleton />}>
            {recommendedProducts.length ? (
              <RecommendedProducts
                products={recommendedProducts}
                title={isCuratedProducts ? "Recommended" : "Featured products"}
              />
            ) : null}
          </Deferred>
        ) : null}
        {showRecommendationSections && recentlyViewedSlot !== undefined ? (
          recentlyViewedSlot
        ) : showRecommendationSections ? (
          <Deferred data={["recently_viewed"]} fallback={null}>
            <RecentlyViewed data={props.recently_viewed} />
          </Deferred>
        ) : null}
        <section ref={resultsRef} className="flex flex-col gap-4">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--spacer-2)", flexWrap: "wrap" }}>
            <h2>
              {state.params.query || hasOfferCode
                ? state.results?.products.length
                  ? `Showing 1-${state.results.products.length} of ${state.results.total} products`
                  : null
                : sortTitles[typia.is<keyof typeof sortTitles>(state.params.sort) ? state.params.sort : "trending"]}
            </h2>
            {state.params.query || hasOfferCode ? null : (
              <Tabs>
                {props.curated_product_ids.length > 0 ? (
                  <Tab
                    isSelected={state.params.sort === "curated"}
                    onClick={() =>
                      updateParams({
                        sort: "curated",
                        curated_product_ids: props.curated_product_ids.slice(recommendedProductsCount),
                      })
                    }
                  >
                    Curated
                  </Tab>
                ) : null}
                <Tab
                  isSelected={!state.params.sort || state.params.sort === "default"}
                  onClick={() => updateParams({ sort: undefined })}
                >
                  Trending
                </Tab>
                {props.curated_product_ids.length === 0 ? (
                  <Tab
                    isSelected={state.params.sort === "best_sellers"}
                    onClick={() => updateParams({ sort: "best_sellers" })}
                  >
                    Best Sellers
                  </Tab>
                ) : null}
                <Tab
                  isSelected={state.params.sort === "hot_and_new"}
                  onClick={() => updateParams({ sort: "hot_and_new" })}
                >
                  Hot &amp; New
                </Tab>
              </Tabs>
            )}
          </div>
          <CardGrid
            state={state}
            dispatchAction={dispatch}
            currencyCode={props.currency_code}
            hideSort={!state.params.query && !hasOfferCode}
            defaults={{
              taxonomy: state.params.taxonomy,
              query: state.params.query,
              sort: state.params.query || hasOfferCode ? "default" : state.params.sort,
            }}
            appendFilters={
              <>
                <CardContent asChild details>
                  <Details>
                    <DetailsToggle chevronPosition="right" className="grow">
                      Rating
                    </DetailsToggle>
                    <Fieldset role="group">
                      {range(4, 0).map((number) => (
                        <Label key={number} className="w-full">
                          <span className="flex shrink-0 items-center gap-1">
                            <RatingStars rating={number} />
                            and up
                          </span>
                          <Radio
                            wrapperClassName="ml-auto"
                            value={number}
                            aria-label={`${number} ${number === 1 ? "star" : "stars"} and up`}
                            checked={number === state.params.rating}
                            readOnly
                            onClick={() =>
                              updateParams(state.params.rating === number ? { rating: undefined } : { rating: number })
                            }
                          />
                        </Label>
                      ))}
                    </Fieldset>
                  </Details>
                </CardContent>
                {hasOfferCode ? (
                  <CardContent asChild details>
                    <Details open>
                      <DetailsToggle chevronPosition="right" className="grow">
                        Offer code
                      </DetailsToggle>
                      <div className="flex items-center justify-between gap-2 py-1">
                        <span>{props.black_friday_offer_code}</span>
                        <button
                          onClick={() => updateParams({ offer_code: undefined })}
                          className="flex cursor-pointer items-center justify-center all-unset"
                          aria-label="Remove offer code filter"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </Details>
                  </CardContent>
                ) : null}
              </>
            }
            pagination="button"
          />
        </section>
        {showRecommendationSections && recommendedWishlistsSlot !== undefined ? (
          recommendedWishlistsSlot
        ) : showRecommendationSections ? (
          <Deferred
            data={["recommended_wishlists"]}
            fallback={<RecommendedWishlists wishlists={null} title={recommendedWishlistsTitle} />}
          >
            <RecommendedWishlists wishlists={props.recommended_wishlists ?? null} title={recommendedWishlistsTitle} />
          </Deferred>
        ) : null}
      </div>
      <HomeFooter currencySelector />
    </>
  );
}

export default DiscoverResultsCore;
