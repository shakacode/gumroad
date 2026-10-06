# Gumroad chose Inertia. We explored adding React Server Components to one page.

By Justin Gordon and Ramez Weissa · October 2026

In March 2026, Gumroad completed its switch from React on Rails to Inertia. Their [migration story](https://x.com/gumroad/status/2034374288007188817) describes a simpler Rails application and smoother navigation. We wanted to explore a follow-up: **could React on Rails complement Inertia on the page where performance matters most?**

Gumroad helps creators sell products. Buyers arrive from a creator's website, Google search or a link in an AI chat—often without any application JavaScript already loaded. They need to see the offer, use its purchase controls and reach checkout. That makes the Product page a natural place to optimize.

We maintain React on Rails at ShakaCode. In our [public Gumroad fork](https://github.com/shakacode/gumroad), we moved profile-layout Product pages to React Server Components through [React on Rails Pro](https://reactonrails.com/pro). The rest of the application, including checkout, keeps Inertia.

<a id="start-with-the-buyer"></a>
<a id="what-the-repeated-comparison-measured"></a>

## The product appeared sooner

![Median first contentful paint, largest contentful paint and Speed Index for desktop and mobile first and repeat visits. Blue is Inertia; green is React on Rails Pro.](images/product-page-paint.svg)

In the September 23 comparison, first content appeared **8.4 seconds sooner**, an **87.8% reduction**, on desktop and mobile with empty caches. With cached JavaScript, the paired reduction was **52.6% on desktop and 53.7% on mobile**.

[ShakaPerf](https://github.com/shakacode/shakaperf/) ran 20 paired measurements per case with matching seeded content, network throttling and a 3× CPU slowdown. Repeat visits were full-page loads with cached files, not Inertia's client-side navigation. These are lab results for this implementation; [conditions and evidence limits](appendix.md) matter when interpreting them.

## Watch a purchase interaction

The important next step is using the page. In one recorded mobile purchase flow, the test clicked the sticky **Add to cart** button **3.5 seconds earlier with RSC**, measured from initial navigation, then continued toward checkout.

![One recorded mobile purchase flow through Add to cart to checkout, with Inertia and React on Rails Pro side by side at 3× playback speed.](images/product-profile-phone-add-to-cart-replay.gif)

[Open the interactive replay](product-profile-phone-add-to-cart-replay.html). This is a single interaction recording, separate from the repeated landing measurements. It illustrates the opportunity; it does not establish a typical interaction improvement or increased sales.

<a id="early-html-is-only-part-of-the-job"></a>
<a id="what-changed-and-what-the-checks-cover"></a>

## What changed

Traditional React SSR can deliver HTML early, but React purchase controls still need JavaScript and [hydration](https://react.dev/reference/react-dom/client/hydrateRoot). Showing the product is only part of making it usable.

[Server Components](https://react.dev/reference/rsc/server-components) keep content-rendering code on the server; interactive controls remain Client Components. Our fork streams server-rendered content while their JavaScript loads. RSC does not automatically guarantee faster interaction—the component boundaries and loading work still matter.

Rails retains the business logic. A seller-scoped flag enables the profile-layout Product route; turning it off restores Inertia. [PR #103](https://github.com/shakacode/gumroad/pull/103) shows the implementation.

The September baseline used client-rendered Inertia. It does **not** establish an advantage over Inertia SSR; our [earlier SSR experiment](historical-comparisons.md#what-about-inertia-ssr) used different code and conditions.

<a id="the-costs-sit-alongside-the-faster-paint"></a>

## Is the extra complexity worth it?

RSC adds a Node renderer to deploy and monitor. In the cold-visit measurements, blocking time, time to first byte and transferred data increased even as content appeared sooner. The [trade-off tables](appendix.md#measured-trade-offs) show those costs alongside fewer requests and smaller repeat-visit transfers.

Extra complexity can be worthwhile when it improves a page that helps customers buy. Keeping Inertia elsewhere lets you evaluate that trade-off on one route.

<a id="llms-change-the-cost-of-trying"></a>

LLM coding tools also make difficult changes more approachable: they can help trace components, propose server/client boundaries and write checks. That lowers the barrier to trying an RSC migration. Engineers still own correctness and deployment; we did not measure developer time saved here.

<a id="inspect-the-evidence-or-try-the-pages"></a>
<a id="what-the-pagespeed-reports-show"></a>

## Try the pages

Open the [Inertia deployment](https://luisfurushio.gumroad-inertia.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search) and [RSC deployment](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search). In Chrome DevTools, choose **Lighthouse → Navigation → Performance**, clear storage for a first visit, and run each several times with matching settings.

Separate October 1 PageSpeed reports scored **53 with Inertia and 80 with RSC on mobile**. These are individual snapshots, not a controlled before/after comparison; their at-run source parity is unverified. [See the reports and deployment notes](pagespeed-evidence.md). Live deployments can change.

## Try one page in your own app

**If performance matters, why not try one page?** Keep Inertia where it serves you well. Measure an important landing page and its purchase interactions, introduce RSC behind a flag, and keep it if the benefit earns the complexity.

Start with the [Inertia migration guide](https://reactonrails.com/docs/migrating/migrating-from-inertia-rails), the [RSC migration series](https://reactonrails.com/docs/migrating/migrating-to-rsc) and [Pro pricing and license terms](https://reactonrails.com/pricing/). Use [ShakaPerf](https://github.com/shakacode/shakaperf) to compare performance, visual changes and accessibility. For help choosing or migrating a page, [talk with ShakaCode](https://www.shakacode.com/react-on-rails-pro/).

## Appendix

- [Measured trade-offs, visual and accessibility checks, and evidence limits](appendix.md)
- [Complete measurement tables](benchmark-data/latest-results.md)
- [Earlier comparisons, including Inertia SSR](historical-comparisons.md)
- [First-visit loading replay](product-profile-phone-replay.html)

<a id="throttling-settings"></a>

ShakaPerf DevTools settings: 100 ms RTT, 2,700 Kbps download/upload, 200 ms request latency and 3× CPU slowdown.
