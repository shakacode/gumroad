"use client";

import * as React from "react";

import { ProfilePostsContent } from "$app/components/Profile/ProfilePostsContent";
import { useUserAgentInfo } from "$app/components/UserAgent";

export const PostsView = ({ posts }: Pick<React.ComponentProps<typeof ProfilePostsContent>, "posts">) => {
  const { locale } = useUserAgentInfo();
  return <ProfilePostsContent posts={posts} locale={locale} />;
};
