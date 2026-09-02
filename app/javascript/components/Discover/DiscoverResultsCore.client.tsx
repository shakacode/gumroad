import { X } from "@boxicons/react";
import { router, usePage } from "@inertiajs/react";
import { range } from "lodash-es";
import * as React from "react";
import typia from "typia";

import { SearchRequest, SearchResults } from "$app/data/search";
import { CurrencyCode } from "$app/utils/currency";
import { discoverTitleGenerator, Taxonomy } from "$app/utils/discover";

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

type Props = {
  currency_code: CurrencyCode;
  search_results: SearchResults;
  taxonomies_for_nav: Taxonomy[];
  curated_product_ids: string[];
  black_friday_offer_code: string;
};

const sortTitles = {
  curated: "Curated for you",
  trending: "On the market",
  hot_and_new: "Hot and new products",
  best_sellers: "Best selling products",
};

const parseUrlParams = (href: string, curatedProductIds: string[], defaultSortOrder: string | undefined) => {
  const url = new URL(href);
  const parsedParams: SearchRequest = {
    taxonomy: url.pathname === Routes.discover_path() ? undefined : url.pathname.replace("/", ""),
    curated_product_ids: curatedProductIds,
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

export function DiscoverResultsCore() {
  const props = typia.assert<Props>(usePage().props);
  const originalLocation = useOriginalLocation();
  const defaultSortOrder = props.curated_product_ids.length > 0 ? "curated" : undefined;

  const initialParsed = parseUrlParams(originalLocation, props.curated_product_ids, defaultSortOrder);
  const sortWasExplicitRef = React.useRef(initialParsed.sortWasExplicit);

  const [state, dispatch] = useSearchReducer({
    params: initialParsed.params,
    results: props.search_results,
  });

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

    document.title = discoverTitleGenerator(
      state.params,
      props.taxonomies_for_nav,
      url.search,
      sortWasExplicitRef.current ? undefined : defaultSortOrder,
    );
  }, [state.params, props.taxonomies_for_nav, defaultSortOrder]);

  React.useEffect(() => {
    const handlePopstate = () => {
      const { params: newParams, sortWasExplicit } = parseUrlParams(
        window.location.href,
        props.curated_product_ids,
        defaultSortOrder,
      );
      sortWasExplicitRef.current = sortWasExplicit;
      dispatch({ type: "set-params", params: newParams });
    };
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, [defaultSortOrder, props.curated_product_ids]);

  const updateParams = (newParams: Partial<SearchRequest>) => {
    if ("sort" in newParams) sortWasExplicitRef.current = true;
    dispatch({ type: "set-params", params: { ...state.params, from: undefined, ...newParams } });
  };

  const hasOfferCode = !!state.params.offer_code;

  return (
    <>
      <div className="grid gap-16! px-4 py-16 lg:ps-16 lg:pe-16">
        <section className="flex flex-col gap-4">
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
                        curated_product_ids: props.curated_product_ids,
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
      </div>
      <HomeFooter currencySelector />
    </>
  );
}

export default DiscoverResultsCore;
