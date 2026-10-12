"use client";

import { ArrowUpRight } from "@boxicons/react";
import { parseISO } from "date-fns";
import * as React from "react";

import { formatPostDate } from "$app/utils/date";

import { useProductHydration } from "$app/components/PublicPages/ProductHydration.client";
import { useUserAgentInfo } from "$app/components/UserAgent";

type Post = { id: string; slug: string; name: string; published_at: string | null };

export const ProfilePostsContent = ({ posts }: { posts: Post[] }) => {
  const snapshot = useProductHydration();
  const userAgentInfo = useUserAgentInfo();
  const formatPublishedDate = (date: string | null) =>
    snapshot
      ? (date ? parseISO(date) : new Date(snapshot.referenceTime)).toLocaleDateString(snapshot.locale, {
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: snapshot.timeZone,
        })
      : formatPostDate(date, userAgentInfo.locale);

  return (
    <>
      {posts.map((post) => (
        <a
          key={post.slug}
          href={Routes.custom_domain_view_post_path(post.slug)}
          className="flex justify-between gap-4 border-b border-border py-8 no-underline first:pt-0 last:border-b-0 last:pb-0"
        >
          <div>
            <h2>{post.name}</h2>
            <time>{formatPublishedDate(post.published_at)}</time>
          </div>
          <ArrowUpRight className="size-5 text-lg" />
        </a>
      ))}
    </>
  );
};
