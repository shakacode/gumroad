# Final commit with seller flag off vs on

- Control and experiment source: `63cbd13da`.
- Control: `product_page_react_on_rails` disabled for the benchmark seller,
  exercising the existing Inertia page.
- Experiment: the same feature enabled for that seller, exercising RORP.
- Run ID: `2026-09-15T23:43:31.377Z`.
- Command: `shaka-perf compare --filter "Product Page - Profile layout"`.
- Samples: 18 control and 18 experiment measurements per case.

| Case         | Metric      | Flag off | Flag on | Change |
| ------------ | ----------- | -------: | ------: | -----: |
| Cold desktop | FCP         |   14.73s |   3.49s |   -67% |
|              | Speed Index |   14.81s |   3.99s |   -62% |
|              | LCP         |   14.79s |   3.49s |   -66% |
| Cold phone   | FCP         |   14.43s |   2.13s |   -67% |
|              | Speed Index |   14.53s |   4.79s |   -55% |
|              | LCP         |   14.48s |   2.56s |   -65% |
| Warm desktop | FCP         |    704ms |   335ms |   -51% |
|              | Speed Index |    793ms |   374ms |   -52% |
|              | LCP         |    793ms |   335ms |   -57% |
| Warm phone   | FCP         |    701ms |   338ms |   -53% |
|              | Speed Index |    800ms |   435ms |   -46% |
|              | LCP         |    796ms |   338ms |   -59% |

All listed changes are statistically significant. Warm transferred bytes fell
from 197KB to 37.1KB (-81%) and requests fell from 135 to 104 (-23%). Cold
transferred bytes were nearly flat (+0.7% to +1.3%) while requests fell from
136 to 108 (-21%).

Desktop visual comparisons passed with 0 differing pixels for both cold and
warm landing scenarios. Phone visual regression is intentionally skipped by
the unchanged benchmark scenario. The self-contained report is `report.html`;
the adjacent per-case directories preserve the raw performance, visual,
measurement, and assembled report JSON.
