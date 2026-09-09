import * as React from "react";

import { classNames } from "$app/utils/classNames";
import { type CurrencyCode, formatPriceCentsWithCurrencySymbol } from "$app/utils/currency";

import blackFridayImage from "$assets/images/illustrations/black_friday.svg";
import saleImage from "$assets/images/illustrations/sale.svg";

export type BlackFridayStats = {
  active_deals_count: number;
  revenue_cents: number;
  average_discount_percentage: number;
};

export const blackFridayButtonClassName = ({
  size = "default",
  variant = "pink",
}: {
  size?: "small" | "default";
  variant?: "light" | "dark" | "pink";
} = {}) =>
  classNames(
    "relative inline-flex rounded-sm no-underline items-center justify-center border border-black transition-all duration-150 group-hover:-translate-x-2 group-hover:-translate-y-2 z-3 w-full lg:w-auto",
    {
      light: "bg-black text-white",
      dark: "bg-white text-black",
      pink: "bg-pink text-black",
    }[variant],
    {
      small: "h-12 px-3 text-base lg:h-12 lg:px-6 lg:text-base",
      default: "h-14 px-8 text-xl lg:h-16 lg:px-10 lg:text-xl",
    }[size],
  );

export const BlackFridayButtonFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="group relative inline-block">
    <div className="absolute inset-0 z-2 rounded-sm border border-black bg-yellow transition-transform duration-150" />
    <div className="absolute inset-0 z-1 rounded-sm border border-black bg-red transition-transform duration-150 group-hover:translate-x-2 group-hover:translate-y-2" />
    {children}
  </div>
);

const BlackFridayBanner = ({ stats, currencyCode }: { stats: BlackFridayStats; currencyCode: CurrencyCode }) => (
  <div className="flex h-full shrink-0 items-center gap-x-4 [&>*]:flex-shrink-0">
    <span className="mx-2 inline-block text-lg text-black">✦</span>
    <span className="flex items-center text-xl font-medium text-black">BLACK FRIDAY IS LIVE</span>
    {stats.active_deals_count > 0 ? (
      <>
        <span className="mx-2 inline-block text-lg text-black">✦</span>
        <span className="flex items-center text-xl font-medium text-black">
          <span className="mr-1.5 font-bold">{stats.active_deals_count.toLocaleString()}</span>ACTIVE DEALS
        </span>
      </>
    ) : null}
    <span className="mx-2 inline-block text-lg text-black">✦</span>
    <span className="flex items-center text-xl font-medium text-black">CREATOR-MADE PRODUCTS</span>
    {stats.revenue_cents > 0 ? (
      <>
        <span className="mx-2 inline-block text-lg text-black">✦</span>
        <span className="flex items-center text-xl font-medium text-black">
          <span className="mr-1.5 font-bold">
            {formatPriceCentsWithCurrencySymbol(currencyCode, stats.revenue_cents, { symbolFormat: "short" })}
          </span>
          IN SALES SO FAR
        </span>
      </>
    ) : null}
    <span className="mx-2 inline-block text-lg text-black">✦</span>
    <span className="flex items-center text-xl font-medium text-black">BIG SAVINGS</span>
    {stats.average_discount_percentage > 0 ? (
      <>
        <span className="mx-2 inline-block text-lg text-black">✦</span>
        <span className="flex items-center text-xl font-medium text-black">
          <span className="mr-1.5 font-bold">{stats.average_discount_percentage}%</span>AVERAGE DISCOUNT
        </span>
      </>
    ) : null}
  </div>
);

export default function BlackFridayHero({
  cta,
  currencyCode,
  stats,
}: {
  cta: React.ReactNode;
  currencyCode: CurrencyCode;
  stats?: BlackFridayStats | null | undefined;
}) {
  return (
    <header className="relative flex flex-col items-center justify-center">
      <div className="relative flex min-h-[72vh] w-full flex-col items-center justify-center bg-black">
        <img
          src={saleImage}
          alt="Sale"
          className="absolute top-1/2 left-40 hidden w-32 -translate-y-1/2 rotate-[-24deg] object-contain md:left-12 md:block md:w-40 lg:left-36 lg:w-48 xl:left-60 xl:w-60"
          draggable={false}
        />
        <div className="relative">
          <img src={blackFridayImage} alt="Black Friday" className="max-w-96 object-contain" draggable={false} />
          <img
            src={saleImage}
            alt="Sale"
            className="absolute right-0 bottom-0 w-27.5 rotate-[16deg] object-contain md:hidden"
            draggable={false}
          />
        </div>
        <img
          src={saleImage}
          alt="Sale"
          className="absolute top-1/2 right-40 hidden w-32 -translate-y-1/2 rotate-[24deg] object-contain md:right-12 md:block md:w-40 lg:right-36 lg:w-48 xl:right-60 xl:w-60"
          draggable={false}
        />
        <div className="font-regular mx-12 text-center text-xl text-white">
          Snag creator-made deals <br className="block sm:hidden" /> before they're gone.
        </div>
        {cta ? <div className="mt-8 text-base">{cta}</div> : null}
      </div>
      <div className="h-14 w-full overflow-hidden border-b border-black bg-yellow-400">
        <div className="flex h-14 min-w-fit items-center gap-x-4 whitespace-nowrap hover:[animation-play-state:paused] motion-safe:animate-[marquee-scroll_80s_linear_infinite] motion-reduce:animate-none">
          {stats
            ? Array.from({ length: 5 }, (_, index) => (
                <BlackFridayBanner key={index} stats={stats} currencyCode={currencyCode} />
              ))
            : null}
        </div>
      </div>
    </header>
  );
}
