import * as React from "react";

import { classNames } from "$app/utils/classNames";

import { Logo } from "$app/components/Logo";
import { ProductFooterCurrencySelector } from "$app/components/Product/ProductFooterCurrencySelector.client";

export const ProductFooter = ({
  className,
  detectedCurrency,
  rootDomain,
  shownCurrency,
}: {
  className?: string | undefined;
  detectedCurrency?: string | null | undefined;
  rootDomain: string;
  shownCurrency?: string | null | undefined;
}) => (
  <footer
    className={classNames(
      "flex flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left lg:py-16",
      className,
    )}
  >
    <div>
      Powered by{" "}
      <a href={Routes.root_url({ host: rootDomain })}>
        <Logo />
      </a>
    </div>
    <ProductFooterCurrencySelector detectedCurrency={detectedCurrency} shownCurrency={shownCurrency} />
  </footer>
);
