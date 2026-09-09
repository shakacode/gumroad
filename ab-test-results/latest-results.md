# September 7 Gumroad RORP/RSC benchmark summary

Generated from `compare-results-sep-7-4am` using the [self-contained performance report](self-contained-performance-report.html).

## Provenance

- Source report generated: `2026-09-07T02:09:52.477Z`
- Report-only consolidation: `false`
- Pipeline: `compare`; recorded duration: `10726963` ms; errors: `0`
- Selected cases: `22`
- Successful main-perf cases: `22`; failed main-perf cases: `0`
- Source report SHA-256: `8193d8e5d31af0466a47aab9ed7d53606e5d976902376f291d1bfa7911a0678e`
- Self-contained HTML SHA-256: `38da544196ca799c20da139799101fd9ea784ea8f588b285fb124a9c359d1e12`
- Full HTML SHA-256: `4ef2315fac4fd0ac714abc97cdf0f75b3ee3cc7f91993713b7abfd1aaf0cc5ce`
- Canonical source-manifest SHA-256: `3006e0f37249eb7fab7203ed576e3fd3b536b1f4422d7c97c657de1f4d5e3312`
- The per-case Lighthouse HTML embeds the actual Lighthouse version and resolved throttling settings. The artifacts still do not embed the control SHA, experiment SHA, dirty-tree state, image digest, hardware description, or exact CLI invocation.
- The source manifest also hashes the retained timeline HTML, timeline previews, raw performance profiles, profile summaries, network logs, and correctness-stage files. Diagnostic Lighthouse/timeline captures are distinct from the main-perf sample distributions used below.

## Sampling cohorts

| Run ID                     | Harness profile   | Cases | Paired samples per case |
| -------------------------- | ----------------- | ----: | ----------------------: |
| `2026-09-06T23:11:05.514Z` | `lh-dfac673b9c65` |    22 |                      18 |

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
| TBT                 |            3 |           0 |                       19 |
| TTFB                |            0 |           1 |                       21 |
| LH Score            |           14 |           0 |                        8 |
| Total bytes         |            2 |          17 |                        3 |
| Total requests      |           22 |           0 |                        0 |
| JavaScript bytes    |            0 |           4 |                       18 |
| JavaScript requests |            8 |           0 |                       14 |

> The denominator is 22 successful main-perf cases, covering every selected case. These counts use perf.json metrics, not chips that may combine viewports or low-noise stages. They are not a pooled effect size.

## Descriptive reductions by visit cohort

Each percentage is (control median − experiment median) / control median. The mean gives every successful case equal weight; ranges are the minimum and maximum case percentages. These are descriptive summaries, not the paired estimator, confidence intervals, field outcomes, or pooled statistical effects. Negative reductions mean increases; zero-baseline percentages are omitted and counted in JSON.

| Cohort        | Cases | Mean FCP reduction (range) | Mean LCP reduction (range) | Mean request reduction (range) |
| ------------- | ----: | -------------------------: | -------------------------: | -----------------------------: |
| allSuccessful |    22 |         66.9% (45.9–87.7%) |         69.4% (50.8–87.5%) |             36.6% (19.1–60.3%) |
| cold          |    10 |         84.4% (78.4–87.7%) |         80.5% (77.4–87.5%) |             33.8% (19.1–58.4%) |
| warm          |    12 |         52.3% (45.9–63.2%) |         60.1% (50.8–65.5%) |             39.0% (20.2–60.3%) |
| coldPhone     |     5 |         84.4% (78.8–87.7%) |         80.4% (77.5–86.7%) |             33.8% (19.1–58.4%) |
| coldDesktop   |     5 |         84.4% (78.4–87.7%) |         80.6% (77.4–87.5%) |             33.8% (19.1–58.4%) |
| warmPhone     |     6 |         52.4% (46.0–63.2%) |         60.1% (50.8–64.0%) |             39.0% (20.2–60.3%) |
| warmDesktop   |     6 |         52.2% (45.9–61.6%) |         60.1% (50.8–65.5%) |             39.0% (20.2–60.3%) |

![Metric classifications across successful throttled cases](images/current-metric-classifications.svg)

## Correctness and retry signals

- Cases with accessibility regression chips: 6
- Cases with accessibility changes: 8
- Cases with accessibility fixes: 6
- Cases with visual changes: 2 (4 reported diffs across case/viewports)
- Cases marked flaky but recovered after retries: 4
- Recovered retry chips do not provide a uniform attempt count. Accessibility counts can repeat across desktop and phone and therefore are not summed here. A stage's successful execution does not establish equivalent visual or accessible output.

| Case                                                        | Correctness/retry chips                                                                                                                |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Discover Page - Marketplace cold landing (desktop)          | accessibility: 2 new in experiment; accessibility: 80 changed; accessibility: 14 fixed in experiment                                   |
| Discover Page - Marketplace cold landing (phone)            | accessibility: 2 new in experiment; accessibility: 80 changed; accessibility: 14 fixed in experiment                                   |
| Discover Page - Programming category cold landing (desktop) | accessibility: 58 new in experiment; accessibility: 34 changed; accessibility: 70 fixed in experiment                                  |
| Discover Page - Programming category cold landing (phone)   | accessibility: 58 new in experiment; accessibility: 34 changed; accessibility: 70 fixed in experiment                                  |
| Product Page - Discover layout cold landing (desktop)       | accessibility: 87 new in experiment; accessibility: 28 changed; accessibility: 99 fixed in experiment; flaky (recovered after retries) |
| Product Page - Discover layout cold landing (phone)         | accessibility: 87 new in experiment; accessibility: 28 changed; accessibility: 99 fixed in experiment; flaky (recovered after retries) |
| Product Page - Profile layout cold landing (desktop)        | accessibility: 40 changed; visual change: 2 diffs; flaky (recovered after retries)                                                     |
| Product Page - Profile layout cold landing (phone)          | accessibility: 40 changed; visual change: 2 diffs; flaky (recovered after retries)                                                     |

Raw accessibility comparison artifacts exist for 10 case/viewports. They record 147 new, 183 fixed, and 182 changed comparison findings. These are repeated case/viewport findings, not unique issues; the raw comparison and report-chip aggregation use different counts.

| Case                                                        | Control rule / node violations | Experiment rule / node violations | New / fixed / changed comparison findings |
| ----------------------------------------------------------- | -----------------------------: | --------------------------------: | ----------------------------------------: |
| Discover Page - Marketplace cold landing (desktop)          |                       11 / 135 |                           8 / 124 |                               2 / 13 / 33 |
| Discover Page - Marketplace cold landing (phone)            |                        8 / 125 |                           7 / 124 |                                0 / 1 / 47 |
| Discover Page - Programming category cold landing (desktop) |                       11 / 117 |                           8 / 106 |                               2 / 13 / 25 |
| Discover Page - Programming category cold landing (phone)   |                        8 / 107 |                           7 / 106 |                               56 / 57 / 9 |
| Product Page - Discover layout cold landing (desktop)       |                         9 / 96 |                            7 / 85 |                              64 / 75 / 14 |
| Product Page - Discover layout cold landing (phone)         |                         8 / 86 |                            7 / 85 |                              23 / 24 / 14 |
| Product Page - Profile layout cold landing (desktop)        |                         6 / 33 |                            6 / 33 |                                0 / 0 / 20 |
| Product Page - Profile layout cold landing (phone)          |                         6 / 33 |                            6 / 33 |                                0 / 0 / 20 |
| Seller Profile - Cold landing (desktop)                     |                          2 / 2 |                             2 / 2 |                                 0 / 0 / 0 |
| Seller Profile - Cold landing (phone)                       |                          2 / 2 |                             2 / 2 |                                 0 / 0 / 0 |

| Visual comparison above threshold                             | Mismatch | Difference pixels | Threshold |
| ------------------------------------------------------------- | -------: | ----------------: | --------: |
| Product Page - Profile layout cold landing (desktop), article |    0.63% |              3090 |      0.1% |
| Product Page - Profile layout cold landing (phone), article   |    5.24% |             78036 |      0.1% |

## Cold phone medians

| Surface                 |                          FCP |                          LCP |                      TTFB |                       Total bytes |                    JavaScript |               Requests |
| ----------------------- | ---------------------------: | ---------------------------: | ------------------------: | --------------------------------: | ----------------------------: | ---------------------: |
| Discover marketplace    |  5.86s → 1.24s (improvement) |  6.70s → 1.51s (improvement) | 83ms → 139ms (regression) |  1608.2KB → 1809.6KB (regression) | 911.4KB → 1378KB (regression) |  94 → 76 (improvement) |
| Discover category       |  5.84s → 1.08s (improvement) |  6.62s → 1.32s (improvement) |       64ms → 100ms (none) |  1475.2KB → 1673.1KB (regression) | 911.4KB → 1378KB (regression) |  89 → 71 (improvement) |
| Discover-layout Product | 10.04s → 1.25s (improvement) | 10.10s → 2.15s (improvement) |       73ms → 107ms (none) |    2804.7KB → 2921KB (regression) |              0KB → 0KB (none) | 145 → 94 (improvement) |
| Profile-layout Product  | 10.21s → 1.25s (improvement) | 10.28s → 2.15s (improvement) |       87ms → 107ms (none) |  2779.8KB → 2830.1KB (regression) |              0KB → 0KB (none) | 147 → 94 (improvement) |
| Seller Profile          |  8.76s → 1.16s (improvement) |  8.76s → 1.16s (improvement) |        39ms → 58ms (none) | 1776.1KB → 1521.9KB (improvement) |              0KB → 0KB (none) | 137 → 57 (improvement) |

![Throttled cold phone FCP](images/current-cold-phone-fcp.svg)

Try the React on Rails Pro pages: [1 · Discover marketplace](https://gumroad-rorp.reactonrails.com/discover) · [2 · Programming category](https://gumroad-rorp.reactonrails.com/software-development/programming) · [3 · Product (discover layout)](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=discover&recommended_by=search) · [4 · Product (profile layout)](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search) · [5 · Seller Profile](https://shakaperfprofile.gumroad-rorp.reactonrails.com/)

![Throttled cold phone JavaScript transfer](images/current-cold-phone-javascript.svg)

Try the React on Rails Pro pages: [1 · Discover marketplace](https://gumroad-rorp.reactonrails.com/discover) · [2 · Programming category](https://gumroad-rorp.reactonrails.com/software-development/programming) · [3 · Product (discover layout)](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=discover&recommended_by=search) · [4 · Product (profile layout)](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search) · [5 · Seller Profile](https://shakaperfprofile.gumroad-rorp.reactonrails.com/)

## All selected cases

Each value is the control median → experiment median. ShakaPerf's paired estimator may differ from subtracting the displayed medians.

| Scenario                                           | Viewport | Samples |                          FCP |                          LCP |                      TTFB |                       Total bytes |               Requests |
| -------------------------------------------------- | -------- | ------: | ---------------------------: | ---------------------------: | ------------------------: | --------------------------------: | ---------------------: |
| Discover Page - Marketplace cold landing           | desktop  |      18 |  5.86s → 1.26s (improvement) |  6.66s → 1.51s (improvement) |       82ms → 128ms (none) |  1607.9KB → 1809.6KB (regression) |  94 → 76 (improvement) |
| Discover Page - Marketplace cold landing           | phone    |      18 |  5.86s → 1.24s (improvement) |  6.70s → 1.51s (improvement) | 83ms → 139ms (regression) |  1608.2KB → 1809.6KB (regression) |  94 → 76 (improvement) |
| Discover Page - Marketplace warm landing           | desktop  |      18 |  629ms → 340ms (improvement) |  1.18s → 423ms (improvement) |        58ms → 93ms (none) |      26.9KB → 49.2KB (regression) |  94 → 75 (improvement) |
| Discover Page - Marketplace warm landing           | phone    |      18 |  626ms → 331ms (improvement) |  1.14s → 409ms (improvement) |        58ms → 94ms (none) |            26.9KB → 49.2KB (none) |  94 → 75 (improvement) |
| Discover Page - Programming category cold landing  | desktop  |      18 |  5.83s → 1.07s (improvement) |  6.60s → 1.31s (improvement) |       77ms → 126ms (none) |  1475.5KB → 1673.1KB (regression) |  89 → 71 (improvement) |
| Discover Page - Programming category cold landing  | phone    |      18 |  5.84s → 1.08s (improvement) |  6.62s → 1.32s (improvement) |       64ms → 100ms (none) |  1475.2KB → 1673.1KB (regression) |  89 → 71 (improvement) |
| Discover Page - Programming category warm landing  | desktop  |      18 |  627ms → 331ms (improvement) |  1.19s → 411ms (improvement) |        55ms → 95ms (none) |      27.7KB → 49.8KB (regression) |  89 → 70 (improvement) |
| Discover Page - Programming category warm landing  | phone    |      18 |  626ms → 338ms (improvement) |  1.16s → 426ms (improvement) |        54ms → 93ms (none) |      27.7KB → 49.9KB (regression) |  89 → 70 (improvement) |
| Product Page - Discover layout cold landing        | desktop  |      18 | 10.04s → 1.26s (improvement) | 10.09s → 2.14s (improvement) |       72ms → 105ms (none) |    2791.2KB → 2921KB (regression) | 145 → 94 (improvement) |
| Product Page - Discover layout cold landing        | phone    |      18 | 10.04s → 1.25s (improvement) | 10.10s → 2.15s (improvement) |       73ms → 107ms (none) |    2804.7KB → 2921KB (regression) | 145 → 94 (improvement) |
| Product Page - Discover layout warm landing        | desktop  |      18 |  702ms → 317ms (improvement) |  799ms → 317ms (improvement) |       81ms → 117ms (none) |      30.1KB → 51.3KB (regression) | 144 → 93 (improvement) |
| Product Page - Discover layout warm landing        | phone    |      18 |  710ms → 317ms (improvement) |  811ms → 317ms (improvement) |       78ms → 117ms (none) |      30.1KB → 51.3KB (regression) | 144 → 93 (improvement) |
| Product Page - Profile layout cold landing         | desktop  |      18 | 10.22s → 1.26s (improvement) | 10.28s → 2.12s (improvement) |       84ms → 106ms (none) |  2777.5KB → 2830.1KB (regression) | 147 → 94 (improvement) |
| Product Page - Profile layout cold landing         | phone    |      18 | 10.21s → 1.25s (improvement) | 10.28s → 2.15s (improvement) |       87ms → 107ms (none) |  2779.8KB → 2830.1KB (regression) | 147 → 94 (improvement) |
| Product Page - Profile layout warm landing         | desktop  |      18 |  703ms → 333ms (improvement) |  802ms → 333ms (improvement) |       94ms → 117ms (none) |      22.5KB → 35.1KB (regression) | 146 → 93 (improvement) |
| Product Page - Profile layout warm landing         | phone    |      18 |  695ms → 334ms (improvement) |  798ms → 334ms (improvement) |       89ms → 113ms (none) |      22.5KB → 35.1KB (regression) | 146 → 93 (improvement) |
| Seller Profile - Cold landing                      | desktop  |      18 |  8.78s → 1.18s (improvement) |  9.38s → 1.18s (improvement) |        38ms → 58ms (none) | 1776.6KB → 1521.9KB (improvement) | 137 → 57 (improvement) |
| Seller Profile - Cold landing                      | phone    |      18 |  8.76s → 1.16s (improvement) |  8.76s → 1.16s (improvement) |        39ms → 58ms (none) | 1776.1KB → 1521.9KB (improvement) | 137 → 57 (improvement) |
| Seller Profile - Warm landing                      | desktop  |      18 |  659ms → 324ms (improvement) |  659ms → 324ms (improvement) |        42ms → 57ms (none) |            13.5KB → 20.9KB (none) | 136 → 54 (improvement) |
| Seller Profile - Warm landing                      | phone    |      18 |  663ms → 326ms (improvement) |  663ms → 326ms (improvement) |        39ms → 57ms (none) |            13.5KB → 20.9KB (none) | 136 → 54 (improvement) |
| Seller Profile - Landing after product page warmup | desktop  |      18 |  864ms → 332ms (improvement) |  864ms → 332ms (improvement) |        38ms → 57ms (none) |      34.8KB → 74.3KB (regression) | 136 → 54 (improvement) |
| Seller Profile - Landing after product page warmup | phone    |      18 |  862ms → 317ms (improvement) |  862ms → 317ms (improvement) |        41ms → 58ms (none) |      34.9KB → 74.3KB (regression) | 136 → 54 (improvement) |

The machine-readable form of this summary is [latest-results.json](latest-results.json).
