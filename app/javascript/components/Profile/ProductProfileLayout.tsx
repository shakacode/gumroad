import { Star } from "@boxicons/react";
import * as React from "react";

import { CreatorProfile } from "$app/parsers/profile";

import { TopCreatorBadge } from "$app/components/Product/AuthorByline";
import { ProductFooter } from "$app/components/Product/ProductFooter";
import { FollowForm } from "$app/components/Profile/FollowForm";
import { ProfileHeaderButtons, ProfileImpersonateButton } from "$app/components/Profile/ProfileHeaderActions.client";
import { Avatar } from "$app/components/ui/Avatar";
import { WithTooltip } from "$app/components/WithTooltip";

// Keep this separate from the legacy client Layout so the RSC build cannot classify this shell as a client module.
export const ProductProfileLayout = ({
  creatorProfile,
  rootDomain,
  shownCurrency,
  children,
}: {
  creatorProfile: CreatorProfile;
  rootDomain: string;
  shownCurrency?: string | null | undefined;
  children?: React.ReactNode;
}) => (
  <div className="flex min-h-screen flex-col">
    <header className="z-20 border-border bg-background text-lg lg:border-b lg:px-4 lg:py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap lg:flex-nowrap lg:items-center lg:gap-6">
        <div className="relative flex min-w-0 grow flex-wrap items-center gap-3 border-b border-border p-4 lg:flex-1 lg:flex-nowrap lg:border-0 lg:p-0">
          <ProfileImpersonateButton creatorProfile={creatorProfile} />
          {creatorProfile.avatar_url ? <Avatar src={creatorProfile.avatar_url} alt="Profile Picture" /> : null}
          <a href={Routes.root_path()} className="flex max-w-full min-w-0 items-center gap-2 no-underline">
            <span className="truncate">{creatorProfile.name}</span>
            {creatorProfile.is_verified ? (
              <WithTooltip tip="Top creator" position="bottom" className="shrink-0">
                <TopCreatorBadge />
              </WithTooltip>
            ) : null}
          </a>
          {creatorProfile.reputation ? (
            <div className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-muted" aria-label="Creator rating">
              <Star pack="filled" className="size-4" />
              {`${creatorProfile.reputation.average} from ${creatorProfile.reputation.count} verified ${creatorProfile.reputation.count === 1 ? "review" : "reviews"} across ${creatorProfile.reputation.products_count} products`}
            </div>
          ) : null}
        </div>
        <div className="flex basis-full items-center gap-3 border-b border-border p-4 lg:basis-auto lg:border-0 lg:p-0">
          <FollowForm creatorProfile={creatorProfile} />
        </div>
        <ProfileHeaderButtons creatorProfile={creatorProfile} />
      </div>
    </header>
    <main className="flex flex-1 flex-col">
      {children}
      <ProductFooter className="mx-auto w-full max-w-6xl" rootDomain={rootDomain} shownCurrency={shownCurrency} />
    </main>
  </div>
);
