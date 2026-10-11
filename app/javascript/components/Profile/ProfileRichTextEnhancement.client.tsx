"use client";

import * as React from "react";

import { fetchWithOneRetry } from "$app/utils/lazy_chunk";

const importProfileRichText = () => import("$app/components/Profile/ProfileRichText.client");
const ProfileRichText = React.lazy(() => fetchWithOneRetry(importProfileRichText));

export class ProfileRichTextLoadBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}

export const ProfileRichTextEnhancement = ({
  content,
  fallback,
}: {
  content: Record<string, unknown>;
  fallback?: React.ReactNode;
}) => (
  <ProfileRichTextLoadBoundary fallback={fallback}>
    <React.Suspense fallback={fallback ?? null}>
      <ProfileRichText content={content} fallback={fallback ?? null} />
    </React.Suspense>
  </ProfileRichTextLoadBoundary>
);
