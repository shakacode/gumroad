"use client";

import { Share } from "@boxicons/react";
import * as React from "react";

import { fetchWithOneRetry } from "$app/utils/lazy_chunk";

import { Button } from "$app/components/Button";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "$app/components/Popover";
import { Alert } from "$app/components/ui/Alert";

const importProductShareMenu = () => import("$app/components/Product/ProductShareMenu");
const ProductShareMenu = React.lazy(() => fetchWithOneRetry(importProductShareMenu));

class ProductShareMenuBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    if (!this.state.failed) return this.props.children;

    return (
      <Alert role="alert" variant="danger">
        <div className="grid gap-4">
          Sharing options could not be loaded.
          <Button onClick={() => window.location.reload()}>Reload and try again</Button>
        </div>
      </Alert>
    );
  }
}

export const ProductShare = ({ url, name }: { url: string; name: string }) => (
  <Popover>
    <PopoverAnchor>
      <PopoverTrigger aria-label="Share" asChild>
        <Button size="icon">
          <Share className="size-5" />
        </Button>
      </PopoverTrigger>
    </PopoverAnchor>
    <PopoverContent sideOffset={4} onFocusOutside={(event) => event.preventDefault()}>
      <ProductShareMenuBoundary>
        <React.Suspense
          fallback={
            <span className="sr-only" role="status">
              Loading sharing options…
            </span>
          }
        >
          <ProductShareMenu url={url} name={name} />
        </React.Suspense>
      </ProductShareMenuBoundary>
    </PopoverContent>
  </Popover>
);
