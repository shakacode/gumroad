"use client";

import { Pencil, TwitterX } from "@boxicons/react";
import * as React from "react";

import { CreatorProfile } from "$app/parsers/profile";

import { NavigationButton } from "$app/components/Button";
import { CartNavigationButton } from "$app/components/Checkout/CartNavigationButton";
import { useCartItemsCount } from "$app/components/Checkout/useCartItemsCount";
import { useAppDomain } from "$app/components/DomainSettings";
import { useIsAboveBreakpoint } from "$app/components/useIsAboveBreakpoint";

export const ProfileHeaderButtons = ({ creatorProfile }: { creatorProfile: CreatorProfile }) => {
  const cartItemsCount = useCartItemsCount();
  const appDomain = useAppDomain();
  const isDesktop = useIsAboveBreakpoint("lg");

  const buttons =
    creatorProfile.can_edit || creatorProfile.twitter_handle || cartItemsCount ? (
      <div className="flex shrink-0 items-center gap-3 lg:ml-auto">
        {creatorProfile.can_edit ? (
          <NavigationButton color="filled" className="whitespace-nowrap" href={Routes.profile_url({ host: appDomain })}>
            <Pencil className="size-5" />
            Edit profile
          </NavigationButton>
        ) : null}
        {creatorProfile.twitter_handle ? (
          <NavigationButton outline href={`https://twitter.com/${creatorProfile.twitter_handle}`} target="_blank">
            <TwitterX pack="brands" className="size-5" />
          </NavigationButton>
        ) : null}
        <CartNavigationButton />
      </div>
    ) : null;

  if (!buttons) return null;
  return isDesktop ? buttons : <div className="flex basis-full p-4 pt-0">{buttons}</div>;
};
