"use client";

import * as React from "react";

import { fetchWithOneRetry } from "$app/utils/lazy_chunk";

import type { RefundPolicy } from "$app/components/Product/Interactive";
import { useRunOnce } from "$app/components/useRunOnce";

const HASH = "#refund-policy";
const importProductRefundPolicyModal = () => import("$app/components/Product/ProductRefundPolicyModal");
const ProductRefundPolicyModal = React.lazy(() => fetchWithOneRetry(importProductRefundPolicyModal));

class ProductRefundPolicyModalBoundary extends React.Component<
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

export const ProductRefundPolicy = ({ refundPolicy, permalink }: { refundPolicy: RefundPolicy; permalink: string }) => {
  const [viewingRefundPolicy, setViewingRefundPolicy] = React.useState(false);

  useRunOnce(() => {
    setViewingRefundPolicy(window.location.hash === HASH);
  });

  const handleCloseModal = () => {
    setViewingRefundPolicy(false);
    window.history.replaceState(window.history.state, "", window.location.href.split("#")[0]);
  };

  if (!refundPolicy.fine_print) return <div className="text-center">{refundPolicy.title}</div>;

  const finePrintFallback = (
    <section aria-label={refundPolicy.title} className="grid gap-4">
      <h3>{refundPolicy.title}</h3>
      <div dangerouslySetInnerHTML={{ __html: refundPolicy.fine_print }} style={{ display: "contents" }}></div>
    </section>
  );

  return (
    <>
      <div className="text-center">
        <a href={HASH} onClick={() => setViewingRefundPolicy(true)}>
          {refundPolicy.title}
        </a>
      </div>
      {viewingRefundPolicy ? (
        <ProductRefundPolicyModalBoundary fallback={finePrintFallback}>
          <React.Suspense fallback={<span className="sr-only">Loading refund policy…</span>}>
            <ProductRefundPolicyModal refundPolicy={refundPolicy} permalink={permalink} onClose={handleCloseModal} />
          </React.Suspense>
        </ProductRefundPolicyModalBoundary>
      ) : null}
    </>
  );
};
