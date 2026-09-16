# Inertia baseline vs final profile-product RORP

- Control: `a689ac7ec5fe5b708efe4ddff5388e72fc4ce06d`, the exact
  `ramez/cpln/inertia-baseline` revision, with no product-page feature flag.
- Experiment: `63cbd13da`, the final implementation revision, with
  `product_page_react_on_rails` enabled for the benchmark seller.
- Run ID: `2026-09-15T23:15:29.773Z`.
- Command: `shaka-perf compare --filter "Product Page - Profile layout"`.
- Samples: 18 control and 18 experiment measurements per case.

| Case         | Metric      | Control |  RORP | Change |
| ------------ | ----------- | ------: | ----: | -----: |
| Cold desktop | FCP         |  10.31s | 1.42s |   -77% |
|              | Speed Index |  10.43s | 2.65s |   -70% |
|              | LCP         |  10.40s | 2.11s |   -74% |
| Cold phone   | FCP         |  11.50s | 1.74s |   -67% |
|              | Speed Index |  11.60s | 4.15s |   -56% |
|              | LCP         |  11.55s | 2.51s |   -64% |
| Warm desktop | FCP         |   705ms | 336ms |   -53% |
|              | Speed Index |   791ms | 373ms |   -53% |
|              | LCP         |   791ms | 336ms |   -58% |
| Warm phone   | FCP         |   714ms | 334ms |   -53% |
|              | Speed Index |   815ms | 435ms |   -46% |
|              | LCP         |   809ms | 334ms |   -59% |

All listed changes are statistically significant. Warm transferred bytes fell
from 197KB to 37.1KB (-81%) and requests fell from 135 to 104 (-23%). Cold
transferred bytes were effectively flat (+1.3% to +1.5%) while requests fell
from 136 to 108 (-21%).

Desktop visual comparisons passed with 0 differing pixels for both cold and
warm landing scenarios. Phone visual regression is intentionally skipped by
the unchanged benchmark scenario. The self-contained report is `report.html`;
the adjacent per-case directories preserve the raw performance, visual, and
measurement JSON.
