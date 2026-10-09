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

## Run a fresh report

Open either saved report and click **Analyze** again. PageSpeed tests the URL displayed in the input field and produces a fresh report; it need not reproduce the saved score. Keep Mobile or Desktop consistent, test both variants several times, and record the report URLs and deployment revisions.

The saved mobile reports both show **92 SEO**. That category checks basic SEO practices, not actual search indexing or rankings. See the [SEO discussion in the companion](reference.md#server-rendering-and-seo).

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

## Later deployment inspection

A later inspection, on October 1 at approximately 22:00 HST, identified Inertia source revision `5df1b6827002108389e337bbe308896d49da30a1` and RSC source revision `a01f734c288f5b59c05f02b38f82f8bc6477ff36` in the live deployments. Their public [Inertia package manifest](https://github.com/shakacode/gumroad/blob/5df1b6827002108389e337bbe308896d49da30a1/package.json) and [RSC package manifest](https://github.com/shakacode/gumroad/blob/a01f734c288f5b59c05f02b38f82f8bc6477ff36/package.json) declare `react-on-rails-rsc` 19.3.0 and 19.3.0-rc.4, respectively.

Those immutable source files verify the package-version difference, not which versions were deployed during the earlier PageSpeed captures. The later inspection cannot establish parity at capture time.


## October 8 matched-source recapture

Both demo sites were rebuilt and deployed from [`5df1b6827002108389e337bbe308896d49da30a1`](https://github.com/shakacode/gumroad/commit/5df1b6827002108389e337bbe308896d49da30a1) on October 8, 2026 HST. This deployment-branch commit contains PR #103's complete application head, `e3258d2cfcc6022b31d6703bdb11a922932a8f44`, plus the Control Plane runtime configuration needed by the public demos. No changes were made to the upstream-facing PR.

### Deployments and live verification

Both deployments used the existing Control Plane Flow workflows on `ramez/cpln/cpflow`, with their guarded release phase. Times below are October 8 HST (UTC−10).

| Variant | Build started | Build completed | Deploy started | Deploy completed | Workflow |
| --- | --- | --- | --- | --- | --- |
| Inertia | 13:58:00 | 14:21:28 | 14:21:30 | 14:25:27 | [Successful run](https://github.com/shakacode/gumroad/actions/runs/37862289473) |
| RSC | 13:57:53 | 14:15:43 | 14:15:45 | 14:19:24 | [Successful attempt 2](https://github.com/shakacode/gumroad/actions/runs/36861319438/attempts/2) |

At approximately 14:26 HST, read-only commands inside each live Rails container verified:

- `GIT_COMMIT` was the full shared SHA above.
- Product `bgfjk` belonged to seller `luisfurushio`.
- `Feature.active?(:product_page_react_on_rails, product.user)` was `false` on Inertia and `true` on RSC. The release script sets the flag globally within each isolated demo app and checks its result for this seller; this is not an actor-only flag activation.
- Both deployed `package.json` files declared `react-on-rails-rsc` `19.3.0`.
- Both package manifests and lockfiles matched each other and the files at the source commit, using SHA-256:

| File | SHA-256, both deployments and source commit |
| --- | --- |
| `package.json` | `862b67c72d7710a11338214cd144f3b25bcfb47a7e5c296ad84c484de264d723` |
| `package-lock.json` | `2ca9052d7559dfa6c04502da4effa2c1d8cfcdbb3f3e68cf2917be08586b3a2b` |

Rails, Sidekiq, and renderer all referenced the same image within each app. Before measurement, all six workloads reported `ready: true` and `readyLatest: true`. The image digests differ because each build embeds its own hostname through `BENCHMARK_APP`; identical asset hashes are not expected.

| Variant | Image tag | Image SHA-256 digest |
| --- | --- | --- |
| Inertia | `gumroad-inertia:21_5df1b6827002108389e337bbe308896d49da30a1` | `2124b06dbd22f039b636077abe956b0091cd90a292eaac0a158df781341d8404` |
| RSC | `gumroad-rorp:33_5df1b6827002108389e337bbe308896d49da30a1` | `1686a9367dec1a79c2f19dd5f0b839bd42d8ae1c29ff4c9840e78a0ef509ae97` |

Both exact URLs returned HTTP 200 without redirecting. The Inertia HTML contained `id="app"` and no `product-rsc-root`; RSC contained `id="product-rsc-root"` and no Inertia root. Both browser pages displayed the product title, price, and purchase controls.

### Capture method

Each page was loaded three times in the browser after deployment, with the third paired warm-up completed at `2026-10-09T00:26:54.151Z` (October 8, 14:26:54 HST). Subsequent HTTP checks completed in approximately 0.7 seconds for Inertia and 1.0 seconds for RSC. Workload readiness was checked again before starting PageSpeed.

Six PageSpeed Insights Analyze submissions alternated Inertia and RSC in the same browser tab. Each submission produced a mobile and desktop Lighthouse report: three runs per variant and form factor, twelve captures total. All captures were retained. Their JSON `fetchTime` values span **294.566 seconds**, from `2026-10-09T00:27:36.782Z` to `2026-10-09T00:32:31.348Z` (October 8, approximately 14:27–14:32 HST).

The exact requested URLs, preserved in every report's JSON, were:

- [Inertia](https://luisfurushio.gumroad-inertia.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search)
- [RSC](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search)

Unlike the original October 1 reports, which requested only `?layout=profile`, these captures also include `recommended_by=search`. Both variants use the same query parameters.

### All twelve captures

Performance scores are the report's `categories.performance.score` multiplied by 100; FCP and LCP below are its exact displayed values, not independently rounded raw timings. Timestamps are copied from each report's embedded Lighthouse JSON.

| Variant | Form factor | Run | Performance | FCP displayed | LCP displayed | `fetchTime` (UTC) | Saved report |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| Inertia | Mobile | 1 | 55 | 7.1 s | 10.8 s | `2026-10-09T00:27:36.782Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/vlgb91j3om?form_factor=mobile) |
| Inertia | Mobile | 2 | 48 | 7.2 s | 11.0 s | `2026-10-09T00:29:17.773Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/qhqhjfiopt?form_factor=mobile) |
| Inertia | Mobile | 3 | 55 | 7.1 s | 10.9 s | `2026-10-09T00:31:35.940Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/d3c8fxobbt?form_factor=mobile) |
| RSC | Mobile | 1 | 73 | 2.3 s | 4.3 s | `2026-10-09T00:28:19.498Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/j8t9j1ft3l?form_factor=mobile) |
| RSC | Mobile | 2 | 67 | 2.9 s | 5.7 s | `2026-10-09T00:30:26.717Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/y1orp88s0w?form_factor=mobile) |
| RSC | Mobile | 3 | 62 | 2.9 s | 6.0 s | `2026-10-09T00:32:30.638Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/qoybdr7p1r?form_factor=mobile) |
| Inertia | Desktop | 1 | 53 | 1.4 s | 2.5 s | `2026-10-09T00:27:38.204Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/vlgb91j3om?form_factor=desktop) |
| Inertia | Desktop | 2 | 58 | 1.4 s | 2.4 s | `2026-10-09T00:29:17.958Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/qhqhjfiopt?form_factor=desktop) |
| Inertia | Desktop | 3 | 41 | 1.4 s | 2.8 s | `2026-10-09T00:31:58.878Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/d3c8fxobbt?form_factor=desktop) |
| RSC | Desktop | 1 | 97 | 0.6 s | 1.0 s | `2026-10-09T00:28:19.159Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/j8t9j1ft3l?form_factor=desktop) |
| RSC | Desktop | 2 | 98 | 0.6 s | 1.0 s | `2026-10-09T00:30:26.702Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/y1orp88s0w?form_factor=desktop) |
| RSC | Desktop | 3 | 67 | 0.6 s | 1.1 s | `2026-10-09T00:32:31.348Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/qoybdr7p1r?form_factor=desktop) |

### Settings and outcome

All twelve captures used Lighthouse **13.5.0**, `throttlingMethod: "simulate"`, and `disableStorageReset: true`. The complete `configSettings` objects matched across all six captures within each form factor. Throttling values matched the October 1 saved settings table above: mobile 150 ms RTT, 1,638.4 Kbps throughput, and 1.2× CPU slowdown; desktop 40 ms RTT, 10,240 Kbps throughput, and 1× CPU slowdown. The UI reported HeadlessChromium 153.0.8010.36. These remain lab results, not field-user measurements.

| Form factor | Inertia median performance | RSC median performance | RSC minus Inertia |
| --- | ---: | ---: | ---: |
| Mobile | 55 | 67 | 12 |
| Desktop | 53 | 97 | 44 |

The matched-source mobile result moved materially from the earlier individual 53/80 captures: the median gap is below 15 points and the RSC median is below 70. The website articles were therefore left unchanged. No additional runs were selected to improve these medians.

This recapture verifies source parity for the new measurements and resolves the live deployment mismatch. It does not establish parity during the October 1 captures or isolate source versions as the cause of the changed scores. The historical evidence and caveat above remain applicable to those older captures.
