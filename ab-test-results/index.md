# We made Gumroad’s Product content appear 8× faster on cold visits by streaming React Server Components

By Justin Gordon (CEO of ShakaCode) and Ramez Weissa · September 2026

Could streaming React 19 Server Components (RSC) make Gumroad’s product page appear sooner while keeping Inertia in the application?

We used [ShakaPerf](https://github.com/shakacode/shakaperf/) to migrate [Gumroad’s](https://gumroad.com/) product page to React 19 Server Components, [React on Rails Pro](https://www.shakacode.com/react-on-rails-pro/) and this made the product page appear 8x sooner.

![Median first contentful paint, largest contentful paint, and Speed Index for the profile-layout Product page on Desktop and Mobile, with empty and prepopulated caches. Blue is Inertia; green is React on Rails Pro.](images/product-page-paint.svg)

On first visits, the First Contentful Paint (FCP) estimate improved by **8.4 seconds on Desktop and Mobile** An 87.8% in both cases. When testing repeat visits, it improved by **376 milliseconds** a 54% improvment

[See the measurements](benchmark-data/latest-results.md) · [See the test settings](#throttling-settings)

## Watch both versions load

![Side-by-side replay of one recorded first Mobile visit: Inertia and React on Rails Pro with React Server Components, played at 3× speed.](images/product-profile-phone-replay.gif)

## What changed on the Product page

| Area                       | What we changed                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Product React tree         | Refactored the existing component tree into Server Components and client components, introducing boundaries around interactive UI |
| Product content and layout | Moved rendering to Server Components, streamed through React on Rails Pro                                                         |
| Purchase interactions      | Kept interactive purchase controls in client components                                                                           |
| Business logic             | Kept in Rails                                                                                                                     |
| Rollout and rollback       | Added a seller feature flag for the profile-layout Product page route; toggling it restores switches back to inertia              |
| Scope                      | Product pages using the profile layout; seller profiles, checkout and other pages remain on inertia                               |

On a fresh visit, the tested Inertia path sent page data and then relied on browser JavaScript to render the Product content. The new path could show server-rendered content while JavaScript continued loading. This was done through a server/client split in the Product components.

Inertia can reuse already-running JavaScript during client-side navigation. Our Product-page repeat-visit test used a **full page navigation** with cached JavaScript files.

We also tested the purchase flow on Mobile: open the Product page, click the sticky **Add to cart** button without scrolling, then use the purchase controls it reveals to continue to checkout. Both versions kept checkout on Inertia.

The test successfully clicked Add to cart **3.5 seconds earlier with React Server Components**, measured from the initial Product navigation. This showcases how the RSC approach can hydrate the page and becomes interactive sooner.

![One recorded Mobile purchase flow, from Product loading through the sticky Add to cart interaction to checkout, with Inertia and React on Rails Pro side by side at 3× speed.](images/product-profile-phone-add-to-cart-replay.gif)

[Open the interactive add-to-cart replay](product-profile-phone-add-to-cart-replay.html).

<!-- ## Measured trade-offs

![Median browser-observed time to first byte, transferred data, and network requests for the four profile-layout Product landing cases.](images/product-page-tradeoffs.svg)

On cold visits, median browser-observed Time to First Byte (TTFB) rose from 131 to 156 milliseconds on Desktop and from 129 to 162 milliseconds on Mobile. Total transferred data rose by about 4.8%, from about 2.60 MB to 2.72 MB. With a prepopulated cache, transferred data fell from about 196 KB to 36 KB, or about 81%. Requests fell from 143 to 96 on cold visits and from 142 to 95 with a prepopulated cache.

Total Blocking Time also increased. On cold visits, the median rose from 11 to 119 milliseconds on Desktop and from 12 to 121 milliseconds on Mobile; ShakaPerf classified both as regressions. On warm visits, it rose from 0 to 50 milliseconds on Desktop and from 0 to 42 milliseconds on Mobile, although ShakaPerf did not classify those changes as regressions. This run did not measure time to interactive. -->

## Want to test performance for yourself?

Open the same profile-layout Product page in each test deployment, or explore the page on Gumroad production:

| Page                          | Inertia                                                                                                         | React on Rails Pro                                                                                           | Gumroad production                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Product page (profile layout) | [Open page](https://luisfurushio.gumroad-inertia.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search) | [Open page](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search) | [Open page](https://luisfurushio.gumroad.com/l/bgfjk?layout=profile&recommended_by=search) |

Open each page variant, then open Chrome DevTools, choose **Lighthouse → Navigation → Performance**. Enable **Clear storage** for a first visit (on by default) and click on "Analyze page load" to test. Run multiple times to limit machine/network noise.

## How we measure the results

[ShakaPerf](https://github.com/shakacode/shakaperf/) runs the same Playwright scenario against two versions of an application, collecting Lighthouse performance measurements, visual comparisons, accessibility checks, and network activity. We compared the existing Inertia implementation (the **control**) with React on Rails Pro and Server Components (the **experiment**), using matching seeded Product content in separate Docker containers.

For each measurement pair, ShakaPerf sampled both versions simultaneously so they encountered the same period of host activity. It analyzed the differences within those pairs, reporting paired performance estimates and confidence intervals alongside the medians. This reduces sensitivity to shared timing noise.

## What you should take from this

Already using Inertia? You can introduce React Server Componets using [React on Rails Pro](https://www.shakacode.com/react-on-rails-pro/) on selected pages without replacing it across your app. That is what we did in our Gumroad fork making Product content appear 8× faster on first visits.

Start measuring your app’s performance now with [ShakaPerf](https://shakaperf.com/). Compare changes against your existing app to see what actually makes it faster, while checking for visual regressions. Run tests locally as you optimize, then in CI to catch regressions before they ship. The [ShakaPerf repository](https://github.com/shakacode/shakaperf) shows how to get started.

Want to find that opportunity in your application? We at ShakaCode can help choose the page, set up ShakaPerf, and implement [React on Rails Pro](https://www.shakacode.com/react-on-rails-pro/) incrementally. Bring us a page that feels slow, and let’s measure what we can improve together.

---

<a id="throttling-settings"></a>

> Test reference: September 23, 2026 run 2026-09-23T18:01:58.195Z. Lighthouse used DevTools throttling: 100 ms RTT, 2,700 Kbps download and upload, 200 ms request latency, and a 3× CPU slowdown.

Historical note: An earlier run compared an optimized Inertia SSR implementation with React on Rails Pro under different code and throttling, so its numbers are not comparable with this run. Its video suggested earlier interactivity with Server Components, but the September 23 benchmark did not measure time to interactive; we make no TTI claim here.
