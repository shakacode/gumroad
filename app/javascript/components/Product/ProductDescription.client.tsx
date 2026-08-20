"use client";

import * as React from "react";

import { fetchWithOneRetry } from "$app/utils/lazy_chunk";

import { CollapsibleDescription } from "$app/components/Product/CollapsibleDescription";

const ENHANCEMENT_IDLE_TIMEOUT_MS = 2000;
const ENHANCEMENT_FALLBACK_DELAY_MS = 500;
const importProductDescriptionEnhancement = () => import("$app/components/Product/ProductDescriptionEnhancement");
const ProductDescriptionEnhancement = React.lazy(() => fetchWithOneRetry(importProductDescriptionEnhancement));

class ProductDescriptionEnhancementBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export type PublicFile = {
  id: string;
  name: string;
  extension: string | null;
  file_size: number | null;
  url: string | null;
};

const ProductDescription = ({
  descriptionHtml,
  initialContent,
  publicFiles,
}: {
  descriptionHtml: string | null;
  initialContent: React.ReactNode;
  publicFiles: PublicFile[];
}) => {
  const [pageLoaded, setPageLoaded] = React.useState(false);

  React.useEffect(() => {
    const enhance = () => setPageLoaded(true);

    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(enhance, { timeout: ENHANCEMENT_IDLE_TIMEOUT_MS });
      return () => window.cancelIdleCallback(handle);
    }

    const timer = window.setTimeout(enhance, ENHANCEMENT_FALLBACK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <CollapsibleDescription>
      {/* Mixed-language blocks derive their own direction through _rich_text.scss. */}
      {pageLoaded ? (
        <ProductDescriptionEnhancementBoundary fallback={initialContent}>
          <React.Suspense fallback={initialContent}>
            <ProductDescriptionEnhancement descriptionHtml={descriptionHtml} publicFiles={publicFiles} />
          </React.Suspense>
        </ProductDescriptionEnhancementBoundary>
      ) : (
        initialContent
      )}
    </CollapsibleDescription>
  );
};

export default ProductDescription;
