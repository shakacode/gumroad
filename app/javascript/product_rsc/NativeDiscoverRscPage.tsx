"use client";

import * as React from "react";

import type { MetaTag } from "$app/layouts/components/MetaTags";
import DiscoverIndex from "$app/pages/Discover/Index";

import NativePageRscShell, { buildInertiaPage, type GlobalProps } from "./NativePageRscShell";

export type NativeDiscoverRscPageProps = Record<string, unknown> & {
  _inertia_meta?: MetaTag[];
  global: GlobalProps;
};

export default function NativeDiscoverRscPage({
  _inertia_meta: inertiaMeta,
  global,
  ...discoverProps
}: NativeDiscoverRscPageProps) {
  const initialPage = buildInertiaPage("Discover/Index", global, discoverProps, inertiaMeta);

  return (
    <NativePageRscShell global={global} initialPage={initialPage}>
      <DiscoverIndex />
    </NativePageRscShell>
  );
}
