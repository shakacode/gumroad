# ShakaPerf proof of concept: September 27, 2026

This snapshot preserves the local comparison of Gumroad pages before and after the loading-path optimization in [`a594e99aa7`](https://github.com/shakacode/gumroad/commit/a594e99aa7). The report compares control and experiment servers for Discover, Product, and seller Profile pages. The report does not record the exact Git SHA of either running server, so `a594e99aa7` identifies the change under test, not a verified container image SHA.

Open the [self-contained report](self-contained-performance-report.html) locally for the interactive comparison. GitHub can show the file as source, but does not run its report UI. The [`raw-perf`](raw-perf) files hold metric estimates and significance flags for all 22 viewport cases. The [`raw-measurements`](raw-measurements) files hold the paired samples. Each case has 10 control and 10 experiment samples.

## Result

| Page group     | Cold transfer reduction | Typical FCP/LCP change |
| -------------- | ----------------------: | ---------------------: |
| Discover       | 7.1–7.7% (about 132 KB) |           4–10% faster |
| Product        | 4.8–4.9% (about 132 KB) |            3–5% faster |
| Seller Profile |     6.8% (about 132 KB) |            3–4% faster |

Warm loads were also faster in most cases: about 4–8% for Discover, 5% for the Product Discover layout, and 7% for seller Profile. The Product Profile layout was 5–6% faster in the measured medians, but this difference was not statistically significant. No meaningful CLS, TBT, or TTFB regression appeared. Product desktop CLS was about 0.001–0.002.

The report flags `+186%` downloads before LCP for seller Profile on a phone after Product warmup. Total transfer was 229.4 KB for both sides. A 180 KB `cart_items_count` response moved across the LCP timing boundary: median transfer before LCP was 48.5 KB for control and 228.9 KB for experiment. This flag does not show added network transfer.

## Limits

- This run used 10 paired samples per case, although the current repository configuration specifies 18.
- Three cold visual cases first differed and then matched on retry. Marketplace phone performance also needed a successful retry.
- Accessibility showed changed findings, but no new or fixed violations. Different catalog products appeared in equivalent positions in some Discover captures. Discover timing estimates therefore do not fully control for page content.
- The HTML report was regenerated in report-only mode at `2026-09-27T16:04:16.846Z` from measurements made earlier that day. The report does not record the server Git SHAs.

## Screenshots

The `screenshots` folder contains before and after captures extracted from this self-contained report for cold Discover, Product, and seller Profile loads on desktop and phone. The source report embeds the captures as AVIF data; these copies are PNGs for direct viewing in GitHub.
