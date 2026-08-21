"use client";

import { Pencil } from "@boxicons/react";
import * as React from "react";

import { NavigationButton } from "$app/components/Button";
import { useAppDomain } from "$app/components/DomainSettings";
import type { ProductData } from "$app/components/Product/Interactive";

export const ProductEditButton = ({ product }: { product: ProductData }) => {
  const appDomain = useAppDomain();

  if (!product.can_edit) return null;

  return (
    <NavigationButton
      className="mb-4"
      color="filled"
      href={Routes.edit_link_url({ id: product.permalink }, { host: appDomain })}
    >
      <Pencil className="size-5" aria-hidden="true" />
      Edit product
    </NavigationButton>
  );
};
