# September 1 Gumroad RORP/RSC benchmark summary

## Report configuration

- Control (Inertia) commit: `TODO_CONTROL_COMMIT_SHA`
- Experiment (RORP/RSC) commit: `TODO_EXPERIMENT_COMMIT_SHA`

These placeholders are for the source revisions used in the measured run.

Throttling: **DevTools**, **100 ms RTT**, **2,700 Kbps download and upload**, **200 ms request latency**, and **3× CPU slowdown**. See `LIGHTHOUSE_CONFIG` in [abtests.config.ts](../abtests.config.ts).

[Open the self-contained performance report](self-contained-performance-report.html).

Generated from `compare-results-1-sep-11pm` by `extract-latest-results.mjs`.

## Provenance

- Source report generated: `2026-09-01T21:10:07.936Z`
- Report-only consolidation: `false`
- Pipeline: `compare`; recorded duration: `4576186` ms; errors: `0`
- Selected cases: `22`
- Successful main-perf cases: `22`; failed main-perf cases: `0`
- Source report SHA-256: `402e63b866c5a39f114e662a4c88b5baa32302154ae5652ab4a72dd9393e3c19`
- Self-contained HTML SHA-256: `fc97d295d9412477696f89fc65e86e648c511dc418aa9f3e3c2f07a6bfffddc7`
- Full HTML SHA-256: `7f8d9e5c90dc05953e54dacc84ded3033cbdbbca728e607fe8a7c2ae4e48db92`
- Unreferenced-results catalog SHA-256: `8e963acf9097d3bb00bfc2e2f9b80e53e2b078250ab03debc1e3d4104fe5eeae`
- Canonical source-manifest SHA-256: `8c3037632b185bf01399b6df7f6848b916c6cb60593d49480723897daf21954b`
- The per-case Lighthouse HTML embeds the actual Lighthouse version and resolved throttling settings. The artifacts still do not embed the control SHA, experiment SHA, dirty-tree state, image digest, hardware description, or exact CLI invocation.
- The source manifest also hashes the retained timeline HTML, timeline previews, raw performance profiles, profile summaries, network logs, and correctness-stage files. Diagnostic Lighthouse/timeline captures are distinct from the main-perf sample distributions used below.

## Sampling cohorts

| Run ID                     | Harness profile   | Cases | Paired samples per case |
| -------------------------- | ----------------- | ----: | ----------------------: |
| `2026-09-01T19:53:51.750Z` | `lh-dfac673b9c65` |    22 |                      18 |

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
| TBT                 |            5 |           0 |                       17 |
| TTFB                |            0 |           5 |                       17 |
| LH Score            |           14 |           0 |                        8 |
| Total bytes         |            6 |          16 |                        0 |
| Total requests      |           22 |           0 |                        0 |
| JavaScript bytes    |            8 |           4 |                       10 |
| JavaScript requests |           22 |           0 |                        0 |

> The denominator is 22 successful main-perf cases, covering every selected case. These counts use perf.json metrics, not chips that may combine viewports or low-noise stages. They are not a pooled effect size.

## Descriptive reductions by visit cohort

Each percentage is (control median − experiment median) / control median. The mean gives every successful case equal weight; ranges are the minimum and maximum case percentages. These are descriptive summaries, not the paired estimator, confidence intervals, field outcomes, or pooled statistical effects. Negative reductions mean increases; zero-baseline percentages are omitted and counted in JSON.

| Cohort        | Cases | Mean FCP reduction (range) | Mean LCP reduction (range) | Mean request reduction (range) |
| ------------- | ----: | -------------------------: | -------------------------: | -----------------------------: |
| allSuccessful |    22 |         68.3% (39.5–91.8%) |         68.6% (43.7–91.8%) |             36.6% (19.1–60.3%) |
| cold          |    10 |         86.0% (77.6–91.8%) |         80.1% (70.1–91.8%) |             33.7% (19.1–58.4%) |
| warm          |    12 |         53.6% (39.5–68.0%) |         58.9% (43.7–69.2%) |             39.0% (20.2–60.3%) |
| coldPhone     |     5 |         85.7% (77.6–91.8%) |         80.5% (70.2–91.8%) |             33.6% (19.1–58.4%) |
| coldDesktop   |     5 |         86.2% (80.1–89.7%) |         79.8% (70.1–89.7%) |             33.8% (19.1–58.4%) |
| warmPhone     |     6 |         51.5% (39.5–68.0%) |         61.3% (52.3–68.0%) |             39.0% (20.2–60.3%) |
| warmDesktop   |     6 |         55.7% (50.5–66.2%) |         56.5% (43.7–69.2%) |             39.0% (20.2–60.3%) |

![Metric classifications across successful throttled cases](images/current-metric-classifications.svg)

## Cold phone medians

| Surface                 |                          FCP |                          LCP |                       TTFB |                       Total bytes |                       JavaScript |                 Requests |
| ----------------------- | ---------------------------: | ---------------------------: | -------------------------: | --------------------------------: | -------------------------------: | -----------------------: |
| Discover marketplace    |  8.77s → 1.97s (improvement) |  9.65s → 2.88s (improvement) | 252ms → 583ms (regression) |  1602.7KB → 2055.2KB (regression) |  918.7KB → 1376.2KB (regression) |    94 → 76 (improvement) |
| Discover category       |  8.11s → 1.55s (improvement) |  9.12s → 2.35s (improvement) |       216ms → 575ms (none) |  1472.3KB → 1931.4KB (regression) |  918.7KB → 1376.2KB (regression) |    89 → 71 (improvement) |
| Discover-layout Product | 13.76s → 1.67s (improvement) | 13.83s → 2.43s (improvement) |       699ms → 482ms (none) | 3572.9KB → 3125.5KB (improvement) | 1264.9KB → 841.9KB (improvement) | 145 → 95.5 (improvement) |
| Profile-layout Product  | 14.35s → 1.38s (improvement) | 14.40s → 2.36s (improvement) |       335ms → 285ms (none) | 3549.9KB → 2968.7KB (improvement) |   1249.9KB → 870KB (improvement) |   147 → 94 (improvement) |
| Seller Profile          | 13.86s → 1.14s (improvement) | 13.86s → 1.14s (improvement) |       393ms → 234ms (none) | 2543.5KB → 1609.1KB (improvement) |   1236KB → 459.4KB (improvement) |   137 → 57 (improvement) |

![Throttled cold phone FCP](images/current-cold-phone-fcp.svg)

![Throttled cold phone JavaScript transfer](images/current-cold-phone-javascript.svg)

## All selected cases

Each value is the control median → experiment median. ShakaPerf's paired estimator may differ from subtracting the displayed medians.

| Scenario                                           | Viewport | Samples |                          FCP |                          LCP |                       TTFB |                       Total bytes |                 Requests |
| -------------------------------------------------- | -------- | ------: | ---------------------------: | ---------------------------: | -------------------------: | --------------------------------: | -----------------------: |
| Discover Page - Marketplace cold landing           | desktop  |      18 |  7.29s → 1.45s (improvement) |  8.44s → 2.52s (improvement) |       209ms → 282ms (none) |  1602.7KB → 2055.1KB (regression) |    94 → 76 (improvement) |
| Discover Page - Marketplace cold landing           | phone    |      18 |  8.77s → 1.97s (improvement) |  9.65s → 2.88s (improvement) | 252ms → 583ms (regression) |  1602.7KB → 2055.2KB (regression) |    94 → 76 (improvement) |
| Discover Page - Marketplace warm landing           | desktop  |      18 |  652ms → 317ms (improvement) |  1.22s → 399ms (improvement) |       105ms → 155ms (none) |     26.4KB → 299.5KB (regression) |    94 → 75 (improvement) |
| Discover Page - Marketplace warm landing           | phone    |      18 |  637ms → 362ms (improvement) |  1.18s → 391ms (improvement) |       100ms → 158ms (none) |     26.4KB → 298.6KB (regression) |    94 → 75 (improvement) |
| Discover Page - Programming category cold landing  | desktop  |      18 |  7.07s → 1.17s (improvement) |  7.86s → 2.09s (improvement) |       175ms → 261ms (none) |  1465.1KB → 1931.5KB (regression) |    89 → 71 (improvement) |
| Discover Page - Programming category cold landing  | phone    |      18 |  8.11s → 1.55s (improvement) |  9.12s → 2.35s (improvement) |       216ms → 575ms (none) |  1472.3KB → 1931.4KB (regression) |    89 → 71 (improvement) |
| Discover Page - Programming category warm landing  | desktop  |      18 |  658ms → 326ms (improvement) |  1.25s → 385ms (improvement) | 108ms → 150ms (regression) |     27.2KB → 310.4KB (regression) |    89 → 70 (improvement) |
| Discover Page - Programming category warm landing  | phone    |      18 |  643ms → 389ms (improvement) |  1.20s → 389ms (improvement) |  98ms → 156ms (regression) |     27.2KB → 310.4KB (regression) |    89 → 70 (improvement) |
| Product Page - Discover layout cold landing        | desktop  |      18 | 14.94s → 1.53s (improvement) | 15.01s → 2.40s (improvement) |       287ms → 413ms (none) | 3584.1KB → 3125.5KB (improvement) |   145 → 94 (improvement) |
| Product Page - Discover layout cold landing        | phone    |      18 | 13.76s → 1.67s (improvement) | 13.83s → 2.43s (improvement) |       699ms → 482ms (none) | 3572.9KB → 3125.5KB (improvement) | 145 → 95.5 (improvement) |
| Product Page - Discover layout warm landing        | desktop  |      18 |  770ms → 350ms (improvement) |  865ms → 410ms (improvement) |       174ms → 188ms (none) |     29.8KB → 229.9KB (regression) |   144 → 93 (improvement) |
| Product Page - Discover layout warm landing        | phone    |      18 |  749ms → 402ms (improvement) |  854ms → 407ms (improvement) | 146ms → 192ms (regression) |     29.8KB → 229.8KB (regression) |   144 → 93 (improvement) |
| Product Page - Profile layout cold landing         | desktop  |      18 | 13.63s → 1.57s (improvement) | 13.69s → 2.48s (improvement) |       313ms → 401ms (none) | 3549.9KB → 2968.7KB (improvement) |   147 → 94 (improvement) |
| Product Page - Profile layout cold landing         | phone    |      18 | 14.35s → 1.38s (improvement) | 14.40s → 2.36s (improvement) |       335ms → 285ms (none) | 3549.9KB → 2968.7KB (improvement) |   147 → 94 (improvement) |
| Product Page - Profile layout warm landing         | desktop  |      18 |  773ms → 382ms (improvement) |  870ms → 490ms (improvement) |       184ms → 214ms (none) |     22.1KB → 148.3KB (regression) |   146 → 93 (improvement) |
| Product Page - Profile layout warm landing         | phone    |      18 |  792ms → 384ms (improvement) |  919ms → 435ms (improvement) |       228ms → 225ms (none) |     22.1KB → 148.3KB (regression) |   146 → 93 (improvement) |
| Seller Profile - Cold landing                      | desktop  |      18 | 10.26s → 1.10s (improvement) | 10.75s → 1.10s (improvement) |       368ms → 213ms (none) | 2542.7KB → 1609.1KB (improvement) |   137 → 57 (improvement) |
| Seller Profile - Cold landing                      | phone    |      18 | 13.86s → 1.14s (improvement) | 13.86s → 1.14s (improvement) |       393ms → 234ms (none) | 2543.5KB → 1609.1KB (improvement) |   137 → 57 (improvement) |
| Seller Profile - Warm landing                      | desktop  |      18 |  745ms → 291ms (improvement) |  745ms → 380ms (improvement) |       110ms → 140ms (none) |        13.2KB → 81KB (regression) |   136 → 54 (improvement) |
| Seller Profile - Warm landing                      | phone    |      18 |  753ms → 295ms (improvement) |  753ms → 295ms (improvement) |       100ms → 131ms (none) |        13.2KB → 81KB (regression) |   136 → 54 (improvement) |
| Seller Profile - Landing after product page warmup | desktop  |      18 |  917ms → 310ms (improvement) |  917ms → 391ms (improvement) | 105ms → 156ms (regression) |     35.1KB → 134.6KB (regression) |   136 → 54 (improvement) |
| Seller Profile - Landing after product page warmup | phone    |      18 |  933ms → 299ms (improvement) |  933ms → 299ms (improvement) |       110ms → 145ms (none) |     35.1KB → 134.6KB (regression) |   136 → 54 (improvement) |

The machine-readable form of this summary is [latest-results.json](latest-results.json).
