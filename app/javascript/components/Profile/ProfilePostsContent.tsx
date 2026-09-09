import { ArrowUpRight } from "@boxicons/react";
import * as React from "react";

import { formatPostDate } from "$app/utils/date";

type Post = { id: string; slug: string; name: string; published_at: string | null };

export const ProfilePostsContent = ({ posts, locale }: { posts: Post[]; locale: string }) => (
  <>
    {posts.map((post) => (
      <a
        key={post.slug}
        href={Routes.custom_domain_view_post_path(post.slug)}
        className="flex justify-between gap-4 border-b border-border py-8 no-underline first:pt-0 last:border-b-0 last:pb-0"
      >
        <div>
          <h2>{post.name}</h2>
          <time>{formatPostDate(post.published_at, locale)}</time>
        </div>
        <ArrowUpRight className="size-5 text-lg" />
      </a>
    ))}
  </>
);
