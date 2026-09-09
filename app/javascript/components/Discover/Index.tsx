"use client";

import { Link, usePage } from "@inertiajs/react";
import * as React from "react";
import typia from "typia";

import type { CurrencyCode } from "$app/utils/currency";

import BlackFridayHero, {
  BlackFridayButtonFrame,
  type BlackFridayStats,
  blackFridayButtonClassName,
} from "$app/components/Discover/BlackFridayHero";
import DiscoverResultsCore, { type DiscoverPageLayoutProps } from "$app/components/Discover/DiscoverResultsCore.client";
import { useOriginalLocation } from "$app/components/useOriginalLocation";

type Props = {
  black_friday_offer_code: string;
  black_friday_stats?: BlackFridayStats | null;
  currency_code: CurrencyCode;
  is_black_friday_page: boolean;
  show_black_friday_hero?: boolean;
};

export function DiscoverIndex({
  renderLayout,
}: {
  renderLayout?: ((props: DiscoverPageLayoutProps, children: React.ReactNode) => React.ReactNode) | undefined;
}) {
  const props = typia.assert<Props>(usePage().props);
  const url = new URL(useOriginalLocation());
  const taxonomyPath = url.pathname === Routes.discover_path() ? undefined : url.pathname.replace(/^\//u, "");
  const dealUrl = taxonomyPath
    ? Routes.discover_taxonomy_path(taxonomyPath, { offer_code: props.black_friday_offer_code })
    : Routes.discover_path({ offer_code: props.black_friday_offer_code });

  const blackFridayHero = props.show_black_friday_hero ? (
    <BlackFridayHero
      currencyCode={props.currency_code}
      stats={props.black_friday_stats}
      cta={
        props.is_black_friday_page ? null : (
          <BlackFridayButtonFrame>
            <Link href={dealUrl} className={blackFridayButtonClassName()}>
              Get Black Friday deals
            </Link>
          </BlackFridayButtonFrame>
        )
      }
    />
  ) : null;

  return <DiscoverResultsCore blackFridayHero={blackFridayHero} renderLayout={renderLayout} />;
}

DiscoverIndex.loggedInUserLayout = true;
export default DiscoverIndex;
