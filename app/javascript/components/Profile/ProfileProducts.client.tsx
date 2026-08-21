"use client";

import * as React from "react";

import { ProductsSection as SavedProductsSection } from "$app/data/profile_settings";
import { SearchResults } from "$app/data/search";
import { CreatorProfile } from "$app/parsers/profile";
import { CurrencyCode } from "$app/utils/currency";

import { CardGrid, useSearchReducer } from "$app/components/Product/CardGrid";
import { CardContent } from "$app/components/ui/Card";
import { Input } from "$app/components/ui/Input";

export type ProfileProductsSection = Pick<SavedProductsSection, "type" | "show_filters" | "default_product_sort"> & {
  id: string;
  header: string | null;
  search_results: SearchResults;
};

export const ProfileProducts = ({
  section,
  creatorProfile,
  currencyCode,
  initialCards,
}: {
  section: ProfileProductsSection;
  creatorProfile: CreatorProfile;
  currencyCode: CurrencyCode;
  initialCards?: React.ReactNode;
}) => {
  const defaultParams = {
    sort: section.default_product_sort,
    user_id: creatorProfile.external_id,
    section_id: section.id,
  };
  const [state, dispatch] = useSearchReducer({
    params: defaultParams,
    results: section.search_results,
  });
  const [enteredQuery, setEnteredQuery] = React.useState("");
  const initialProducts = section.search_results.products;
  const hasInitialCards =
    initialCards !== undefined &&
    state.results !== null &&
    initialProducts.every((product, index) => state.results?.products[index]?.permalink === product.permalink);

  return (
    <CardGrid
      hideFilters={!section.show_filters}
      state={state}
      dispatchAction={dispatch}
      initialCards={hasInitialCards ? initialCards : undefined}
      initialCardCount={hasInitialCards ? initialProducts.length : undefined}
      title={
        state.results
          ? state.results.total > 0
            ? `1-${state.results.products.length} of ${state.results.total} products`
            : "No products found"
          : "Loading products..."
      }
      currencyCode={currencyCode}
      defaults={defaultParams}
      prependFilters={
        <CardContent>
          <Input
            aria-label="Search products"
            placeholder="Search products"
            value={enteredQuery}
            onChange={(e) => setEnteredQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                const { from: _, ...params } = state.params;
                dispatch({ type: "set-params", params: { ...params, query: enteredQuery } });
              }
            }}
            className="grow"
          />
        </CardContent>
      }
    />
  );
};
