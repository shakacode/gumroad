# September 4 Gumroad RORP/RSC benchmark summary

Generated from `compare-results-4-sep-8am` using the [self-contained performance report](self-contained-performance-report.html).

## Provenance

- Source report generated: `2026-09-04T05:01:00.641Z`
- Report-only consolidation: `false`
- Pipeline: `compare`; recorded duration: `4522371` ms; errors: `0`
- Selected cases: `22`
- Successful main-perf cases: `22`; failed main-perf cases: `0`
- Source report SHA-256: `71de83927883102b3914fbe4a47dc3e37f04b4b2da290d11c15e799e1d6f8869`
- Self-contained HTML SHA-256: `1820cad40c86e1499737d3cc38f49d64b701c1e5702340a7df7ee725de896493`
- Full HTML SHA-256: `af2b6642026f1814b744d316a82f9337e9e67ed2948e17d1b3f1d29339716f9c`
- Canonical source-manifest SHA-256: `5d7c056501e677e252800302f70c4d8ee06168b97f20509931f40493d07f197b`
- The per-case Lighthouse HTML embeds the actual Lighthouse version and resolved throttling settings. The artifacts still do not embed the control SHA, experiment SHA, dirty-tree state, image digest, hardware description, or exact CLI invocation.
- The source manifest also hashes the retained timeline HTML, timeline previews, raw performance profiles, profile summaries, network logs, and correctness-stage files. Diagnostic Lighthouse/timeline captures are distinct from the main-perf sample distributions used below.

## Sampling cohorts

| Run ID                     | Harness profile   | Cases | Paired samples per case |
| -------------------------- | ----------------- | ----: | ----------------------: |
| `2026-09-04T03:45:38.270Z` | `lh-dfac673b9c65` |    22 |                      18 |

## Artifact-embedded harness profiles

| Profile           | Cases | Lighthouse | Method     |    RTT | Download / upload | Request latency | CPU slowdown |
| ----------------- | ----: | ---------- | ---------- | -----: | ----------------: | --------------: | -----------: |
| `lh-dfac673b9c65` |    22 | 13.4.1     | `devtools` | 100 ms |  2700 / 2700 Kbps |          200 ms |           3× |

> The 22 successful main-perf cases contain 1 sampling cohort and 1 artifact-embedded throttling profile. Every successful case has matching embedded control/experiment Lighthouse settings.

## Aggregate classifications

| Metric              | Improvements | Regressions | No classified difference |
| ------------------- | -----------: | ----------: | -----------------------: |
| FCP                 |           22 |           0 |                        0 |
| LCP                 |           22 |           0 |                        0 |
| Speed Index         |           22 |           0 |                        0 |
| TBT                 |            0 |           0 |                       22 |
| TTFB                |            3 |           4 |                       15 |
| LH Score            |           13 |           0 |                        9 |
| Total bytes         |            6 |          16 |                        0 |
| Total requests      |           22 |           0 |                        0 |
| JavaScript bytes    |            8 |           4 |                       10 |
| JavaScript requests |           22 |           0 |                        0 |

> The denominator is 22 successful main-perf cases, covering every selected case. These counts use perf.json metrics, not chips that may combine viewports or low-noise stages. They are not a pooled effect size.

## Descriptive reductions by visit cohort

Each percentage is (control median − experiment median) / control median. The mean gives every successful case equal weight; ranges are the minimum and maximum case percentages. These are descriptive summaries, not the paired estimator, confidence intervals, field outcomes, or pooled statistical effects. Negative reductions mean increases; zero-baseline percentages are omitted and counted in JSON.

| Cohort        | Cases | Mean FCP reduction (range) | Mean LCP reduction (range) | Mean request reduction (range) |
| ------------- | ----: | -------------------------: | -------------------------: | -----------------------------: |
| allSuccessful |    22 |         68.3% (44.3–90.8%) |         71.9% (52.3–91.1%) |             36.5% (19.1–60.3%) |
| cold          |    10 |         86.9% (81.2–90.8%) |         85.1% (80.2–91.1%) |             33.5% (19.1–58.4%) |
| warm          |    12 |         52.8% (44.3–63.7%) |         60.9% (52.3–65.5%) |             39.0% (20.2–60.3%) |
| coldPhone     |     5 |         86.8% (81.2–90.4%) |         85.6% (80.2–89.8%) |             33.6% (19.1–58.4%) |
| coldDesktop   |     5 |         87.0% (81.7–90.8%) |         84.6% (81.2–91.1%) |             33.4% (19.1–58.4%) |
| warmPhone     |     6 |         53.2% (45.3–63.7%) |         60.8% (53.3–63.7%) |             39.0% (20.2–60.3%) |
| warmDesktop   |     6 |         52.5% (44.3–63.7%) |         61.0% (52.3–65.5%) |             39.0% (20.2–60.3%) |

![Metric classifications across successful throttled cases](images/current-metric-classifications.svg)

## Correctness and retry signals

- Cases with accessibility regression chips: 6
- Cases with accessibility changes: 8
- Cases with accessibility fixes: 6
- Cases with visual changes: 2 (4 reported diffs across case/viewports)
- Cases marked flaky but recovered after retries: 2
- Recovered retry chips do not provide a uniform attempt count. Accessibility counts can repeat across desktop and phone and therefore are not summed here. A stage's successful execution does not establish equivalent visual or accessible output.

| Case                                                        | Correctness/retry chips                                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Discover Page - Marketplace cold landing (desktop)          | accessibility: 2 new in experiment; accessibility: 20 changed; accessibility: 14 fixed in experiment  |
| Discover Page - Marketplace cold landing (phone)            | accessibility: 2 new in experiment; accessibility: 20 changed; accessibility: 14 fixed in experiment  |
| Discover Page - Programming category cold landing (desktop) | accessibility: 58 new in experiment; accessibility: 10 changed; accessibility: 70 fixed in experiment |
| Discover Page - Programming category cold landing (phone)   | accessibility: 58 new in experiment; accessibility: 10 changed; accessibility: 70 fixed in experiment |
| Product Page - Discover layout cold landing (desktop)       | accessibility: 87 new in experiment; accessibility: 28 changed; accessibility: 99 fixed in experiment |
| Product Page - Discover layout cold landing (phone)         | accessibility: 87 new in experiment; accessibility: 28 changed; accessibility: 99 fixed in experiment |
| Product Page - Profile layout cold landing (desktop)        | accessibility: 20 changed; visual change: 2 diffs; flaky (recovered after retries)                    |
| Product Page - Profile layout cold landing (phone)          | accessibility: 20 changed; visual change: 2 diffs; flaky (recovered after retries)                    |

Raw accessibility comparison artifacts exist for 10 case/viewports. They record 147 new, 183 fixed, and 78 changed comparison findings. These are repeated case/viewport findings, not unique issues; the raw comparison and report-chip aggregation use different counts.

| Case                                                        | Control rule / node violations | Experiment rule / node violations | New / fixed / changed comparison findings |
| ----------------------------------------------------------- | -----------------------------: | --------------------------------: | ----------------------------------------: |
| Discover Page - Marketplace cold landing (desktop)          |                       11 / 135 |                           8 / 124 |                                2 / 13 / 3 |
| Discover Page - Marketplace cold landing (phone)            |                        8 / 125 |                           7 / 124 |                                0 / 1 / 17 |
| Discover Page - Programming category cold landing (desktop) |                       11 / 117 |                           8 / 106 |                                2 / 13 / 1 |
| Discover Page - Programming category cold landing (phone)   |                        8 / 107 |                           7 / 106 |                               56 / 57 / 9 |
| Product Page - Discover layout cold landing (desktop)       |                         9 / 96 |                            7 / 85 |                              64 / 75 / 14 |
| Product Page - Discover layout cold landing (phone)         |                         8 / 86 |                            7 / 85 |                              23 / 24 / 14 |
| Product Page - Profile layout cold landing (desktop)        |                         6 / 33 |                            6 / 33 |                                0 / 0 / 10 |
| Product Page - Profile layout cold landing (phone)          |                         6 / 33 |                            6 / 33 |                                0 / 0 / 10 |
| Seller Profile - Cold landing (desktop)                     |                          2 / 2 |                             2 / 2 |                                 0 / 0 / 0 |
| Seller Profile - Cold landing (phone)                       |                          2 / 2 |                             2 / 2 |                                 0 / 0 / 0 |

| Visual comparison above threshold                             | Mismatch | Difference pixels | Threshold |
| ------------------------------------------------------------- | -------: | ----------------: | --------: |
| Product Page - Profile layout cold landing (desktop), article |    0.63% |              3090 |      0.1% |
| Product Page - Profile layout cold landing (phone), article   |    5.24% |             78036 |      0.1% |

## Cold phone medians

| Surface                 |                          FCP |                          LCP |                        TTFB |                       Total bytes |                       JavaScript |                 Requests |
| ----------------------- | ---------------------------: | ---------------------------: | --------------------------: | --------------------------------: | -------------------------------: | -----------------------: |
| Discover marketplace    |  7.10s → 1.34s (improvement) |  7.96s → 1.58s (improvement) |   99ms → 161ms (regression) |  1614.8KB → 1804.2KB (regression) |  918.7KB → 1376.1KB (regression) |    94 → 76 (improvement) |
| Discover category       |  7.69s → 1.28s (improvement) |  8.79s → 1.57s (improvement) |        144ms → 334ms (none) |  1480.1KB → 1669.2KB (regression) |  918.7KB → 1376.1KB (regression) |    89 → 71 (improvement) |
| Discover-layout Product | 17.32s → 1.66s (improvement) | 17.37s → 2.15s (improvement) |        279ms → 333ms (none) | 3574.9KB → 2946.5KB (improvement) | 1264.9KB → 841.8KB (improvement) | 145 → 95.5 (improvement) |
| Profile-layout Product  | 18.67s → 1.97s (improvement) | 18.73s → 2.22s (improvement) |  282ms → 466ms (regression) | 3564.9KB → 2855.1KB (improvement) | 1249.9KB → 869.9KB (improvement) |   147 → 94 (improvement) |
| Seller Profile          | 11.38s → 1.16s (improvement) | 11.38s → 1.16s (improvement) | 236ms → 108ms (improvement) | 2544.4KB → 1548.4KB (improvement) |   1236KB → 459.3KB (improvement) |   137 → 57 (improvement) |

![Throttled cold phone FCP](images/current-cold-phone-fcp.svg)

Try the React on Rails Pro pages: [1 · Discover marketplace](https://gumroad-rorp.reactonrails.com/discover) · [2 · Programming category](https://gumroad-rorp.reactonrails.com/software-development/programming) · [3 · Product (discover layout)](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=discover&recommended_by=search) · [4 · Product (profile layout)](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search) · [5 · Seller Profile](https://shakaperfprofile.gumroad-rorp.reactonrails.com/)

![Throttled cold phone JavaScript transfer](images/current-cold-phone-javascript.svg)

Try the React on Rails Pro pages: [1 · Discover marketplace](https://gumroad-rorp.reactonrails.com/discover) · [2 · Programming category](https://gumroad-rorp.reactonrails.com/software-development/programming) · [3 · Product (discover layout)](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=discover&recommended_by=search) · [4 · Product (profile layout)](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search) · [5 · Seller Profile](https://shakaperfprofile.gumroad-rorp.reactonrails.com/)

## All selected cases

Each value is the control median → experiment median. ShakaPerf's paired estimator may differ from subtracting the displayed medians.

| Scenario                                           | Viewport | Samples |                          FCP |                          LCP |                        TTFB |                       Total bytes |                 Requests |
| -------------------------------------------------- | -------- | ------: | ---------------------------: | ---------------------------: | --------------------------: | --------------------------------: | -----------------------: |
| Discover Page - Marketplace cold landing           | desktop  |      18 |  6.84s → 1.25s (improvement) |  7.67s → 1.44s (improvement) | 461ms → 169ms (improvement) |    1615KB → 1804.3KB (regression) |    94 → 76 (improvement) |
| Discover Page - Marketplace cold landing           | phone    |      18 |  7.10s → 1.34s (improvement) |  7.96s → 1.58s (improvement) |   99ms → 161ms (regression) |  1614.8KB → 1804.2KB (regression) |    94 → 76 (improvement) |
| Discover Page - Marketplace warm landing           | desktop  |      18 |  635ms → 354ms (improvement) |  1.22s → 439ms (improvement) |         99ms → 166ms (none) |      26.4KB → 48.7KB (regression) |    94 → 75 (improvement) |
| Discover Page - Marketplace warm landing           | phone    |      18 |  637ms → 345ms (improvement) |  1.16s → 439ms (improvement) |   99ms → 164ms (regression) |      26.4KB → 48.6KB (regression) |    94 → 75 (improvement) |
| Discover Page - Programming category cold landing  | desktop  |      18 |  7.04s → 1.14s (improvement) |  8.07s → 1.30s (improvement) |        148ms → 229ms (none) |  1479.1KB → 1669.2KB (regression) |    89 → 71 (improvement) |
| Discover Page - Programming category cold landing  | phone    |      18 |  7.69s → 1.28s (improvement) |  8.79s → 1.57s (improvement) |        144ms → 334ms (none) |  1480.1KB → 1669.2KB (regression) |    89 → 71 (improvement) |
| Discover Page - Programming category warm landing  | desktop  |      18 |  626ms → 344ms (improvement) |  1.23s → 423ms (improvement) |        106ms → 152ms (none) |      27.2KB → 49.3KB (regression) |    89 → 70 (improvement) |
| Discover Page - Programming category warm landing  | phone    |      18 |  645ms → 353ms (improvement) |  1.19s → 433ms (improvement) |        111ms → 178ms (none) |      27.2KB → 49.3KB (regression) |    89 → 70 (improvement) |
| Product Page - Discover layout cold landing        | desktop  |      18 | 12.72s → 1.41s (improvement) | 12.79s → 2.17s (improvement) |        375ms → 226ms (none) | 3573.1KB → 2841.1KB (improvement) |   145 → 97 (improvement) |
| Product Page - Discover layout cold landing        | phone    |      18 | 17.32s → 1.66s (improvement) | 17.37s → 2.15s (improvement) |        279ms → 333ms (none) | 3574.9KB → 2946.5KB (improvement) | 145 → 95.5 (improvement) |
| Product Page - Discover layout warm landing        | desktop  |      18 |  737ms → 321ms (improvement) |  834ms → 321ms (improvement) |        139ms → 202ms (none) |      29.8KB → 50.9KB (regression) |   144 → 93 (improvement) |
| Product Page - Discover layout warm landing        | phone    |      18 |  741ms → 328ms (improvement) |  843ms → 328ms (improvement) |        165ms → 185ms (none) |      29.8KB → 50.9KB (regression) |   144 → 93 (improvement) |
| Product Page - Profile layout cold landing         | desktop  |      18 | 13.11s → 1.35s (improvement) | 13.17s → 2.15s (improvement) | 448ms → 196ms (improvement) | 3564.7KB → 2855.1KB (improvement) |   147 → 94 (improvement) |
| Product Page - Profile layout cold landing         | phone    |      18 | 18.67s → 1.97s (improvement) | 18.73s → 2.22s (improvement) |  282ms → 466ms (regression) | 3564.9KB → 2855.1KB (improvement) |   147 → 94 (improvement) |
| Product Page - Profile layout warm landing         | desktop  |      18 |  726ms → 341ms (improvement) |  828ms → 341ms (improvement) |  125ms → 181ms (regression) |      22.1KB → 34.7KB (regression) |   146 → 93 (improvement) |
| Product Page - Profile layout warm landing         | phone    |      18 |  732ms → 328ms (improvement) |  844ms → 328ms (improvement) |        159ms → 171ms (none) |      22.1KB → 34.7KB (regression) |   146 → 93 (improvement) |
| Seller Profile - Cold landing                      | desktop  |      18 | 13.63s → 1.25s (improvement) | 14.06s → 1.25s (improvement) |        232ms → 145ms (none) | 2545.1KB → 1548.4KB (improvement) |   137 → 57 (improvement) |
| Seller Profile - Cold landing                      | phone    |      18 | 11.38s → 1.16s (improvement) | 11.38s → 1.16s (improvement) | 236ms → 108ms (improvement) | 2544.4KB → 1548.4KB (improvement) |   137 → 57 (improvement) |
| Seller Profile - Warm landing                      | desktop  |      18 |  702ms → 335ms (improvement) |  702ms → 335ms (improvement) |          61ms → 87ms (none) |      13.2KB → 20.5KB (regression) |   136 → 54 (improvement) |
| Seller Profile - Warm landing                      | phone    |      18 |  706ms → 330ms (improvement) |  706ms → 330ms (improvement) |          64ms → 91ms (none) |      13.2KB → 20.5KB (regression) |   136 → 54 (improvement) |
| Seller Profile - Landing after product page warmup | desktop  |      18 |  888ms → 322ms (improvement) |  888ms → 322ms (improvement) |          68ms → 97ms (none) |      35.2KB → 74.1KB (regression) |   136 → 54 (improvement) |
| Seller Profile - Landing after product page warmup | phone    |      18 |  876ms → 318ms (improvement) |  876ms → 318ms (improvement) |          73ms → 90ms (none) |      35.1KB → 74.1KB (regression) |   136 → 54 (improvement) |

The machine-readable form of this summary is [latest-results.json](latest-results.json).
