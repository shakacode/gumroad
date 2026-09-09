import * as React from "react";

import { RecommendedWishlists } from "$app/components/Discover/RecommendedWishlists";
import type { CardWishlist } from "$app/components/Wishlist/Card";

export default function AsyncRecommendedWishlists({
  title,
  wishlistsPromise,
}: {
  title: string;
  wishlistsPromise: PromiseLike<CardWishlist[]>;
}) {
  const wishlists = React.use(wishlistsPromise);
  return <RecommendedWishlists wishlists={wishlists} title={title} />;
}
