"use client";

import * as React from "react";

import type { MetaTag } from "$app/layouts/components/MetaTags";
import UsersShow from "$app/pages/Users/Show";

import NativePageRscShell, { buildInertiaPage, type GlobalProps } from "./NativePageRscShell";

export type NativeProfileRscPageProps = Record<string, unknown> & {
  _inertia_meta?: MetaTag[];
  global: GlobalProps;
};

export default function NativeProfileRscPage({
  _inertia_meta: inertiaMeta,
  global,
  ...profileProps
}: NativeProfileRscPageProps) {
  const initialPage = buildInertiaPage("Users/Show", global, profileProps, inertiaMeta);

  return (
    <NativePageRscShell global={global} initialPage={initialPage}>
      <UsersShow />
    </NativePageRscShell>
  );
}
