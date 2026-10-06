# 80 vs 53 on mobile PageSpeed: React Server Components in a Gumroad fork

By Justin Gordon (CEO of ShakaCode) and Ramez Weissa · October 2026

Gumroad's [Inertia migration story](https://x.com/gumroad/status/2034374288007188817) describes a simpler application and smoother navigation. We wanted to explore a follow-up: **could React Server Components complement the client-side React used by Inertia?**

<a id="start-with-the-buyer"></a>

Product pages are where Gumroad helps creators sell. Buyers arrive from other websites, search results or AI chats, and need to both see the offer and use its purchase controls.

We migrated the profile-layout Product page in our [Gumroad fork](https://github.com/shakacode/gumroad) to React Server Components through [React on Rails Pro](https://reactonrails.com/pro/), keeping Inertia elsewhere. We used [ShakaPerf](https://github.com/shakacode/shakaperf/) to measure the result.

<a id="what-the-pagespeed-reports-show"></a>

## Compare the PageSpeed reports

Our October 1 mobile PageSpeed reports scored **80 with React Server Components and 53 with Inertia**. On desktop, the scores were **98 and 66**. Open the reports and inspect the pages yourself:

| Variant                 | Mobile performance | Desktop performance | Saved reports                                                                                                                                                                                                                                                                     |
| ----------------------- | -----------------: | ------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inertia                 |             **53** |              **66** | [Mobile](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/pktr6lcl65?form_factor=mobile) · [Desktop](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/pktr6lcl65?form_factor=desktop) |
| React Server Components |             **80** |              **98** | [Mobile](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/737osqp6n5?form_factor=mobile) · [Desktop](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/737osqp6n5?form_factor=desktop)       |

Click **Analyze** again on either report for a fresh test of its displayed URL. Keep the same device tab and run both several times. These are saved snapshots, not a controlled before/after experiment; at-run source parity is unverified. Fresh scores and deployments can change. [Report details](reference.md#what-the-pagespeed-reports-show).

## 8× faster first paint on cold visits

![Median first contentful paint, largest contentful paint, and Speed Index for the profile-layout Product page on Desktop and Mobile, with empty and prepopulated caches. Hatched amber bars are Inertia; solid blue bars are RSC. Each bar is also labeled.](images/product-page-paint.svg)

<a id="what-the-repeated-comparison-measured"></a>

<a id="the-product-appeared-sooner"></a>

In a separate throttled ShakaPerf comparison with empty caches, median first paint fell from about **9.5 seconds to 1.16 seconds—roughly 8× faster**. The paired First Contentful Paint (FCP) estimate improved by **8.4 seconds**, or **87.8%**, on desktop and mobile. With cached JavaScript, the paired improvement was **52.6% on desktop and 53.7% on mobile**. Each case used 20 paired measurements under these [throttling settings](#throttling-settings).

## Watch both versions load

![Mobile first-visit sample: Inertia and React on Rails Pro with React Server Components loading side by side at 3× speed.](images/product-profile-phone-replay.gif)

<a id="what-changed-and-what-the-checks-cover"></a>

<a id="what-changed"></a>

## What changed on the Product page

| Area                       | What we changed                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Product React tree         | Refactored the existing component tree into Server Components and client components, introducing boundaries around interactive UI |
| Product content and layout | Moved rendering to Server Components, streamed through React on Rails Pro                                                         |
| Purchase interactions      | Kept interactive purchase controls in client components                                                                           |
| Business logic             | Kept in Rails                                                                                                                     |
| Rollout and rollback       | Added a seller-scoped feature flag for the profile-layout Product page route; disabling it restores the Inertia route             |
| Scope                      | Product pages using the profile layout; seller profiles, checkout and other pages remain on Inertia                               |

Explore the implementation in [PR #103: Optimize Product page with React Server Components](https://github.com/shakacode/gumroad/pull/103).

<a id="early-html-is-only-part-of-the-job"></a>

On a fresh visit, the tested Inertia path sent page data and then relied on browser JavaScript to render the Product content. The new path could show server-rendered content while JavaScript continued loading. This was done through a server/client split in the Product components.

Product pages are also good candidates for server rendering for SEO: the product content can arrive in the initial HTML. Google can render JavaScript, but [recommends server rendering or prerendering](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) because not all bots can. This experiment did not measure indexing or ranking changes.

Inertia can reuse already-running JavaScript during client-side navigation. Our Product-page repeat-visit test used a **full page navigation** with cached JavaScript files.

<a id="watch-a-purchase-interaction"></a>

We also tested the purchase flow on Mobile: open the Product page, click the sticky **Add to cart** button without scrolling, then use the purchase controls it reveals to continue to checkout. Both versions kept checkout on Inertia.

In that recording, the test successfully clicked Add to cart **3.5 seconds earlier with React Server Components**, measured from the initial Product navigation. This is one recorded interaction, separate from the repeated landing measurements; it does not establish a typical interaction improvement or increased sales.

![One recorded Mobile purchase flow, from Product loading through the sticky Add to cart interaction to checkout, with Inertia and React on Rails Pro side by side at 3× speed.](images/product-profile-phone-add-to-cart-replay.gif)

[Open the interactive add-to-cart replay](product-profile-phone-add-to-cart-replay.html).

<a id="inspect-the-evidence-or-try-the-pages"></a>

<a id="try-the-pages"></a>

## Want to test performance for yourself?

We deployed the Product page twice: one deployment has the feature flag on to render it with React Server Components, and the other uses Inertia. Open the page in either deployment to compare them yourself, and inspect the recorded results:

| Inertia                                                                                                         | React on Rails Pro / RSC                                                                                     |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [Open page](https://luisfurushio.gumroad-inertia.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search) | [Open page](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search) |

Open each page variant, then open Chrome DevTools, choose **Lighthouse → Navigation → Performance**. Enable **Clear storage** for a first visit (on by default) and click on "Analyze page load" to test. Run multiple times to limit machine/network noise.

## How we measure the results

[ShakaPerf](https://github.com/shakacode/shakaperf/) runs the same Playwright scenario against both versions, collecting performance, visual, accessibility and network results. We used matching seeded Product content in separate Docker containers, sampling both sides concurrently and analyzing paired differences.

<a id="the-costs-sit-alongside-the-faster-paint"></a>

<a id="is-the-extra-complexity-worth-it"></a>

The [companion reference](reference.md) covers the methodology, rendering choices, operational costs and evidence limits. The September baseline used client-rendered Inertia, not Inertia SSR. RSC added renderer operations and increased some cold-load costs; [see the trade-offs](reference.md#the-costs-sit-alongside-the-faster-paint). The setup is in [PR #102](https://github.com/shakacode/gumroad/pull/102).

<a id="try-one-page-in-your-own-app"></a>

## What you should take from this

Already using Inertia? You can introduce React Server Components on selected pages without replacing it across your application. That is what we did in our Gumroad fork.

<a id="llms-change-the-cost-of-trying"></a>

**If performance matters, why not try one page?** LLM coding tools make difficult migrations more approachable, while engineers still own correctness and operations. Measure the existing page and its interactions, try RSC behind a feature flag, and keep it if the improvement earns the extra complexity.

The [companion reference](reference.md#try-one-page-in-your-own-app) links the migration guides and Pro license details. Use ShakaPerf to compare your changes. We at ShakaCode can help choose the page, set up measurements and implement [React on Rails Pro](https://www.shakacode.com/react-on-rails-pro/) incrementally.

<a id="appendix"></a>

## Supporting reference

[Read the companion article](reference.md) for methodology, costs, SEO considerations and source evidence. For the specific comparison, go directly to [What about Inertia SSR?](historical-comparisons.md#what-about-inertia-ssr).

<a id="throttling-settings">ShakaPerf throttling settings</a>

> ShakaPerf DevTools throttling settings: 100 ms RTT, 2,700 Kbps download and upload, 200 ms request latency, and a 3× CPU slowdown.
