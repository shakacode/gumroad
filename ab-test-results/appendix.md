# Gumroad Product performance appendix

Supporting evidence for the [Product-page article](index.md). The September 23 local comparison and October 1 hosted PageSpeed reports are separate measurements.

## Measured trade-offs

The September 23 run covers profile-layout Product landings on desktop and mobile, with 20 paired measurements per case. Both empty-cache and prepopulated-cache cases used DevTools throttling: 100 ms RTT, 2,700 Kbps download/upload, 200 ms request latency and 3× CPU slowdown. The warm cases are full-page navigations, not Inertia client-side navigations.

![Median browser-observed time to first byte, transferred data and network requests for the four profile-layout Product landing cases. Hatched amber bars are Inertia; solid blue bars are RSC. Each bar is also labeled.](images/product-page-tradeoffs.svg)

| Navigation         | Viewport | Metric                | Inertia median | RSC median |          Paired change (95% CI) |
| ------------------ | -------- | --------------------- | -------------: | ---------: | ------------------------------: |
| Empty cache        | Desktop  | Total Blocking Time   |          11 ms |     119 ms |       +109 ms (+107 to +111 ms) |
| Empty cache        | Desktop  | Browser-observed TTFB |         131 ms |     156 ms |          +28 ms (+20 to +32 ms) |
| Empty cache        | Desktop  | Transferred data      |     2,597.9 KB | 2,722.8 KB | +124.5 KB (+124.4 to +124.9 KB) |
| Empty cache        | Desktop  | Requests              |            143 |         96 |                −47 (−47 to −47) |
| Empty cache        | Mobile   | Total Blocking Time   |          12 ms |     121 ms |       +110 ms (+106 to +115 ms) |
| Empty cache        | Mobile   | Browser-observed TTFB |         129 ms |     162 ms |          +25 ms (+19 to +35 ms) |
| Empty cache        | Mobile   | Transferred data      |     2,597.9 KB | 2,722.0 KB | +124.4 KB (+124.0 to +124.5 KB) |
| Empty cache        | Mobile   | Requests              |            143 |         96 |                −47 (−47 to −47) |
| Prepopulated cache | Desktop  | Total Blocking Time   |           0 ms |      50 ms |          +46 ms (+41 to +51 ms) |
| Prepopulated cache | Desktop  | Browser-observed TTFB |         117 ms |     139 ms |          +20 ms (+17 to +24 ms) |
| Prepopulated cache | Desktop  | Transferred data      |       196.4 KB |    36.4 KB |       −160 KB (−160 to −160 KB) |
| Prepopulated cache | Desktop  | Requests              |            142 |         95 |                −47 (−47 to −47) |
| Prepopulated cache | Mobile   | Total Blocking Time   |           0 ms |      42 ms |          +41 ms (+36 to +46 ms) |
| Prepopulated cache | Mobile   | Browser-observed TTFB |         101 ms |     125 ms |          +23 ms (+18 to +46 ms) |
| Prepopulated cache | Mobile   | Transferred data      |       196.4 KB |    36.5 KB |       −160 KB (−160 to −160 KB) |
| Prepopulated cache | Mobile   | Requests              |            142 |         95 |                −47 (−47 to −47) |

Paired estimates are computed from within-pair differences, so they need not equal a subtraction of the displayed medians. [See the complete paint and trade-off measurements](benchmark-data/latest-results.md).

## Accessibility findings

The archived cold desktop and mobile reports each record 0 new, 0 fixed, 20 changed and 14 unchanged findings. The changed group contains 19 critical and 1 serious finding. For all 20 changed findings, the recorded failure description is the same on both sides; only the node's captured HTML differs:

| Rule                          | Changed findings per viewport | Difference in captured HTML                                      |
| ----------------------------- | ----------------------------: | ---------------------------------------------------------------- |
| `image-alt`                   |                            17 | Image URLs use different deployment hosts or seeded asset paths. |
| `aria-allowed-attr`           |                             2 | Generated `aria-describedby` IDs differ.                         |
| `scrollable-region-focusable` |                             1 | Inline-style whitespace and serialization differ.                |

These are existing violations, not a clean accessibility audit or proof of compliance. Warm accessibility checks were not captured. Inspect the raw [desktop accessibility report](https://github.com/shakacode/gumroad/blob/f533e7ca1fb9e3cb21a296b8835d373a1858ca9b/compare-results/rorp-2026-09-23/raw/product-page-profile-layout-cold-landing-desktop-6fad3788/accessibility.json) and [mobile accessibility report](https://github.com/shakacode/gumroad/blob/f533e7ca1fb9e3cb21a296b8835d373a1858ca9b/compare-results/rorp-2026-09-23/raw/product-page-profile-layout-cold-landing-phone-031456e8/accessibility.json).

The cold desktop and mobile screenshot comparisons recorded zero differing pixels. Warm visual checks were not captured. These results describe the captured states only.

## Raw measurements

- [September 23 tables](benchmark-data/latest-results.md) and [extracted samples, input-file hashes and user agents](benchmark-data/latest-results.json).
- [Archived September 23 raw artifacts](https://github.com/shakacode/gumroad/tree/f533e7ca1fb9e3cb21a296b8835d373a1858ca9b/compare-results/rorp-2026-09-23).
- [Self-contained September 23 performance report](https://github.com/shakacode/gumroad/blob/f533e7ca1fb9e3cb21a296b8835d373a1858ca9b/compare-results/rorp-2026-09-23/self-contained-performance-report.html), which can be downloaded and opened locally.
- [October 1 PageSpeed report links, timestamps and settings](pagespeed-evidence.md).

The extracted September 23 summary identifies input artifacts with SHA-256 hashes, but does not record the exact at-run application commit for each side. The archival repository commit identifies the stored evidence, not those tested application revisions. No time-aligned memory or swap telemetry is included, so this evidence cannot rule out host memory pressure. The sticky Add to cart replay is a separate recorded interaction, excluded from the 20-pair landing table.

<a id="earlier-comparisons-across-gumroad-pages"></a>
<a id="what-about-inertia-ssr"></a>

## Historical context

[Earlier page comparisons and the separate Inertia SSR experiment](historical-comparisons.md) used different implementations or conditions. They are retained for context and are not additional samples for the article's headline.
