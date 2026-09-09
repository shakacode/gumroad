import * as React from "react";

import { CoffeeProduct } from "$app/components/Product/CoffeeProduct";
import type { Props as ProductProps, ServerContent } from "$app/components/Product/Interactive";
import ProductArticle from "$app/components/Product/ProductArticle";
import { FeaturedProductStateProvider } from "$app/components/Product/ProductStateProvider.client";

export const ProfileFeaturedProduct = ({
  props,
  serverContent,
}: {
  props: ProductProps;
  serverContent: ServerContent | null;
}) => {
  if (props.product.native_type === "coffee") return <CoffeeProduct {...props} />;
  if (!serverContent) return null;

  return (
    <FeaturedProductStateProvider product={props.product} initialDiscountCode={props.discount_code}>
      <ProductArticle
        product={props.product}
        purchase={props.purchase}
        wishlists={props.wishlists}
        serverContent={serverContent}
        showEditButton={false}
      />
    </FeaturedProductStateProvider>
  );
};
