// @vitest-environment happy-dom
import * as React from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

import { formatPostDate } from "$app/utils/date";

import { ProfilePostsContent } from "$app/components/Profile/ProfilePostsContent";
import { ProductHydrationProvider } from "$app/components/PublicPages/ProductHydration.client";
import { UserAgentProvider } from "$app/components/UserAgent";

const roots: Root[] = [];

afterEach(async () => {
  for (const root of roots.splice(0))
    await React.act(async () => {
      root.unmount();
      await Promise.resolve();
    });
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([
  {
    locale: "en-US",
    browserTimeZone: "Pacific/Honolulu",
    publishedAt: "2030-01-02T00:30:00Z",
    serverDate: "January 2, 2030",
    clientDates: ["January 1, 2030", "January 2, 2030"],
  },
  {
    locale: "fr-FR",
    browserTimeZone: "Pacific/Kiritimati",
    publishedAt: "2030-01-01T12:30:00Z",
    serverDate: "1 janvier 2030",
    clientDates: ["2 janvier 2030", "3 janvier 2030"],
  },
])("hydrates post dates before using the $browserTimeZone timezone", async (fixture) => {
  let defaultTimeZone = "UTC";
  let defaultLocale = fixture.locale;
  vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(function (this: Date, locale, options) {
    return new Intl.DateTimeFormat(locale ?? defaultLocale, {
      ...options,
      timeZone: options?.timeZone ?? defaultTimeZone,
    }).format(this);
  });
  vi.stubGlobal("Routes", { custom_domain_view_post_path: (slug: string) => `/p/${slug}` });
  vi.useFakeTimers({ toFake: ["Date"] });
  const referenceTime = Date.parse(fixture.publishedAt);
  vi.setSystemTime(referenceTime);
  const posts = [
    { id: "dated", slug: "dated", name: "Published post", published_at: fixture.publishedAt },
    { id: "undated", slug: "undated", name: "Undated post", published_at: null },
  ];
  const content = (
    <UserAgentProvider value={{ isMobile: false, locale: fixture.locale }}>
      <ProductHydrationProvider value={{ locale: fixture.locale, timeZone: "UTC", referenceTime }}>
        <ProfilePostsContent posts={posts} />
      </ProductHydrationProvider>
    </UserAgentProvider>
  );
  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = renderToString(content);
  const serverNodes = [...container.querySelectorAll("a, time")];
  expect([...container.querySelectorAll("time")].map((node) => node.textContent)).toEqual([
    fixture.serverDate,
    fixture.serverDate,
  ]);
  defaultTimeZone = fixture.browserTimeZone;
  defaultLocale = "de-DE";
  vi.setSystemTime(referenceTime + 86400000);
  const errors = vi.fn();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  await React.act(async () => {
    roots.push(hydrateRoot(container, content, { onRecoverableError: errors }));
    await Promise.resolve();
  });
  expect(errors).not.toHaveBeenCalled();
  [...container.querySelectorAll("a, time")].forEach((node, index) => expect(node).toBe(serverNodes[index]));
  const clientDates = [...container.querySelectorAll("time")].map((node) => node.textContent);
  expect(clientDates).toEqual(fixture.clientDates);
  expect(clientDates).toEqual(posts.map((post) => formatPostDate(post.published_at, fixture.locale)));
});
