"use client";

import { ArrowLeft, ArrowRight } from "@boxicons/react";
import * as React from "react";

import type { CardProduct } from "$app/parsers/product";

import { HorizontalCard } from "$app/components/Product/Card";
import { Skeleton } from "$app/components/Skeleton";
import { useScrollableCarousel } from "$app/components/useScrollableCarousel";

export const RecommendedProductsSkeleton = () => (
  <section className="grid gap-4">
    <header>
      <h2>Featured products</h2>
    </header>
    <div className="override grid min-h-96 auto-cols-[min(20rem,60vw)] grid-flow-col gap-6 overflow-x-auto pb-1 [scrollbar-width:none] lg:auto-cols-[40rem] [&::-webkit-scrollbar]:hidden">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-96" />
      ))}
    </div>
  </section>
);

export const RecommendedProducts = ({ products, title }: { products: CardProduct[]; title: string }) => {
  const [active, setActive] = React.useState(0);
  const { itemsRef, handleScroll } = useScrollableCarousel(active, setActive);
  const [dragStart, setDragStart] = React.useState<number | null>(null);

  return (
    <section className="grid gap-4">
      <header className="flex items-center justify-between">
        <h2>{title}</h2>
        <div className="flex items-center gap-2">
          <button
            className="cursor-pointer all-unset"
            onClick={() => setActive((active + products.length - 1) % products.length)}
          >
            <ArrowLeft className="size-6" />
          </button>
          {active + 1} / {products.length}
          <button
            className="cursor-pointer all-unset"
            onClick={() => setActive((active + products.length + 1) % products.length)}
          >
            <ArrowRight className="size-6" />
          </button>
        </div>
      </header>
      <div className="relative">
        <div
          className="override grid min-h-96 auto-cols-[min(20rem,60vw)] grid-flow-col gap-6 overflow-x-auto pb-1 [scrollbar-width:none] lg:auto-cols-[40rem] [&::-webkit-scrollbar]:hidden"
          ref={itemsRef}
          style={{ scrollSnapType: dragStart != null ? "none" : undefined }}
          onScroll={handleScroll}
          onMouseDown={(e) => setDragStart(e.clientX)}
          onMouseMove={(e) => {
            if (dragStart == null || !itemsRef.current) return;
            itemsRef.current.scrollLeft -= e.movementX;
          }}
          onClick={(e) => {
            if (dragStart != null && Math.abs(e.clientX - dragStart) > 30) e.preventDefault();
            setDragStart(null);
          }}
          onMouseOut={() => setDragStart(null)}
        >
          {products.map((product, idx) => (
            // Only the first three cards are visible without scrolling.
            <HorizontalCard key={product.id} product={product} big eager={idx < 3} />
          ))}
        </div>
      </div>
    </section>
  );
};
