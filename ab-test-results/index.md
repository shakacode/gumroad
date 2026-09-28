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
| Business logic             | Kept pricing, eligibility, and purchase rules in Rails                                                                            |
| Rollout and rollback       | Added a seller feature flag for the profile-layout Product route; disabling it restores Inertia                                   |
| Scope                      | Product pages using the profile layout; seller profiles, checkout and other pages remain on inertia                               |

On a fresh visit, the tested Inertia path sent page data and then relied on browser JavaScript to render the Product content. The new path could show server-rendered content while JavaScript continued loading. This was done through a server/client split in the Product components.

Inertia can reuse already-running JavaScript during client-side navigation. Our Product-page repeat-visit test used a **full page navigation** with cached JavaScript files.

We also tested the purchase flow on Mobile: open the Product page, click the sticky **Add to cart** button without scrolling, then use the purchase controls it reveals to continue to checkout. Both versions kept checkout on Inertia.

The test successfully clicked Add to cart **3.5 seconds earlier with React Server Components**, measured from the initial Product navigation. This showcases how the RSC approach can hydrate the page and becomes interactive sooner.

![One recorded Mobile purchase flow, from Product loading through the sticky Add to cart interaction to checkout, with Inertia and React on Rails Pro side by side at 3× speed.](images/product-profile-phone-add-to-cart-replay.gif)

[Open the interactive add-to-cart replay](product-profile-phone-add-to-cart-replay.html).

## Measured trade-offs

![Median browser-observed time to first byte, transferred data, and network requests for the four profile-layout Product landing cases.](images/product-page-tradeoffs.svg)

On cold visits, median browser-observed Time to First Byte (TTFB) rose from 131 to 156 milliseconds on Desktop and from 129 to 162 milliseconds on Mobile. Total transferred data rose by about 4.8%, from about 2.60 MB to 2.72 MB. With a prepopulated cache, transferred data fell from about 196 KB to 36 KB, or about 81%. Requests fell from 143 to 96 on cold visits and from 142 to 95 with a prepopulated cache.

Total Blocking Time also increased. On cold visits, the median rose from 11 to 119 milliseconds on Desktop and from 12 to 121 milliseconds on Mobile; ShakaPerf classified both as regressions. On warm visits, it rose from 0 to 50 milliseconds on Desktop and from 0 to 42 milliseconds on Mobile, although ShakaPerf did not classify those changes as regressions. This run did not measure time to interactive.

## How we measured the results

[ShakaPerf](https://shakaperf.com/) compared the Inertia control at `control.localhost:3100` with the React on Rails Pro experiment at `experim.localhost:3200`, using the same Product URL and query parameters. The report does not embed immutable at-run Git identities, so it proves the measured page behavior but not the exact source commits behind the two servers.

We measured the profile-layout Product cold and warm landing on Desktop (1280 × 800) and Mobile (375 × 667). Each of the four cases has 20 measurements per side. Cold visits started with an empty browser cache; warm visits reused cached files but still loaded a full page. The hostnames have equal length, so they do not introduce different URL byte counts. The Lighthouse reports show a Desktop user agent on Desktop and a Mobile user agent on Mobile.

The [benchmark summary](benchmark-data/latest-results.md) reports medians and paired 95% confidence intervals for FCP, Largest Contentful Paint (LCP), and Speed Index. The [machine-readable data](benchmark-data/latest-results.json) contains the raw samples, user agents, and artifact hashes. The sticky add-to-cart scenario is shown separately in the purchase-flow replay and is excluded from these landing comparisons.

<a id="throttling-settings"></a>

> Test reference: September 23, 2026 run 2026-09-23T18:01:58.195Z. Lighthouse used DevTools throttling: 100 ms RTT, 2,700 Kbps download and upload, 200 ms request latency, and a 3× CPU slowdown.

## Inspect and reproduce the test

Open the [control Lighthouse report](../compare-results/product-page-profile-layout-cold-landing-phone-031456e8/artifacts/control_lighthouse_report.html) and the [experiment Lighthouse report](../compare-results/product-page-profile-layout-cold-landing-phone-031456e8/artifacts/experiment_lighthouse_report.html) for the diagnostic Mobile capture. This run used local twin servers, not the public demo deployments.

To run a new comparison, keep the viewport, user agent, network, CPU profile, cache state, and product content the same on both sides. Before interpreting it, verify independently that the control serves the intended Inertia page and that the experiment contains `product-rsc-root`. Repeat runs and compare distributions as well as medians.

## Conclusion

In this test, the Server Components implementation made one direct-entry Product page appear sooner than the Inertia control. The result held on Desktop and Mobile, with empty and prepopulated caches. Before production rollout, we would still review the accessibility diffs, measure renderer capacity and memory, and record immutable source commits in the benchmark.

To evaluate this approach in your application, [ShakaCode](https://www.shakacode.com/) can help select the page, set up the comparison, and implement [React on Rails Pro](https://www.shakacode.com/react-on-rails-pro/) incrementally.

Aloha, Justin

---

Historical note: An earlier run compared an optimized Inertia SSR implementation with React on Rails Pro under different code and throttling, so its numbers are not comparable with this run. Its video suggested earlier interactivity with Server Components, but the September 23 benchmark did not measure time to interactive; we make no TTI claim here.
