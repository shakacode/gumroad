"use client";

import { Archive } from "@boxicons/react";
import * as React from "react";

import { Card as WishlistCard, CardGrid as WishlistCardGrid, type CardWishlist } from "$app/components/Wishlist/Card";

export const ProfileWishlists = ({ wishlists }: { wishlists: CardWishlist[] }) =>
  wishlists.length > 0 ? (
    <WishlistCardGrid>
      {wishlists.map((wishlist) => (
        <WishlistCard key={wishlist.id} wishlist={wishlist} hideSeller />
      ))}
    </WishlistCardGrid>
  ) : (
    <div className="flex h-full flex-col content-center gap-4 text-center">
      <h1>
        <Archive pack="filled" className="size-5" />
      </h1>
      No wishlists selected
    </div>
  );
