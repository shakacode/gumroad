"use client";

import type { Page } from "@inertiajs/core";
import * as React from "react";

import AppWrapper from "$app/inertia/app_wrapper";
import type { MetaTag } from "$app/layouts/components/MetaTags";

export type GlobalProps = React.ComponentProps<typeof AppWrapper>["global"] & {
  current_seller?: unknown;
  logged_in_user?: unknown;
};

export const buildInertiaPage = (
  component: string,
  global: GlobalProps,
  pageProps: Record<string, unknown>,
  inertiaMeta?: MetaTag[],
): Page => ({
  component,
  props: { ...global, ...pageProps, _inertia_meta: inertiaMeta, errors: {} },
  url: global.href,
  version: null,
  clearHistory: false,
  encryptHistory: false,
  flash: {},
  rememberedState: {},
});
