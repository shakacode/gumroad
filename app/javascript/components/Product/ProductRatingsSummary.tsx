import * as React from "react";

import type { Ratings } from "$app/parsers/product";
import { classNames } from "$app/utils/classNames";

import { RatingStars } from "$app/components/RatingStars";

export const ProductRatingsSummary = ({ ratings, className }: { ratings: Ratings; className?: string }) => (
  <div className={classNames("flex shrink-0 items-center", className)}>
    <RatingStars rating={ratings.average} />
    <span className="rating-number ml-1">
      {ratings.count} {ratings.count === 1 ? "rating" : "ratings"}
    </span>
  </div>
);
