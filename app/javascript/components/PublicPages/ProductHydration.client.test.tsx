// @vitest-environment happy-dom
import * as React from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

import { DiscountExpirationCountdown } from "$app/components/Product/DiscountExpirationCountdown";
import { PriceTag } from "$app/components/Product/PriceTag";
import { ProductPreorderNotice } from "$app/components/Product/ProductPreorderNotice.client";
import { ProductHydrationProvider, useProductHydration } from "$app/components/PublicPages/ProductHydration.client";

const roots: Root[] = [];
const snapshot = { locale: "en-US", timeZone: "UTC", referenceTime: Date.parse("2030-01-01T00:00:00Z") };

vi.mock("$app/utils/countdown", () => ({
  default: class {
    constructor(duration: number, onTick: (value: number) => void) {
      onTick(duration);
    }
    abort() {}
  },
}));

afterEach(async () => {
  for (const root of roots.splice(0))
    await React.act(async () => {
      root.unmount();
      await Promise.resolve();
    });
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const hydrate = async (content: React.ReactElement) => {
  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = renderToString(content);
  const serverNodes = [...container.querySelectorAll("[data-hydration-check]")];
  const errors = vi.fn();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  await React.act(async () => {
    roots.push(hydrateRoot(container, content, { onRecoverableError: errors }));
    await Promise.resolve();
  });
  expect(errors).not.toHaveBeenCalled();
  [...container.querySelectorAll("[data-hydration-check]")].forEach((node, index) =>
    expect(node).toBe(serverNodes[index]),
  );
  return container;
};

const Price = () => {
  const seed = useProductHydration();
  return (
    <div data-hydration-check>
      <PriceTag
        currencyCode="usd"
        price={123456}
        isPayWhatYouWant={false}
        isSalesLimited={false}
        locale={seed?.locale}
      />
    </div>
  );
};

it("hydrates seeded date and fallback price text before restoring browser locale and timezone", async () => {
  vi.spyOn(Date.prototype, "toLocaleString").mockImplementation(function (this: Date, locales, options) {
    return new Intl.DateTimeFormat(locales && (!Array.isArray(locales) || locales.length) ? locales : "de-DE", {
      ...options,
      timeZone: options?.timeZone ?? "Pacific/Honolulu",
    }).format(this);
  });
  vi.spyOn(Number.prototype, "toLocaleString").mockImplementation(function (this: number, locales, options) {
    return new Intl.NumberFormat(locales ?? "de-DE", options).format(this);
  });
  const content = (
    <ProductHydrationProvider value={snapshot}>
      <Price />
      <div data-hydration-check>
        <ProductPreorderNotice releaseDate="2030-01-02T00:30:00Z" />
      </div>
    </ProductHydrationProvider>
  );
  const server = renderToString(content);
  expect(server).toContain("$1,234.56");
  expect(server).toContain("January 2, 2030");
  const container = await hydrate(content);
  expect(container.textContent).toContain("$1.234,56");
  expect(container.textContent).toContain("1. Januar 2030");
  expect(container.textContent).toContain("14:30");
});

it("uses browser formatting without an RSC provider", async () => {
  const container = await hydrate(<Price />);
  expect(container.textContent).toContain(
    new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1234.56),
  );
});

it("hydrates the seven-day countdown boundary using the serialized reference time", async () => {
  const expiresAt = new Date(snapshot.referenceTime + (7 * 86400 + 1) * 1000);
  vi.spyOn(Date, "now").mockReturnValue(snapshot.referenceTime + 2000);
  const content = (
    <ProductHydrationProvider value={snapshot}>
      <div data-hydration-check>
        <DiscountExpirationCountdown expiresAt={expiresAt} onExpiration={() => undefined} />
      </div>
    </ProductHydrationProvider>
  );
  expect(renderToString(content)).not.toContain("This discount expires");
  const container = await hydrate(content);
  expect(container.textContent).toContain("06:23:59:59");
});

it("expires after hydration when the document was rendered before expiration", async () => {
  vi.spyOn(Date, "now").mockReturnValue(snapshot.referenceTime + 2000);
  const onExpiration = vi.fn();
  const container = await hydrate(
    <ProductHydrationProvider value={snapshot}>
      <div data-hydration-check>
        <DiscountExpirationCountdown expiresAt={new Date(snapshot.referenceTime + 1000)} onExpiration={onExpiration} />
      </div>
    </ProductHydrationProvider>,
  );
  expect(container.textContent).toContain("00:00");
  expect(onExpiration).toHaveBeenCalledTimes(1);
});
