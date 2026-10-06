# From 53 to 80 on mobile PageSpeed: a Gumroad product-page experiment

By Justin Gordon (CEO of ShakaCode) and Ramez Weissa · October 2026

Gumroad's [Inertia migration story](https://x.com/gumroad/status/2034374288007188817) describes a simpler application and smoother navigation. That left us with a question: **could React Server Components complement the client-side React used by Inertia?**

<a id="start-with-the-buyer"></a>

Gumroad's job is to help creators sell products. Someone following a link from another site, a Google search, or an AI chat lands directly on the product page. They need the product details to load quickly and Add to cart to work when they click it.

We migrated the profile-layout Product page in our [Gumroad fork](https://github.com/shakacode/gumroad) to React Server Components through [React on Rails Pro](https://reactonrails.com/pro/), keeping Inertia elsewhere.

<a id="what-the-pagespeed-reports-show"></a>

<a id="inspect-the-evidence-or-try-the-pages"></a>

<a id="try-the-pages"></a>

<a id="want-to-test-performance-for-yourself"></a>

<a id="compare-the-pagespeed-reports"></a>

## Compare the pages and PageSpeed reports

Our October 1 mobile PageSpeed reports scored **80 with React Server Components and 53 with Inertia**. On desktop, the scores were **98 and 66**. The live pages below use the RSC feature flag in one deployment and Inertia in the other. Open both pages, then compare their reports:

|                   | Inertia                                                                                                                                                                                                                                                                           | React Server Components                                                                                                                                                                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live product page | [Open Inertia page](https://luisfurushio.gumroad-inertia.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search)                                                                                                                                                           | [Open RSC page](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search)                                                                                                                                                            |
| Mobile PageSpeed  | **53**                                                                                                                                                                                                                                                                            | **80**                                                                                                                                                                                                                                                                      |
| Desktop PageSpeed | **66**                                                                                                                                                                                                                                                                            | **98**                                                                                                                                                                                                                                                                      |
| Saved reports     | [Mobile](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/pktr6lcl65?form_factor=mobile) · [Desktop](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/pktr6lcl65?form_factor=desktop) | [Mobile](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/737osqp6n5?form_factor=mobile) · [Desktop](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/737osqp6n5?form_factor=desktop) |

Click **Analyze** again on either report to test that URL now. Use the same device tab for both and run each several times. We saved these reports from separate runs, not a controlled before/after test. We couldn't verify that both deployments used matching source versions at the time. The scores can vary, and the deployments may have changed since. [Report details](reference.md#what-the-pagespeed-reports-show).

## 8× faster first paint on cold visits

We also used [ShakaPerf](https://github.com/shakacode/shakaperf/) for repeated tests under the same throttling settings.

![Median first contentful paint, largest contentful paint, and Speed Index for the profile-layout Product page on Desktop and Mobile, with empty and prepopulated caches. Hatched amber bars are Inertia; solid blue bars are RSC. Each bar is also labeled.](images/product-page-paint.svg)

<a id="what-the-repeated-comparison-measured"></a>

<a id="the-product-appeared-sooner"></a>

In a separate throttled ShakaPerf comparison with empty caches, median first paint fell from about **9.5 seconds to 1.16 seconds, roughly 8× faster**. The paired First Contentful Paint (FCP) estimate improved by **8.4 seconds**, or **87.8%**, on desktop and mobile. With cached JavaScript, the paired improvement was **52.6% on desktop and 53.7% on mobile**. Each case used 20 paired measurements under these [throttling settings](#throttling-settings).

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

The implementation is in [PR #103: Optimize Product page with React Server Components](https://github.com/shakacode/gumroad/pull/103).

<a id="early-html-is-only-part-of-the-job"></a>

On a fresh visit, our Inertia version sent page data for the browser's JavaScript to turn into the product page. Splitting the page into Server Components and client components let the RSC version show product content while JavaScript was still loading.

Server rendering also makes sense for product-page SEO: crawlers get the product content in the initial HTML. Google can render JavaScript, but [recommends server rendering or prerendering](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) because not all bots can. We didn't measure any changes in indexing or search rankings.

Inertia can reuse already-running JavaScript during client-side navigation. Our Product-page repeat-visit test used a **full page navigation** with cached JavaScript files.

<a id="watch-a-purchase-interaction"></a>

We also tested the purchase flow on Mobile: open the Product page, click the sticky **Add to cart** button without scrolling, then use the purchase controls it reveals to continue to checkout. Both versions kept checkout on Inertia.

In that recording, the test clicked Add to cart **3.5 seconds earlier with React Server Components**, counting from when it opened the Product page. We recorded this interaction once, separately from the repeated page-load tests. We'd need more runs to know whether that gain is typical, and we didn't measure sales.

![One recorded Mobile purchase flow, from Product loading through the sticky Add to cart interaction to checkout, with Inertia and React on Rails Pro side by side at 3× speed.](images/product-profile-phone-add-to-cart-replay.gif)

[Open the interactive add-to-cart replay](product-profile-phone-add-to-cart-replay.html).

## How we measure the results

[ShakaPerf](https://github.com/shakacode/shakaperf/) runs the same Playwright scenario against both versions, collecting performance, visual, accessibility and network results. We used matching seeded Product content in separate Docker containers, sampling both sides concurrently and analyzing paired differences.

<a id="the-costs-sit-alongside-the-faster-paint"></a>

<a id="is-the-extra-complexity-worth-it"></a>

The [companion reference](reference.md) covers the methodology, rendering choices, operational costs and evidence limits. The September baseline used client-rendered Inertia, not Inertia SSR. RSC gave us another renderer to run and increased some cold-load costs; [see the trade-offs](reference.md#the-costs-sit-alongside-the-faster-paint). The setup is in [PR #102](https://github.com/shakacode/gumroad/pull/102).

<a id="try-one-page-in-your-own-app"></a>

## What you should take from this

You can keep Inertia and use React Server Components on the pages where you need them, as we did with this product page.

<a id="llms-change-the-cost-of-trying"></a>

LLM coding tools make a migration like this less work than it used to be. You still have to check the code and run the renderer. **If performance matters, why not try one page?** Measure how it loads and responds to clicks, then try RSC behind a feature flag. Keep it if the gains are worth the extra complexity.

The [companion reference](reference.md#try-one-page-in-your-own-app) links the migration guides and Pro license details. Use ShakaPerf to compare your changes. At ShakaCode, we can help you choose a page, measure it, and add [React on Rails Pro](https://www.shakacode.com/react-on-rails-pro/) incrementally.

<a id="appendix"></a>

## Supporting reference

[Read the companion article](reference.md) for methodology, costs, SEO considerations and source evidence. For the specific comparison, go directly to [What about Inertia SSR?](historical-comparisons.md#what-about-inertia-ssr).

<a id="throttling-settings">ShakaPerf throttling settings</a>

> ShakaPerf DevTools throttling settings: 100 ms RTT, 2,700 Kbps download and upload, 200 ms request latency, and a 3× CPU slowdown.
