"use client";

import * as React from "react";

import { classNames } from "$app/utils/classNames";

import { PoweredByFooter } from "$app/components/PoweredByFooter";
import type { Props as ProductProps } from "$app/components/Product/Interactive";
import { CtaBar } from "$app/components/Product/LayoutControls";
import { useProductState } from "$app/components/Product/ProductStateProvider.client";
import { Layout as ProfileLayout } from "$app/components/Profile/Layout";
import type { PageProps as SectionsProps } from "$app/components/Profile/Sections";

export type ProductInteractionsProps = Omit<ProductProps, "discount_code"> & {
  cart?: boolean;
  hasHero?: boolean;
  main_section_index: number;
  page_layout: "discover" | "profile" | null;
  productArticle: React.ReactNode;
  serverProfileSections: Record<string, React.ReactNode>;
} & SectionsProps;

export default function ProductInteractions({
  product,
  purchase,
  cart,
  hasHero,
  main_section_index: mainSectionIndex,
  productArticle,
  serverProfileSections,
  page_layout: pageLayout,
  ...sectionProps
}: ProductInteractionsProps) {
  const { selection, ctaButtonRef, configurationSelectorRef, discountCode } = useProductState();
  const ctaLabel = cart ? "Add to cart" : undefined;

  const mainSection = (
    <section className="border-b border-border">
      <div
        className={classNames(
          "mx-auto w-full max-w-product-page lg:py-16",
          sectionProps.sections.length > 0 ? "px-4 py-8" : "p-4 lg:px-8",
        )}
      >
        {productArticle}
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
