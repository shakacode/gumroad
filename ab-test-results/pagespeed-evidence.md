# October 1 PageSpeed evidence

These are the existing reports linked from the [Product-page article](index.md), captured October 1, 2026. Each report contains one mobile and one desktop Lighthouse capture. The table below was extracted from the reports' embedded Lighthouse JSON; it does not represent a new run.

## Recorded results

| Variant | Form factor | Performance score | FCP displayed | LCP displayed | `fetchTime` (UTC)          | Report                                                                                                                                          |
| ------- | ----------- | ----------------: | ------------: | ------------: | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Inertia | Mobile      |                53 |         7.1 s |        10.8 s | `2026-10-01T10:52:10.913Z` | [Mobile report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/pktr6lcl65?form_factor=mobile)   |
| RSC     | Mobile      |                80 |         2.3 s |         3.6 s | `2026-10-01T10:50:38.143Z` | [Mobile report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/737osqp6n5?form_factor=mobile)      |
| Inertia | Desktop     |                66 |         1.4 s |         2.3 s | `2026-10-01T10:52:11.421Z` | [Desktop report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/pktr6lcl65?form_factor=desktop) |
| RSC     | Desktop     |                98 |         0.6 s |         0.8 s | `2026-10-01T10:50:37.812Z` | [Desktop report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/737osqp6n5?form_factor=desktop)    |

HST is UTC−10: the captures occurred at about 00:50 and 00:52 HST on October 1. Scores are Lighthouse `categories.performance.score` multiplied by 100. FCP and LCP are the displayed values, rounded by Lighthouse. The report pages say there is insufficient Chrome User Experience Report data for these pages; these scores describe lab captures, not field-user outcomes.

## Saved settings

All four captures report Lighthouse **13.5.0** and `throttlingMethod: "simulate"`.

| Saved configuration      | Mobile, both variants | Desktop, both variants |
| ------------------------ | --------------------: | ---------------------: |
| `rttMs`                  |                   150 |                     40 |
| `throughputKbps`         |               1,638.4 |                 10,240 |
| `requestLatencyMs`       |                 562.5 |            Not present |
| `downloadThroughputKbps` |              1,474.56 |            Not present |
| `uploadThroughputKbps`   |                   675 |            Not present |
| `cpuSlowdownMultiplier`  |                   1.2 |                      1 |

These are the values saved in these particular reports, not a claim about every PageSpeed run or its default settings. The requested Product URLs in the reports include `?layout=profile`.

## Relationship to the September 23 comparison

The local ShakaPerf comparison uses a different date, environment and method: 20 paired measurements per case, `throttlingMethod: "devtools"`, 100 ms RTT, 2,700 Kbps download/upload, 200 ms request latency and a 3× CPU slowdown. The same settings apply to cold and warm local runs. The [saved warm desktop Lighthouse report](https://github.com/shakacode/gumroad/blob/f533e7ca1fb9e3cb21a296b8835d373a1858ca9b/compare-results/rorp-2026-09-23/raw/product-page-profile-layout-warm-landing-desktop-266c1124/artifacts/control_lighthouse_report.html) records those values and disables storage reset for that case.

Do not attach the local 3× CPU conditions to the PageSpeed score, merge the two datasets or use the local confidence intervals to describe PageSpeed variability. The PageSpeed evidence supports **53 → 80 mobile** and **66 → 98 desktop** for these individual captures. It does not establish a repeated-run range.

Live demo URLs are mutable. Archived reports describe their recorded runs and do not establish that the current deployments match the benchmark builds or each other in every dependency. For a new comparison, record each deployed revision, use matching conditions, and retain all runs rather than selecting the best score.
