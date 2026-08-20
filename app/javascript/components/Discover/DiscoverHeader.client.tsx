"use client";

import * as React from "react";

import { Layout } from "$app/components/Discover/Layout";

export default function DiscoverHeader(props: Omit<React.ComponentProps<typeof Layout>, "children">) {
  return <Layout {...props}>{null}</Layout>;
}
