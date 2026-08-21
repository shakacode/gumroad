"use client";

import * as React from "react";

import { classNames } from "$app/utils/classNames";

import { PoweredByFooter } from "$app/components/PoweredByFooter";
import type { ConfigurationSelectorHandle } from "$app/components/Product/ConfigurationSelector";
import {
  InteractiveProduct,
  useSelectionFromUrl,
  type Props as ProductProps,
  type ServerContent,
} from "$app/components/Product/Interactive";
import { CtaBar, EditButton } from "$app/components/Product/LayoutControls";
import { Layout as ProfileLayout } from "$app/components/Profile/Layout";
import type { PageProps as SectionsProps } from "$app/components/Profile/Sections";

export type ProductInteractionsProps = ProductProps & {
  cart?: boolean;
  hasHero?: boolean;
  main_section_index: number;
  page_layout: "discover" | "profile" | null;
  serverProfileSections: Record<string, React.ReactNode>;
  serverContent: ServerContent;
} & SectionsProps;

export default function ProductInteractions({
  product,
  purchase,
  discount_code: discountCode,
  cart,
  hasHero,
  wishlists,
  main_section_index: mainSectionIndex,
  serverContent,
  serverProfileSections,
  page_layout: pageLayout,
  ...sectionProps
}: ProductInteractionsProps) {
  const [selection, setSelection] = useSelectionFromUrl(product);
  const ctaButtonRef = React.useRef<HTMLAnchorElement>(null);
  const configurationSelectorRef = React.useRef<ConfigurationSelectorHandle>(null);
  const ctaLabel = cart ? "Add to cart" : undefined;

  const productView = (
    <>
      <EditButton product={product} />
      <InteractiveProduct
        product={product}
        purchase={purchase}
        discountCode={discountCode}
        ctaLabel={ctaLabel}
        selection={selection}
        setSelection={setSelection}
        ctaButtonRef={ctaButtonRef}
        configurationSelectorRef={configurationSelectorRef}
        wishlists={wishlists}
        serverContent={serverContent}
      />
    </>
  );

  const mainSection = (
    <section className="border-b border-border">
      <div
        className={classNames(
          "mx-auto w-full max-w-product-page lg:py-16",
          sectionProps.sections.length > 0 ? "px-4 py-8" : "p-4 lg:px-8",
        )}
      >
        {productView}
      </div>
    </section>
  );

  const content = (
    <>
      <CtaBar
        product={product}
        purchase={purchase}
        discountCode={discountCode}
        ctaLabel={ctaLabel}
        selection={selection}
        ctaButtonRef={ctaButtonRef}
        configurationSelectorRef={configurationSelectorRef}
        hasHero={!!hasHero}
      />
      {sectionProps.sections.length > 0
        ? sectionProps.sections.map((section, index) => (
            <React.Fragment key={section.id}>
              {index === mainSectionIndex ? mainSection : null}
              {serverProfileSections[section.id]}
              {mainSectionIndex >= sectionProps.sections.length && index === sectionProps.sections.length - 1
                ? mainSection
                : null}
            </React.Fragment>
          ))
        : mainSection}
    </>
  );

  if (pageLayout === "discover") return content;

  if (pageLayout === "profile") {
    return (
      <ProfileLayout
        creatorProfile={sectionProps.creator_profile}
        currencySelector
        shownCurrency={product.buyer_currency_display?.buyer_currency_shown}
      >
        {content}
      </ProfileLayout>
    );
  }

  return (
    <>
      {content}
      <PoweredByFooter currencySelector shownCurrency={product.buyer_currency_display?.buyer_currency_shown} />
    </>
  );
}
