"use client";

import * as React from "react";

import type { MetaTag } from "$app/layouts/components/MetaTags";
import UsersShow from "$app/pages/Users/Show";

import PageShell, { buildInertiaPage, type GlobalProps } from "$app/components/PublicPages/PageShell.client";

export type ProfileRscCompatibilityPageProps = Record<string, unknown> & {
  _inertia_meta?: MetaTag[];
  global: GlobalProps;
};

export default function ProfileRscCompatibilityPage({
  _inertia_meta: inertiaMeta,
  global,
  ...profileProps
}: ProfileRscCompatibilityPageProps) {
  const initialPage = buildInertiaPage("Users/Show", global, profileProps, inertiaMeta);

  return (
    <PageShell global={global} initialPage={initialPage}>
      <UsersShow />
    </PageShell>
  );
}
