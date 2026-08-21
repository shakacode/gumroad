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
import {
  Section,
  type FeaturedProductRenderer,
  type PageProps as SectionsProps,
} from "$app/components/Profile/Sections";

export type ProductInteractionsProps = ProductProps & {
  cart?: boolean;
  featuredProductServerContent: Record<string, ServerContent>;
  hasHero?: boolean;
  main_section_index: number;
  page_layout: "discover" | "profile" | null;
  profilePostsServerContent: Record<string, React.ReactNode>;
  profileRichTextServerContent: Record<string, React.ReactNode>;
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
  featuredProductServerContent,
  profilePostsServerContent,
  profileRichTextServerContent,
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

  const renderFeaturedProduct: FeaturedProductRenderer = ({ sectionId, props, selection, setSelection }) => {
    const featuredServerContent = featuredProductServerContent[sectionId];
    if (!featuredServerContent) return null;

    return (
      <InteractiveProduct
        product={props.product}
        purchase={props.purchase}
        discountCode={props.discount_code}
        wishlists={props.wishlists}
        selection={selection}
        setSelection={setSelection}
        serverContent={featuredServerContent}
      />
    );
  };

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
              <Section
                section={section}
                {...sectionProps}
                renderFeaturedProduct={renderFeaturedProduct}
                postsContent={profilePostsServerContent[section.id]}
                richTextServerContent={profileRichTextServerContent[section.id]}
              />
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
