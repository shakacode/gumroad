"use client";

import * as React from "react";

import { CoffeeProduct } from "$app/components/Product/CoffeeProduct";
import type { PriceSelection } from "$app/components/Product/ConfigurationSelector";
import {
  InteractiveProduct,
  type Props as ProductProps,
  type ServerContent,
} from "$app/components/Product/Interactive";

export const ProfileFeaturedProduct = ({
  props,
  serverContent,
}: {
  props: ProductProps;
  serverContent: ServerContent | null;
}) => {
  const [selection, setSelection] = React.useState<PriceSelection>({
    recurrence: props.product.recurrences?.default ?? null,
    price: { error: false, value: null },
    quantity: 1,
    rent: false,
    optionId: null,
    callStartTime: null,
    payInInstallments: false,
  });

  if (props.product.native_type === "coffee") return <CoffeeProduct {...props} />;
  if (!serverContent) return null;

  return (
    <InteractiveProduct
      product={props.product}
      purchase={props.purchase}
      discountCode={props.discount_code}
      wishlists={props.wishlists}
      selection={selection}
      setSelection={setSelection}
      serverContent={serverContent}
    />
  );
};
