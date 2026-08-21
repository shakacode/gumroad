"use client";

import * as React from "react";

import { classNames } from "$app/utils/classNames";

import { CtaBar } from "$app/components/Product/LayoutControls";
import type { ProductInteractionsProps } from "$app/components/Product/ProductPage.types";
import { useProductState } from "$app/components/Product/ProductStateProvider.client";

export default function ProductInteractions({
  product,
  purchase,
  cart,
  hasHero,
  main_section_index: mainSectionIndex,
  productArticle,
  serverProfileSections,
  sections,
}: ProductInteractionsProps) {
  const { selection, ctaButtonRef, configurationSelectorRef, discountCode } = useProductState();
  const ctaLabel = cart ? "Add to cart" : undefined;

  const mainSection = (
    <section className="border-b border-border">
      <div
        className={classNames(
          "mx-auto w-full max-w-product-page lg:py-16",
          sections.length > 0 ? "px-4 py-8" : "p-4 lg:px-8",
        )}
      >
        {productArticle}
      </div>
    </section>
  );

  return (
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
      {sections.length > 0
        ? sections.map((section, index) => (
            <React.Fragment key={section.id}>
              {index === mainSectionIndex ? mainSection : null}
              {serverProfileSections[section.id]}
              {mainSectionIndex >= sections.length && index === sections.length - 1 ? mainSection : null}
            </React.Fragment>
          ))
        : mainSection}
    </>
  );
}
