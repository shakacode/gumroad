# The Server Components path cut cold Product-page First Contentful Paint by 8.4 seconds

By Justin Gordon, CEO of ShakaCode · September 2026

We used [ShakaPerf](https://shakaperf.com/) to test whether React 19 Server Components could make a Gumroad Product page appear sooner while keeping Inertia in the application. The control used Gumroad’s Inertia Product page. The experiment used [React on Rails Pro](https://www.shakacode.com/react-on-rails-pro/) with Server Components. This compares the **complete page-delivery paths**; it does not isolate React 19, Server Components, streaming, or any one implementation change.

![Median first contentful paint, largest contentful paint, and Speed Index for the profile-layout Product page on Desktop and Mobile, with empty and prepopulated caches. Blue is Inertia; green is React on Rails Pro.](images/product-page-paint.svg)

On cold visits, the paired First Contentful Paint (FCP) estimate improved by **8.37 seconds on Desktop** and **8.38 seconds on Mobile—87.8% in both cases**. With cached files, it improved by **376 milliseconds on Desktop** and **380 milliseconds on Mobile**. Each result compares 20 paired measurements per side. The graph shows medians; the linked table separates medians from paired estimates.

[See the measurements](benchmark-data/latest-results.md) · [See the test settings](#throttling-settings)

## Watch both versions load

**[▶ Open the interactive side-by-side replay](product-profile-phone-replay.html)** for one cold Mobile load of the profile-layout Product page.

![Four moments from one Mobile diagnostic load of the profile-layout Product page, shown side by side for Inertia and React on Rails Pro.](images/product-profile-timeline-preview.svg)

![First and largest contentful paint times for Inertia and React on Rails Pro in one cold Mobile diagnostic capture, on the same elapsed-time scale.](images/product-profile-loading-timeline.svg)

This single diagnostic load shows the sequence: React on Rails Pro reached FCP at 1.14 seconds, while Inertia reached it at 9.46 seconds. It illustrates the behavior; the 20-pair comparisons above support the performance estimate. Both times start at the target navigation. [See the test settings](#throttling-settings).

## What changed on the Product page

| Boundary | Implementation |
| --- | --- |
| Product content and layout | Streamed with Server Components through React on Rails Pro |
| Purchase interactions | Remained in client components |
| Business logic | Remained in Rails |
| Rollout and rollback | A seller feature flag selects the profile-layout route; disabling it restores Inertia |
| Out of scope | Seller profiles, Discover, and the Product page’s Discover layout |

Both paths share the Product content, state, purchase controls, Profile sections, and rich-text components used by the profile layout.

On a fresh visit, the tested Inertia path sent page data and then relied on browser JavaScript to render the Product content. The new path could show server-rendered content while JavaScript continued loading. This took a server/client split in the Product components, not just a rendering switch. [React documents Server Components](https://react.dev/reference/rsc/server-components) and the [React 19 release](https://react.dev/blog/2024/12/05/react-19). Streaming server rendering also existed before React 19; the benchmark does not attribute the entire gain to the React version.

Inertia can reuse already-running JavaScript during client-side navigation. Our warm test still used a **full page navigation** with cached files, not an Inertia client-side transition. Discover pages, seller profiles, and the Product page’s Discover layout are outside this result.

## Trade-offs and unverified areas

![Median browser-observed time to first byte, transferred data, and network requests for the four profile-layout Product landing cases.](images/product-page-tradeoffs.svg)

On cold visits, median browser-observed Time to First Byte (TTFB) rose from 131 to 156 milliseconds on Desktop and from 129 to 162 milliseconds on Mobile. Total transferred data rose by about 4.8%, from about 2.60 MB to 2.72 MB. With a prepopulated cache, transferred data fell from about 196 KB to 36 KB, or about 81%. Requests fell from 143 to 96 on cold visits and from 142 to 95 with a prepopulated cache. TTFB does not measure renderer CPU time or total server cost; a production rollout must also operate the renderer service.

Total Blocking Time also increased. On cold visits, the median rose from 11 to 119 milliseconds on Desktop and from 12 to 121 milliseconds on Mobile; ShakaPerf classified both as regressions. On warm visits, it rose from 0 to 50 milliseconds on Desktop and from 0 to 42 milliseconds on Mobile, although ShakaPerf did not classify those changes as regressions. This run did not measure time to interactive.

The source report classified JavaScript-specific transferred bytes as zero on both sides despite visible JavaScript requests. We make no JavaScript-byte claim from that category. Cold visual checks found zero differing pixels in the Product article area on Desktop and Mobile. Warm visual comparisons were not captured. The automated accessibility diff did not classify any findings as new or fixed, but it marked 20 findings on each viewport as changed: 19 critical and one serious. We have not adjudicated those changes, so this run does not establish accessibility parity.

## How we measured the results

[ShakaPerf](https://shakaperf.com/) compared the Inertia control at `control.localhost:3100` with the React on Rails Pro experiment at `experim.localhost:3200`, using the same Product URL and query parameters. The report does not embed immutable at-run Git identities, so it proves the measured page behavior but not the exact source commits behind the two servers.

We measured the profile-layout Product cold and warm landing on Desktop (1280 × 800) and Mobile (375 × 667). Each of the four cases has 20 measurements per side. Cold visits started with an empty browser cache; warm visits reused cached files but still loaded a full page. The hostnames have equal length, so they do not introduce different URL byte counts. The Lighthouse reports show a Desktop user agent on Desktop and a Mobile user agent on Mobile.

The [benchmark summary](benchmark-data/latest-results.md) reports medians and paired 95% confidence intervals for FCP, Largest Contentful Paint (LCP), and Speed Index. The [machine-readable data](benchmark-data/latest-results.json) contains the raw samples, user agents, and artifact hashes. We excluded the sticky add-to-cart scenario from this analysis.

<a id="throttling-settings"></a>

> Test reference: September 23, 2026 run 2026-09-23T18:01:58.195Z. Lighthouse used DevTools throttling: 100 ms RTT, 2,700 Kbps download and upload, 200 ms request latency, and a 3× CPU slowdown.

The report does not include time-aligned memory or swap telemetry, so it cannot prove that the host was free of memory pressure during every measurement.

## How consistent were the FCP results?

![Minimum, median, and maximum First Contentful Paint from 20 measurements per side for the four profile-layout Product landings.](images/product-fcp-distributions.svg)

The chart shows each side’s minimum, median, and maximum FCP; the control and experiment ranges do not overlap in any of the four cases. It is **not** a confidence-interval chart. ShakaPerf’s paired estimates answer a different question and cannot be calculated by subtracting the displayed medians. For cold Desktop FCP, the 95% confidence interval was −8.40 to −8.34 seconds. For cold Mobile FCP, it was −8.40 to −8.35 seconds. The [four-case table](benchmark-data/latest-results.md) includes all three paint metrics and their paired intervals.

## Inspect and reproduce the test

Open the [control Lighthouse report](../compare-results/product-page-profile-layout-cold-landing-phone-031456e8/artifacts/control_lighthouse_report.html) and the [experiment Lighthouse report](../compare-results/product-page-profile-layout-cold-landing-phone-031456e8/artifacts/experiment_lighthouse_report.html) for the diagnostic Mobile capture. This run used local twin servers, not the public demo deployments.

To run a new comparison, keep the viewport, user agent, network, CPU profile, cache state, and product content the same on both sides. Before interpreting it, verify independently that the control serves the intended Inertia page and that the experiment contains `product-rsc-root`. Repeat runs and compare distributions as well as medians.

## Conclusion

This experiment shows that one direct-entry Product page can move to Server Components without replacing Inertia elsewhere. The improvement held on Desktop and Mobile, with empty and prepopulated caches. Before production rollout, we would still review the accessibility diffs, measure renderer capacity and memory, and record immutable source commits in the benchmark.

To evaluate this approach in your application, [ShakaCode](https://www.shakacode.com/) can help select the page, set up the comparison, and implement [React on Rails Pro](https://www.shakacode.com/react-on-rails-pro/) incrementally.

Aloha, Justin

---

Historical note: An earlier run compared an optimized Inertia SSR implementation with React on Rails Pro under different code and throttling, so its numbers are not comparable with this run. Its video suggested earlier interactivity with Server Components, but the September 23 benchmark did not measure time to interactive; we make no TTI claim here.
