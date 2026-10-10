# October 1 PageSpeed evidence

**Current status:** the latest captured comparison is the [October 9 HST cart-count deployment](#cart-count-deployment-october-9-2026-hst), with mobile medians 53/86 and desktop medians 72/99 from one three-run batch per variant and device. Article publication is separate from this capture record. Earlier sections record their status at the time; their stop decisions and caveats remain part of the history.

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

| Variant | Build started | Build completed | Deploy started | Deploy completed | Workflow                                                                                         |
| ------- | ------------- | --------------- | -------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| Inertia | 13:58:00      | 14:21:28        | 14:21:30       | 14:25:27         | [Successful run](https://github.com/shakacode/gumroad/actions/runs/37862289473)                  |
| RSC     | 13:57:53      | 14:15:43        | 14:15:45       | 14:19:24         | [Successful attempt 2](https://github.com/shakacode/gumroad/actions/runs/36861319438/attempts/2) |

The RSC run reuses the original immutable source revision. Its first attempt, on October 1, failed during image publication with a registry authorization error; only the successful October 8 attempt is used here.

At approximately 14:26 HST, read-only commands inside each live Rails container verified:

- `GIT_COMMIT` was the full shared SHA above.
- Product `bgfjk` belonged to seller `luisfurushio`.
- `Feature.active?(:product_page_react_on_rails, product.user)` was `false` on Inertia and `true` on RSC. The release script sets the flag globally within each isolated demo app and checks its result for this seller; this is not an actor-only flag activation.
- Both deployed `package.json` files declared `react-on-rails-rsc` `19.3.0`.
- Both package manifests and lockfiles matched each other and the files at the source commit, using SHA-256:

| File                | SHA-256, both deployments and source commit                        |
| ------------------- | ------------------------------------------------------------------ |
| `package.json`      | `862b67c72d7710a11338214cd144f3b25bcfb47a7e5c296ad84c484de264d723` |
| `package-lock.json` | `2ca9052d7559dfa6c04502da4effa2c1d8cfcdbb3f3e68cf2917be08586b3a2b` |

Rails, Sidekiq, and renderer all referenced the same image within each app. Before measurement, all six workloads reported `ready: true` and `readyLatest: true`. These are separate builds with different image digests. Each build embeds its own hostname through `BENCHMARK_APP`, so matching source and lockfiles does not imply identical artifacts or asset hashes.

| Variant | Image tag                                                     | Image SHA-256 digest                                               |
| ------- | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| Inertia | `gumroad-inertia:21_5df1b6827002108389e337bbe308896d49da30a1` | `2124b06dbd22f039b636077abe956b0091cd90a292eaac0a158df781341d8404` |
| RSC     | `gumroad-rorp:33_5df1b6827002108389e337bbe308896d49da30a1`    | `1686a9367dec1a79c2f19dd5f0b839bd42d8ae1c29ff4c9840e78a0ef509ae97` |

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

| Variant | Form factor | Run | Performance | FCP displayed | LCP displayed | `fetchTime` (UTC)          | Saved report                                                                                                                            |
| ------- | ----------- | --: | ----------: | ------------: | ------------: | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Inertia | Mobile      |   1 |          55 |         7.1 s |        10.8 s | `2026-10-09T00:27:36.782Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/vlgb91j3om?form_factor=mobile)  |
| Inertia | Mobile      |   2 |          48 |         7.2 s |        11.0 s | `2026-10-09T00:29:17.773Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/qhqhjfiopt?form_factor=mobile)  |
| Inertia | Mobile      |   3 |          55 |         7.1 s |        10.9 s | `2026-10-09T00:31:35.940Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/d3c8fxobbt?form_factor=mobile)  |
| RSC     | Mobile      |   1 |          73 |         2.3 s |         4.3 s | `2026-10-09T00:28:19.498Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/j8t9j1ft3l?form_factor=mobile)     |
| RSC     | Mobile      |   2 |          67 |         2.9 s |         5.7 s | `2026-10-09T00:30:26.717Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/y1orp88s0w?form_factor=mobile)     |
| RSC     | Mobile      |   3 |          62 |         2.9 s |         6.0 s | `2026-10-09T00:32:30.638Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/qoybdr7p1r?form_factor=mobile)     |
| Inertia | Desktop     |   1 |          53 |         1.4 s |         2.5 s | `2026-10-09T00:27:38.204Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/vlgb91j3om?form_factor=desktop) |
| Inertia | Desktop     |   2 |          58 |         1.4 s |         2.4 s | `2026-10-09T00:29:17.958Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/qhqhjfiopt?form_factor=desktop) |
| Inertia | Desktop     |   3 |          41 |         1.4 s |         2.8 s | `2026-10-09T00:31:58.878Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/d3c8fxobbt?form_factor=desktop) |
| RSC     | Desktop     |   1 |          97 |         0.6 s |         1.0 s | `2026-10-09T00:28:19.159Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/j8t9j1ft3l?form_factor=desktop)    |
| RSC     | Desktop     |   2 |          98 |         0.6 s |         1.0 s | `2026-10-09T00:30:26.702Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/y1orp88s0w?form_factor=desktop)    |
| RSC     | Desktop     |   3 |          67 |         0.6 s |         1.1 s | `2026-10-09T00:32:31.348Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/qoybdr7p1r?form_factor=desktop)    |

### Settings and outcome

All twelve captures used Lighthouse **13.5.0**, `throttlingMethod: "simulate"`, and `disableStorageReset: true`. The complete `configSettings` objects matched across all six captures within each form factor. Throttling values matched the October 1 saved settings table above: mobile 150 ms RTT, 1,638.4 Kbps throughput, and 1.2× CPU slowdown; desktop 40 ms RTT, 10,240 Kbps throughput, and 1× CPU slowdown. The UI reported HeadlessChromium 153.0.8010.36. These remain lab results, not field-user measurements.

| Form factor | Inertia median performance | RSC median performance | RSC minus Inertia |
| ----------- | -------------------------: | ---------------------: | ----------------: |
| Mobile      |                         55 |                     67 |                12 |
| Desktop     |                         53 |                     97 |                44 |

The recapture had a pre-agreed publication rule: leave the articles unchanged and report the evidence if the median mobile gap fell below 15 points or the RSC median fell below 70. Both conditions occurred (55/67, a 12-point gap), so the website articles were left unchanged pending editorial reassessment. No additional runs were selected to improve these medians.

Each median covers only three lab captures. Desktop scores varied from 41 to 58 for Inertia and 67 to 98 for RSC; all those results remain in the table.

This recapture verifies source parity for the new measurements and resolves the live deployment mismatch. It does not establish parity during the October 1 captures or isolate source versions as the cause of the changed scores. The capture date and added `recommended_by=search` query parameter also differ from the original runs. The historical reconstruction below addresses source parity for those older captures separately.

## Historical source verification for the October 1 reports

A subsequent reconstruction of the deployment history establishes that the original October 1 captures used builds from the same application commit, [`624ee397bc0fceabb129c0765221af06278a2377`](https://github.com/shakacode/gumroad/commit/624ee397bc0fceabb129c0765221af06278a2377). The different revisions found in the later October 1 inspection were deployed after those reports ran.

### Deployment history

Both September 28 deployment workflows built commit `624ee397bc0fceabb129c0765221af06278a2377`:

| Variant | Public deployment run                                                                    | Rails image update (UTC)   | Image digest                                                              |
| ------- | ---------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| Inertia | [September 28 deployment](https://github.com/shakacode/gumroad/actions/runs/36421897716) | `2026-09-28T13:02:12.011Z` | `sha256:fcca4708a519fc335c0c7f52647a3ff561ee79c5df12df16baae92891dff54c0` |
| RSC     | [September 28 deployment](https://github.com/shakacode/gumroad/actions/runs/36421897718) | `2026-09-28T12:57:08.461Z` | `sha256:579304fb4fff6fd79df1c4cd6f2e54e0db249225e32d503c39de16b7361fa073` |

The image-update timestamps above come from Control Plane audit records retained locally by the investigator, not published in this PR, and corroborate the public workflow logs. Public workflow links alone do not expose the intervening audit history. Consecutive audit versions show that the next Rails image changes occurred on October 1 at `12:37:10.594Z` for Inertia and `12:38:11.385Z` for RSC, both to `a01f734c288f5b59c05f02b38f82f8bc6477ff36`. Inertia subsequently changed to `5df1b6827002108389e337bbe308896d49da30a1` at `13:03:29.141Z`. All three changes occurred after the original reports' `10:50` and `10:52` UTC captures.

The renderer audit records independently show the September 28 source revision remained configured through the captures. Its first subsequent image changes occurred on October 1 at `12:34:11.858Z` for Inertia and `12:35:13.114Z` for RSC.

The [package manifest at the September 28 commit](https://github.com/shakacode/gumroad/blob/624ee397bc0fceabb129c0765221af06278a2377/package.json) specifies `react-on-rails-rsc` **19.3.0-rc.4**, `react-on-rails`, `react-on-rails-pro`, and `react-on-rails-pro-node-renderer` **17.1.0-rc.5**, and React **19.2.8**. Both builds therefore used the same source manifest. The two builds have different image digests; matching source does not mean byte-identical images or identical runtime configuration.

### Corroboration from the saved reports

The original mobile reports' network-request records contain Vite script filenames that match their respective September 28 build logs: **117 of 117 unique Inertia Vite script URLs** and **10 of 10 unique RSC Vite script URLs**. In particular:

| Variant | Original mobile report                                                                                                                           | Captured Vite entrypoints also present in the September 28 build log |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Inertia | [October 1 report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/pktr6lcl65?form_factor=mobile) | `base.ts-DUbPH_da.js`, `inertia.js-Dep6yyfG.js`                      |
| RSC     | [October 1 report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/737osqp6n5?form_factor=mobile)    | `base.ts-Cb01j-r4.js`, `inertia.js-D9IEFUnU.js`                      |

This filename match is consistent with the historical builds. Content-hashed filenames can persist across builds, so the match alone does not establish the source revision; the consecutive deployment audit sequence supplies that attribution. The build logs abbreviate the RSC bundle listing, so the Vite comparison is not a claim that every RSC bundle filename was independently matched.

### What this resolves

The later inspection alone could not establish source parity at capture time. The historical deployment records now establish source parity for the October 1 reports, with the captured filenames providing a consistency check. Their recorded **53 → 80 mobile** and **66 → 98 desktop** scores remain individual captures, not repeated-run medians or proof that source parity controls every runtime difference.

This historical verification does not supersede the new comparison or its publication stop conditions described above.

## Same-host historical-image experiment, October 8 evening

To investigate the lower scores, the RSC host was measured with the current image, temporarily switched to its preserved September 28 image, and restored to the current image. Every report in this experiment requests the original `?layout=profile` URL, without `recommended_by=search`. Inertia was not changed. This is diagnostic evidence, separate from the twelve matched-source comparison captures above.

The historical image was `gumroad-rorp:31_624ee397bc0fceabb129c0765221af06278a2377` with digest `sha256:579304fb4fff6fd79df1c4cd6f2e54e0db249225e32d503c39de16b7361fa073`. The restored image was `gumroad-rorp:33_5df1b6827002108389e337bbe308896d49da30a1` with digest `sha256:1686a9367dec1a79c2f19dd5f0b839bd42d8ae1c29ff4c9840e78a0ef509ae97`. Only image references on Rails, renderer, and Sidekiq were changed; no release hooks, migrations, fixture seeding, or flag changes were run.

The historical image converged and its runtime SHA and seller flag were verified at `2026-10-09T04:43:58.450975Z`; three successful warm requests finished at `04:44:11.800Z`. Restoration converged and the current SHA and flag were verified at `2026-10-09T04:49:25.610396Z`; three successful warm requests finished at approximately `04:49:40Z`. These times are October 8 evening HST. All three workloads were ready on the intended image before measurements. Hashes of their specifications excluding image references remained unchanged.

### Reports and duplicate detection

The current-before mobile sample includes a diagnostic capture of the same explicit-profile URL at 18:29 HST (the first row below) and two fresh captures at 18:39 and 18:41. One additional submission produced a new report URL but reused the previous mobile `fetchTime` and identical mobile report. It is retained below, explicitly marked, and excluded from mobile medians; its desktop capture is distinct. Each of the three historical and three restored mobile captures has a unique `fetchTime`.

| Phase                            | Form factor | Performance | FCP displayed | LCP displayed | `fetchTime` (UTC)          | Report                                                                                                                               |
| -------------------------------- | ----------- | ----------: | ------------: | ------------: | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Current before                   | Mobile      |          70 |         2.3 s |         5.6 s | `2026-10-09T04:29:08.599Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/0lcfw65osm?form_factor=mobile)  |
| Current before                   | Desktop     |          98 |         0.6 s |         1.0 s | `2026-10-09T04:29:08.923Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/0lcfw65osm?form_factor=desktop) |
| Current before                   | Mobile      |          63 |         2.9 s |         7.6 s | `2026-10-09T04:39:32.503Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/7f17x9pem2?form_factor=mobile)  |
| Current before                   | Desktop     |          96 |         0.5 s |         0.8 s | `2026-10-09T04:39:32.751Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/7f17x9pem2?form_factor=desktop) |
| Current before, duplicate mobile | Mobile      |          63 |         2.9 s |         7.6 s | `2026-10-09T04:39:32.503Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/n7g3u5wrmn?form_factor=mobile)  |
| Current before                   | Desktop     |          91 |         0.7 s |         1.3 s | `2026-10-09T04:40:07.998Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/n7g3u5wrmn?form_factor=desktop) |
| Current before                   | Mobile      |          57 |         2.9 s |         5.7 s | `2026-10-09T04:41:16.439Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/npovj5le0d?form_factor=mobile)  |
| Current before                   | Desktop     |          97 |         0.6 s |         1.2 s | `2026-10-09T04:41:16.064Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/npovj5le0d?form_factor=desktop) |
| Historical                       | Mobile      |          66 |         2.4 s |         6.8 s | `2026-10-09T04:44:26.795Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/syfhmujqna?form_factor=mobile)  |
| Historical                       | Desktop     |          97 |         0.7 s |         1.0 s | `2026-10-09T04:44:26.811Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/syfhmujqna?form_factor=desktop) |
| Historical                       | Mobile      |          70 |         2.3 s |         4.5 s | `2026-10-09T04:45:40.461Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/5jddo7lqlz?form_factor=mobile)  |
| Historical                       | Desktop     |          98 |         0.6 s |         1.1 s | `2026-10-09T04:45:39.964Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/5jddo7lqlz?form_factor=desktop) |
| Historical                       | Mobile      |          68 |         2.9 s |         4.6 s | `2026-10-09T04:46:57.063Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/au8r78jf13?form_factor=mobile)  |
| Historical                       | Desktop     |          95 |         0.7 s |         1.1 s | `2026-10-09T04:46:56.664Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/au8r78jf13?form_factor=desktop) |
| Current restored                 | Mobile      |          66 |         2.9 s |         6.4 s | `2026-10-09T04:50:06.908Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/04hvhkgk74?form_factor=mobile)  |
| Current restored                 | Desktop     |          64 |         0.6 s |         0.9 s | `2026-10-09T04:50:09.605Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/04hvhkgk74?form_factor=desktop) |
| Current restored                 | Mobile      |          76 |         1.8 s |         3.5 s | `2026-10-09T04:51:11.973Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/aldkqcgk0z?form_factor=mobile)  |
| Current restored                 | Desktop     |          97 |         0.7 s |         1.2 s | `2026-10-09T04:51:11.691Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/aldkqcgk0z?form_factor=desktop) |
| Current restored                 | Mobile      |          71 |         2.4 s |         6.5 s | `2026-10-09T04:52:19.666Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/xf0puv9uk5?form_factor=mobile)  |
| Current restored                 | Desktop     |          98 |         0.7 s |         1.1 s | `2026-10-09T04:52:20.068Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/xf0puv9uk5?form_factor=desktop) |

All reports used Lighthouse 13.5.0, HeadlessChromium 153.0.8010.36 and the same complete `configSettings` as the original October 1 report within each form factor. Google runner benchmark indices varied; matching settings does not imply identical runner hardware or network conditions.

| Phase            | Independent mobile scores | Median |
| ---------------- | ------------------------- | -----: |
| Current before   | 70, 63, 57                |     63 |
| Historical image | 66, 70, 68                |     68 |
| Current restored | 66, 76, 71                |     71 |

The verdict for an image-induced regression is **ambiguous**. The pre-rollback phase had a different Rails CPU reservation (0.4 core versus 1 core), so its median is not directly comparable. The historical and restored phases both had 1-core reservations; their medians were 68 and 71, with overlapping ranges and only three samples each. Restoring the original artifact did not reproduce 80 in these runs. This does not invalidate earlier measurements or prove the absence of every regression.

### Runtime and interpretation limits

Control Plane's adaptive allocation changed despite identical workload specifications: Rails had a 0.4-core reservation before the experiment, then a 1-core reservation after each fresh rollout. The renderer reservation remained 0.5 core. Available CPU measurements were low, with no container restarts or reschedules, but these averages do not exclude transient contention; memory and CPU-throttling measurements were unavailable. Thus this is a same-host image experiment, not a claim that every runtime resource was held constant. The historical and restored phases both began with a 1-core Rails reservation. Reservations during the earlier twelve-capture comparison were not recorded.

The slow results involve more than one timing pattern. In the earlier RSC capture with score 73, the unchanged render-blocking stylesheet finished at about 2.965 seconds and first paint followed at 3.135 seconds in the observed, unthrottled timings, after the cover image had downloaded. In other runs CSS completed early but painting was delayed. Conversely, the restored current-image report scoring 71 observed LCP at **454 ms** while estimating throttled LCP at **6,452 ms**; its score uses the simulated timing, not that observed paint. The restored report scoring 76 estimated LCP at **3.5 s**, close to the original **3.6 s**. These differences require examining network and execution dependencies rather than treating the score change as a direct measure of server rendering speed.

Local comparisons of the published packages found no executable changes in React on Rails, Pro, or Node renderer from 17.1.0-rc.5 to 17.1.0, or in RSC from 19.3.0-rc.4 to 19.3.0. The [current manifest](https://github.com/shakacode/gumroad/blob/5df1b6827002108389e337bbe308896d49da30a1/package.json) records the final versions. Package comparison output is retained locally and is not attached to this evidence-only PR. The historical-to-current source includes real `io-event` and `protocol-http2` dependency changes and routing changes for URLs without an explicit layout. The measured explicit-profile path is unchanged. The image experiment has not established those dependency changes as a cause.

The matched-source image was restored before further diagnostic work. These follow-up results do not replace the original twelve captures.

### Local raw-trace follow-up

Five additional local Lighthouse 13.5.0 runs against the restored current image retained raw traces and DevTools network logs locally with the investigator; these diagnostic files are not attached to this PR. They used the saved mobile throttling and viewport settings, a fresh headless browser per run, and only the performance category. These ran on macOS with Chrome 156, not Google's Chrome 153/Linux runners, so their scores are not substitutes for PageSpeed reports.

| Local run | Performance | Observed LCP (ms) | Simulated LCP (ms) |
| --------- | ----------: | ----------------: | -----------------: |
| 1         |          74 |              2027 |               3949 |
| 2         |          76 |              1191 |               3789 |
| 3         |          75 |              1229 |               3934 |
| 4         |          75 |              1250 |               3934 |
| 5         |          74 |              1596 |               3944 |

All five traces show HTML parsing pausing before visible server-rendered content at an inline initialization script following the stylesheet. Parsing resumes 2–3 ms after that stylesheet finishes. No hidden Suspense reveal gate or main-thread task longer than 50 ms was found in those traces. Two requests for the RSC chunk `6142.830d6adf.js` complete after first paint in these local captures, so they are not required to reveal the product.

This confirms a stylesheet/parser dependency but does not reproduce every slow Google capture, including cases where CSS and the cover image finish early yet painting is delayed. Lighthouse's [Lantern model](https://github.com/GoogleChrome/lighthouse/blob/main/docs/lantern.md) estimates throttled performance from a dependency graph; simulated and observed times must remain separate. The exact dependency responsible for each divergent Google estimate has not been established from the saved reports, which do not contain the raw Google traces.

No application performance fix was deployed during this investigation. The evidence resolves the original source-parity question and narrows the performance problem, but does not establish a source regression or fully explain the historical-to-current score shift.

## Fresh paired deployments with fixed resources, October 8 evening

Both demos were freshly rebuilt and deployed from `5df1b6827002108389e337bbe308896d49da30a1`. The [Inertia workflow](https://github.com/shakacode/gumroad/actions/runs/37892405121) completed at `2026-10-09T06:39:23Z`; the [RSC workflow](https://github.com/shakacode/gumroad/actions/runs/37892408227) completed at `2026-10-09T06:40:28Z` (October 8, 20:39 and 20:40 HST).

The new application images are:

- Inertia: `gumroad-inertia:22_5df1b6827002108389e337bbe308896d49da30a1`, digest `sha256:b65cd28900526ce1c8e08127faa5bd79849a8bb771d361c3654d064cc55de39a`.
- RSC: `gumroad-rorp:34_5df1b6827002108389e337bbe308896d49da30a1`, digest `sha256:a2c203dad1bec8fa204fb6babf6d1409b3324065939a1bc9ab9ba66031d358c9`.

Rails, renderer, and Sidekiq use their app's corresponding image. Runtime checks at approximately `06:45:50Z` confirmed the full SHA, matching package and lockfile checksums, RSC package 19.3.0, seller `luisfurushio`, and product `bgfjk`. All seller feature states matched except `product_page_react_on_rails`: false on Inertia, true on RSC.

CapacityAI was disabled on both apps' Rails and Sidekiq workloads after deployment; the four updates were accepted between `06:42:06Z` and `06:42:27Z`, before browser warming. No further configuration mutations occurred during warming or capture. These fixed settings remain in place. Effective allocations and current deployment CPU reservation metrics were checked: Rails has 1 CPU / 2 GiB; Sidekiq and renderer each have 0.5 CPU / 1 GiB, with one ready replica. Renderer and data-service allocation was already fixed. Allocation snapshot collection began at `06:47:34.305333Z`; verification completed at approximately `06:48:35Z`, during the first report pair. Retained 15-second reservation and restart samples establish that all six application replicas existed before the resource updates, retained their identities through `06:50Z`, and had zero restarts and constant target CPU reservations throughout warming and the first captures. The CapacityAI updates did not replace replicas. All eight workload pairs were healthy with matching resource settings. This removes the earlier adaptive-allocation confound; it does not guarantee identical physical host contention or Google runner conditions.

The two builds use identical Node and Ruby base-image digests and logged dependency versions. Their host-specific asset URLs and image digests differ: generated route helpers and RSC asset paths embed the appropriate hostname. Runtime hostnames, isolated service/storage addresses, and credentials also differ by app. Compiled-asset comparison also identified minifier identifier choices and two trailing spaces in generated diagnostic strings; it found no different executable application behavior. This is not a formal equivalence proof or a claim of byte-identical images.

Read-only checks found matching normalized product descriptions, seller public fields, catalog data, fixture files, and media identities. All 34 checked media responses returned HTTP 200, and corresponding bytes matched exactly. Both rendered pages contained the expected cover and description-image URLs. Browser warming loaded each exact requested URL three times, completing at `06:46:35.216Z`.

### Twelve fresh reports

All submissions used the same PageSpeed browser tab and the exact `?layout=profile&recommended_by=search` URLs. Hosts alternated, with both mobile and desktop reports retained per submission. Every JSON `fetchTime` is distinct. Lighthouse 13.5.0, HeadlessChromium 153.0.8010.36, and the complete `configSettings` match the original reports within each form factor. The twelve timestamps span **267.608 seconds**. Scores and displayed FCP/LCP below are copied from the saved JSON.

| Variant / run | Form factor | Performance | FCP | LCP | `fetchTime` (UTC) | Report |
| --- | --- | ---: | ---: | ---: | --- | --- |
| inertia-1 | mobile | 55 | 7.1 s | 10.9 s | `2026-10-09T06:47:55.895Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/wtmmrq1jjc?form_factor=mobile) |
| inertia-1 | desktop | 71 | 1.4 s | 2.3 s | `2026-10-09T06:47:56.351Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/wtmmrq1jjc?form_factor=desktop) |
| rorp-1 | mobile | 65 | 2.6 s | 6.5 s | `2026-10-09T06:48:42.432Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/iij4pwjlai?form_factor=mobile) |
| rorp-1 | desktop | 97 | 0.6 s | 1.1 s | `2026-10-09T06:48:42.410Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/iij4pwjlai?form_factor=desktop) |
| inertia-2 | mobile | 52 | 7.1 s | 10.8 s | `2026-10-09T06:49:47.087Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/ub8j7jgl8m?form_factor=mobile) |
| inertia-2 | desktop | 75 | 1.4 s | 2.2 s | `2026-10-09T06:49:46.323Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/ub8j7jgl8m?form_factor=desktop) |
| rorp-2 | mobile | 75 | 2.3 s | 4.7 s | `2026-10-09T06:50:41.203Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/pokpn0o3zd?form_factor=mobile) |
| rorp-2 | desktop | 97 | 0.7 s | 1.1 s | `2026-10-09T06:50:41.164Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/pokpn0o3zd?form_factor=desktop) |
| inertia-3 | mobile | 56 | 7.1 s | 10.9 s | `2026-10-09T06:51:29.973Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/l2yofygx58?form_factor=mobile) |
| inertia-3 | desktop | 75 | 1.4 s | 2.3 s | `2026-10-09T06:51:30.020Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/l2yofygx58?form_factor=desktop) |
| rorp-3 | mobile | 70 | 2.7 s | 5.1 s | `2026-10-09T06:52:23.503Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/n8t47qotak?form_factor=mobile) |
| rorp-3 | desktop | 98 | 0.7 s | 1.0 s | `2026-10-09T06:52:23.432Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/n8t47qotak?form_factor=desktop) |

Mobile medians are **55 for Inertia and 70 for RSC**, a **15-point gap**. Desktop medians are **75 and 97**. Inertia mobile scores were 55, 52, 56; RSC mobile scores were 65, 75, 70. The original request set an article-update gate of approximately 53 ± 5 for Inertia and 80 ± 5 for RSC, with a similar mobile gap. It separately specified a hard stop below a 15-point gap or below 70 RSC mobile. This fresh result is exactly at those hard-stop boundaries, so neither strict inequality is triggered, but RSC 70 is outside the original update range of approximately 75–85. The articles therefore remain unchanged under the original update gate. This result does not establish an application-code regression or show that adaptive allocation caused the earlier score shift.

Raw report JSON, deployment/configuration snapshots, and parity-check output are retained locally by the investigator; public reports and workflow runs are linked above. No application performance fix was included in these deployments.

### What the fresh reports narrow down

The fresh RSC HTML responses finished in 342–380 ms. Its three observed first-paint times were 3,561, 1,518, and 1,480 ms; simulated LCP was 6,452, 4,727, and 5,113 ms. These are separate measurements: displayed LCP and the score use the simulated values.

In run 1, the render-blocking stylesheet finished at approximately 2,173 ms, contributing to a slow start. In runs 2 and 3, CSS finished at approximately 464 and 424 ms and the cover image at 498 and 450 ms, yet visible product painting waited until around 1.5 seconds. Filmstrip frames before that paint remain blank; the earlier `observedFirstVisualChange` is not evidence that the product was already visible. One of those runs finished downloading its fonts after the product painted, while the other finished fonts before painting, so font completion alone does not explain both delays.

The source, fixture, and fixed-resource checks eliminate those mismatches from this fresh comparison. They do not identify the cause of the remaining browser paint delay or the full historical-to-current simulated-LCP difference. No causal application regression or performance fix is claimed.

### Controlled rendering and simulation diagnostics

Further local experiments pinned Chrome to Google's exact `153.0.8010.36` version. A replay reused 90 separately fetched first-party response fixtures, scheduling each whole response at the corresponding first request's completion time in fresh RSC mobile run 3. Uncaptured requests were blocked. The same fixtures and schedule were used for both rendering configurations on Linux ARM; Google's reports used Linux x86_64.

The baseline configuration had GPU compositing and rasterization disabled, with Skia backend `None`. The other configuration enabled the GPU path with `--enable-gpu --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --enable-gpu-rasterization`, producing Skia backend `GaneshGL`. Both reported a SwiftShader GL device, so the device string alone does not distinguish the configurations. This experiment changes the group of rendering flags, not one independently isolated flag.

| Capture method                       | Baseline FCP, three runs (ms) | Forced GPU-path FCP, three runs (ms) |
| ------------------------------------ | ----------------------------- | ------------------------------------ |
| Custom browser trace                 | 476, 484, 476                 | 888, 1088, 940                       |
| Lighthouse 13.5.0 navigation capture | 476, 480, 476                 | 992, 1056, 1080                      |

These are the browser's `first-contentful-paint` PerformanceEntry values, not simulated Lighthouse values or new Google PageSpeed reports. In the Lighthouse captures, the baseline median was 476 ms and the forced GPU-path median was 1056 ms, a 580 ms difference. The forced GPU-path runs completed CSS at approximately 430, 439, and 432 ms and DOMContentLoaded at 448, 468, and 463 ms. The hero bounds matched Google's report: left 17, top 237, width 378, height approximately 290 CSS pixels. Lighthouse instrumentation alone did not reproduce Google's longer blank interval in the baseline configuration.

The custom forced-GPU traces show final GPU buffer-swap spans lasting approximately 278, 476, and 251 ms, ending immediately before frame presentation. Image decoding remained approximately 5 ms. This establishes a local rendering-configuration effect; it does not establish Google's rendering configuration or prove the cause of its 1480 ms first paint. The replay does not reproduce original response streaming, third-party behavior, hardware, or all Google runner conditions. Its fulfilled bodies were uncompressed, inflating recorded transfer sizes, so its simulated scores must not be compared with PageSpeed scores. The fixture bodies and raw traces are retained locally and are not attached to this repository.

Separate offline Lantern experiments reproduced all five earlier local Lighthouse LCP baselines exactly. Changing only the hero request's priority from Low to High increased simulated LCP by approximately 150–300 ms, insufficient to explain the entire Google discrepancy. The maximum-ending modeled request in those baselines was a Medium-priority description image below the fold, rather than the actual hero LCP element. Holding each raw trace and network graph fixed while changing the model's observed-LCP selection cutoff to 2500 ms increased simulated LCP by approximately 2–2.7 seconds as additional dependencies entered the calculation. This is a model-sensitivity experiment, not a measurement of a slower page or proof of the cause of any particular Google result.

These experiments demonstrate two mechanisms that can affect the measurements without an application-code change: delayed frame presentation and sensitivity of simulated LCP to the selected dependency graph. Their contribution to the specific Google reports remains unconfirmed without the corresponding raw traces and runner configuration. The historical-image rollback did not establish that the older application performed better, no application performance fix has been deployed, and the article-update gate remains unmet.

### Direct paint/presentation measurements inside Google PageSpeed

A temporary diagnostic proxy fetched the current RSC product HTML and inserted a nonce-compatible `PerformanceObserver`. After FCP, the observer copied the browser's `PerformancePaintTiming.paintTime`, `presentationTime`, and their difference into named User Timing measures. These values are preserved in the saved Google report JSON under `audits.user-timings.details.items`, with the prefix `sc-diag:fcp`. The probe sent no telemetry requests. It did not modify either comparison deployment.

Three sequential submissions used the same PageSpeed browser tab and distinct diagnostic URL tokens. Both form factors were saved. These are additional diagnostic reports, not replacements for the twelve direct-host captures.

| Run / form factor | `paintTime` (ms) | `presentationTime` (ms) | Presentation gap (ms) | `fetchTime` (UTC)          | Report                                                                                                                               |
| ----------------- | ---------------: | ----------------------: | --------------------: | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1 / mobile        |            528.4 |                     564 |                  35.6 | `2026-10-09T09:08:40.676Z` | [Report](https://pagespeed.web.dev/analysis/https-probe-fvnnfys4m4sdp-h8v5zjx3pd7h2-cpln-app-l-bgfjk/ehmz9eyh4a?form_factor=mobile)  |
| 1 / desktop       |          719.399 |                     812 |                92.601 | `2026-10-09T09:08:39.237Z` | [Report](https://pagespeed.web.dev/analysis/https-probe-fvnnfys4m4sdp-h8v5zjx3pd7h2-cpln-app-l-bgfjk/ehmz9eyh4a?form_factor=desktop) |
| 2 / mobile        |            498.5 |                    1480 |                 981.5 | `2026-10-09T09:09:25.397Z` | [Report](https://pagespeed.web.dev/analysis/https-probe-fvnnfys4m4sdp-h8v5zjx3pd7h2-cpln-app-l-bgfjk/ziyk51jrii?form_factor=mobile)  |
| 2 / desktop       |            500.1 |                     568 |                  67.9 | `2026-10-09T09:09:25.572Z` | [Report](https://pagespeed.web.dev/analysis/https-probe-fvnnfys4m4sdp-h8v5zjx3pd7h2-cpln-app-l-bgfjk/ziyk51jrii?form_factor=desktop) |
| 3 / mobile        |            908.2 |                     952 |                  43.8 | `2026-10-09T09:10:03.540Z` | [Report](https://pagespeed.web.dev/analysis/https-probe-fvnnfys4m4sdp-h8v5zjx3pd7h2-cpln-app-l-bgfjk/8bauc9fz0e?form_factor=mobile)  |
| 3 / desktop       |              467 |                     504 |                    37 | `2026-10-09T09:10:03.784Z` | [Report](https://pagespeed.web.dev/analysis/https-probe-fvnnfys4m4sdp-h8v5zjx3pd7h2-cpln-app-l-bgfjk/8bauc9fz0e?form_factor=desktop) |

Mobile run 2 directly records a **981.5 ms interval between paint time and frame presentation in Google's browser**. CSS finished at 427.169 ms and the hero image at 550.35 ms. Reported top-level main-thread tasks longer than 5 ms occupied 93.510 ms of that interval, leaving most of it unexplained by those tasks. Smaller tasks, off-main-thread work, and presentation scheduling are not resolved by that audit. The result establishes the delay's position in the rendering/presentation sequence for this instrumented capture; it does not identify a GPU backend, driver issue, or compositor bug.

The direct-host run 3 also has early CSS and a long interval without reported substantial main-thread work before its 1480 ms observed first paint. That pattern is compatible with the probe result, but the direct-host report lacks its own `paintTime` measurement, so identical causation is not proven. The API's rounded presentation values and Lighthouse's observed trace metrics can differ by 1–3 ms; they should not be silently interchanged.

The proxy buffered complete HTML, used another origin, and did not forward the original HTTP Link headers. Its delivery therefore differs from the direct site. Diagnostic mobile scores were 76, 75, and 78; desktop scores were 92, 98, and 99. They are not used for the article gate. In these three mobile reports, the presentation gap does not vary monotonically with simulated LCP; subtracting it from a Lighthouse estimate would not produce a corrected score.

The temporary workload, its dedicated GVC, and its image were deleted after capture and verified absent. Both original demos retain their matching source images and fixed resource settings. These Google measurements confirm intermittent presentation delay as a real diagnostic finding, while the precise cause of the historical-to-current score difference remains unresolved. The source rollback still provides no evidence that the older application consistently performs better.

## Predefined confirmation captures, October 8 late evening

A further confirmation batch was fixed at three runs per host and form factor before capture, after an intervening diagnostic set exceeded the required ten-minute window between the earliest and latest JSON `fetchTime` because PageSpeed reused cached results. Previously published batches remain above; the intervening diagnostic set is retained below. The confirmation used deployed source `5df1b6827002108389e337bbe308896d49da30a1` and the unchanged Inertia image 22 / RSC image 34 from the paired rebuild above. Runtime checks reconfirmed the seller flags, package hashes, and fixed resources. Both exact URLs were loaded three times before the first analysis.

Six alternating submissions produced twelve distinct fetchTimes, with no retries or exclusions. They span **278.797 seconds**, from `2026-10-09T09:43:00.666Z` to `2026-10-09T09:47:39.463Z` (October 8, 23:43–23:47 HST). Lighthouse 13.5.0, Chrome 153.0.8010.36, and complete settings match by form factor. The PageSpeed browser-location tooltips identify **North America** for all twelve reports.

| Variant / run | Form factor | Performance |   FCP |    LCP | `fetchTime` (UTC)          | Report                                                                                                                                  |
| ------------- | ----------- | ----------: | ----: | -----: | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| inertia-1     | mobile      |          53 | 7.1 s | 10.9 s | `2026-10-09T09:43:00.833Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/nqm8r8n1ap?form_factor=mobile)  |
| inertia-1     | desktop     |          72 | 1.4 s |  2.4 s | `2026-10-09T09:43:00.666Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/nqm8r8n1ap?form_factor=desktop) |
| rorp-1        | mobile      |          62 | 2.9 s |  7.5 s | `2026-10-09T09:43:58.821Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/yjmr6vyc57?form_factor=mobile)     |
| rorp-1        | desktop     |          94 | 0.6 s |  1.1 s | `2026-10-09T09:43:58.277Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/yjmr6vyc57?form_factor=desktop)    |
| inertia-2     | mobile      |          54 | 7.1 s | 10.9 s | `2026-10-09T09:44:54.026Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/i0yymwhiz1?form_factor=mobile)  |
| inertia-2     | desktop     |          77 | 1.4 s |  2.2 s | `2026-10-09T09:44:53.570Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/i0yymwhiz1?form_factor=desktop) |
| rorp-2        | mobile      |          65 | 2.9 s |  6.8 s | `2026-10-09T09:45:49.322Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/pdzy604kqs?form_factor=mobile)     |
| rorp-2        | desktop     |          99 | 0.5 s |  0.9 s | `2026-10-09T09:45:49.417Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/pdzy604kqs?form_factor=desktop)    |
| inertia-3     | mobile      |          53 | 7.1 s | 10.8 s | `2026-10-09T09:46:45.178Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/2feq4sv7hq?form_factor=mobile)  |
| inertia-3     | desktop     |          68 | 1.5 s |  2.3 s | `2026-10-09T09:46:45.161Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/2feq4sv7hq?form_factor=desktop) |
| rorp-3        | mobile      |          70 | 2.9 s |  4.9 s | `2026-10-09T09:47:39.422Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/x84az7hl3g?form_factor=mobile)     |
| rorp-3        | desktop     |          98 | 0.7 s |  1.0 s | `2026-10-09T09:47:39.463Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/x84az7hl3g?form_factor=desktop)    |

Mobile medians are **53 for Inertia and 65 for RSC**, a **12-point gap**; desktop medians are **72 and 98**. Both specified stop conditions are met: the mobile gap is below 15 and RSC mobile is below 70. Neither article is updated. These are Google PageSpeed reports, not local diagnostic scores.

Immediately before this batch, an unchanged-source diagnostic set produced mobile scores 50/55/48 for Inertia and 76/72/78 for RSC (medians 50/76), with desktop medians 69/98. Its 669.892-second span exceeds the requested window, so it is not used for the article gate. Cached attempts were retained and excluded by comparing each form factor's actual fetchTime. The same RSC image therefore produced batch medians 76 and 65 without an intervening deployment; this demonstrates substantial variation without a source change but does not isolate its cause. The diagnostic set's report links and exact values follow.

| Host    | Run                                                                                                                                | Form    | Score | FCP   | LCP    | fetchTime UTC            |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | ----: | ----- | ------ | ------------------------ |
| rorp    | [1](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/znu31e5uxk?form_factor=mobile)     | mobile  |    76 | 2.4 s | 4.9 s  | 2026-10-09T09:26:52.645Z |
| rorp    | [2](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/0yiryjv5p3?form_factor=mobile)     | mobile  |    72 | 2.6 s | 5.0 s  | 2026-10-09T09:27:45.959Z |
| rorp    | [3](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/ty54mmysbk?form_factor=mobile)     | mobile  |    78 | 2.1 s | 4.4 s  | 2026-10-09T09:30:27.030Z |
| rorp    | [1](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/znu31e5uxk?form_factor=desktop)    | desktop |    92 | 0.7 s | 1.2 s  | 2026-10-09T09:26:52.640Z |
| rorp    | [2](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/0yiryjv5p3?form_factor=desktop)    | desktop |    98 | 0.5 s | 0.9 s  | 2026-10-09T09:27:45.928Z |
| rorp    | [3](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/ty54mmysbk?form_factor=desktop)    | desktop |    98 | 0.6 s | 1.0 s  | 2026-10-09T09:30:26.776Z |
| inertia | [1](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/v3xoq510pk?form_factor=mobile)  | mobile  |    50 | 7.1 s | 11.2 s | 2026-10-09T09:34:17.244Z |
| inertia | [2](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/rodltflwne?form_factor=mobile)  | mobile  |    55 | 7.1 s | 10.9 s | 2026-10-09T09:35:42.938Z |
| inertia | [3](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/mcd0kvgzer?form_factor=mobile)  | mobile  |    48 | 7.1 s | 11.7 s | 2026-10-09T09:38:02.379Z |
| inertia | [1](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/v3xoq510pk?form_factor=desktop) | desktop |    69 | 1.4 s | 2.3 s  | 2026-10-09T09:34:17.211Z |
| inertia | [2](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/rodltflwne?form_factor=desktop) | desktop |    75 | 1.4 s | 2.3 s  | 2026-10-09T09:35:43.011Z |
| inertia | [3](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/mcd0kvgzer?form_factor=desktop) | desktop |    62 | 1.4 s | 2.4 s  | 2026-10-09T09:38:02.532Z |

The original Inertia and RSC reports identify **Europe** in their browser-location tooltips, unlike this North American confirmation set. The intervening RSC reports scoring 76/72/78 and 65/75/70 also identify North America. Geography is therefore a verified difference from the original captures, but it cannot by itself explain the recent same-region spread. The CPU benchmark index likewise does not identify a region or GPU backend: the 76-point North American run reports 534.5, close to the original European report's 526.5.

[Google's documentation](https://developers.google.com/speed/docs/insights/v5/about) explains that the PageSpeed datacenter can vary with network conditions and identifies the location in the report. The [documented API parameters](https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed) include no region selector; `locale` controls formatted language. No explicit location selector appeared in the inspected interface.

The controlled historical-image rollback still did not establish better performance from older code. Presentation delays and simulation sensitivity are demonstrated mechanisms, while attributing the original score difference to either remains an inference. No dependency upgrade or application performance fix was deployed for these captures.

### Live hosting-region recheck, October 9

A read-only runtime and Control Plane recheck at `2026-10-09T22:07:05Z` (October 9, 12:07 HST) reconfirmed both deployments on `5df1b6827002108389e337bbe308896d49da30a1`. Both GVCs and every active workload deployment are in **AWS US East (Ohio), `aws-us-east-2`**. All eight workload pairs were ready with matching fixed resources and one ready replica each. Source and installed dependency hashes still match. This is the application hosting region; the saved Google reports separately identify their runner as North America.

The product rendering path is selected by `product_page_react_on_rails`, false for the Inertia demo and true for the RSC demo when evaluated for `luisfurushio`. The differing `GUMROAD_RENDERING_SURFACE` release setting maps to that same flag; it is not a separate request-time rendering switch. The release script sets the flag globally within each isolated demo database and verifies it for the product seller. The deployments have their own hostnames, storage namespaces, credential references and host-specific images; no additional unexplained behavior-setting difference was identified. No deployment, flag change or new PageSpeed measurement was made during this recheck.

### Historical hosting and score differences

Historical replica metrics place both applications in AWS US East (Ohio) during the October 1 captures, as today. Google's browser location changed from Europe to North America; the application hosting region did not. The critical CSS URL and HTTP/2 protocol remained unchanged. Current Rails CPU reservations increased from approximately 0.4–0.45 cores to one fixed core; capacity was not reduced.

| RSC mobile report                                                                                                                                          | Performance |   FCP |   LCP | Total Blocking Time |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------: | ----: | ----: | ------------------: |
| [October 1](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/737osqp6n5?form_factor=mobile)                     |          80 | 2.3 s | 3.6 s |              200 ms |
| [October 8 HST (October 9 UTC), confirmation run 2](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/pdzy604kqs?form_factor=mobile) |          65 | 2.9 s | 6.8 s |               30 ms |

Both linked reports use Lighthouse 13.5.0, Chrome 153.0.8010.36 and identical `configSettings`. Both recorded 95 requests, including the same 14 image URLs and two stylesheet URLs; total recorded transfer was 2,957,995 and 2,960,646 bytes respectively. The comparison does not show a browser-version change or a large new payload.

LCP's weighted contribution decreased by 13.5 points, while improved blocking time added 3 points. These are simulated Lighthouse metrics, not evidence that the application became uniformly slower. The original URL lacked `recommended_by=search`; both retained `layout=profile`. No exact historical cause has been established.

### Local stylesheet delivery experiment, October 9

A predefined local experiment alternated five external-stylesheet baselines with five copies of the same RSC document containing its complete stylesheet inline. Chrome 153.0.8010.36 and Lighthouse 13.5.0 used the same mobile settings across all ten runs. All subresources used the live network. The initial document came from a local gzip server after a fixed 350 ms delay, preserving the original visible URL and origin.

| Median metric                  | External stylesheet | Inline stylesheet |
| ------------------------------ | ------------------: | ----------------: |
| Local performance score        |                  60 |                85 |
| Observed FCP                   |             2529 ms |            414 ms |
| Observed LCP                   |             2529 ms |            608 ms |
| Paint-to-presentation interval |           1000.9 ms |            7.5 ms |
| Simulated LCP                  |             7161 ms |           3445 ms |
| Compressed HTML body           |         21131 bytes |       47360 bytes |

Baseline scores were 60, 60, 61, 59 and 60; inline scores were 85, 87, 87, 85 and 85. All five baselines exhibited the approximately one-second presentation delay; all five interventions avoided it. Chrome trace events identify `ThrottleUndrawnFrames` during the baseline's surface transition. Earlier stylesheet availability allowed the matching frame to arrive before this throttling began in the local reproduction. The direct-host Google reports do not expose these trace events, so this does not establish the exact mechanism behind the October 1 result.

These are local diagnostic scores, not Google PageSpeed measurements or a production forecast. The enlarged HTML had no additional WAN transfer penalty in this setup. Inlining also removes independent stylesheet caching and may duplicate a later stylesheet download. The first pair's initial and carousel-next screenshots matched byte-for-byte. All ten runs recorded the same existing analytics-request error, so this does not establish error-free page execution. The next step is to deploy the application change and measure both specified demo URLs through Google.

## CSS delivery change and paired Google captures, 2026-10-09 HST

These captures use application commit [`59c6947b9d80c7c52df8772fe69fd0e42c14fdb5`](https://github.com/shakacode/gumroad/commit/59c6947b9d80c7c52df8772fe69fd0e42c14fdb5) from [the CSS delivery PR](https://github.com/shakacode/gumroad/pull/117). Both hosts were freshly deployed from this commit. The existing stylesheet is embedded in the RSC product document; Inertia retains its external stylesheet. Dependency versions are unchanged.

### Deployment verification

Both demos were built from commit `59c6947b9d80c7c52df8772fe69fd0e42c14fdb5` using local Control Plane Flow 6.0.0 and the repository Dockerfile targeting Linux AMD64. The earlier baseline used the hosted Flow deployment workflow. Host-specific `BENCHMARK_APP` arguments produce distinct images; the deployed application source and dependency manifests match.

| App | Build/push started UTC | Build/push finished UTC | Image update started UTC | Image update finished UTC |
| --- | --- | --- | --- | --- |
| gumroad-inertia | 2026-10-09T22:56:50.102730+00:00 | 2026-10-09T23:40:03.281798+00:00 | 2026-10-09T23:40:49.312081+00:00 | 2026-10-09T23:41:00.227042+00:00 |
| gumroad-rorp | 2026-10-09T22:56:50.102840+00:00 | 2026-10-09T23:39:14.508075+00:00 | 2026-10-09T23:40:49.234619+00:00 | 2026-10-09T23:41:00.392469+00:00 |

Image updates completed before rollout convergence. All six application workloads reported latest-image readiness at 2026-10-09T23:42:42.580278+00:00. Runtime, fixed-capacity and HTTP checks completed by 2026-10-09T23:44:17.585308+00:00.

- `gumroad-inertia:23_59c6947b9d80c7c52df8772fe69fd0e42c14fdb5` — `sha256:b22cc8f031265e341be2f03ea5d518922f17910cf74eef8f85b96a51e5f954ce`.
- `gumroad-rorp:35_59c6947b9d80c7c52df8772fe69fd0e42c14fdb5` — `sha256:e7473c11906bed761439701f8234c26b9052a45292835bb71d75049598be8cb6`.

Both applications remain in AWS US East (Ohio), with one ready replica per workload and Capacity AI disabled. Rails has 1 CPU/2 GiB; renderer and Sidekiq each have 0.5 CPU/1 GiB. All eight workload pairs have matching fixed resources. Hash comparison verified that every non-image workload specification and both GVC specifications remained unchanged. No release hook, database preparation, reseeding, secret preparation or template application ran.

Both runtimes report Ruby 3.4.3 and Node v22.22.2, matching the live baseline. `package.json`, `package-lock.json`, `Gemfile.lock`, installed React/ROR/RSC package manifests and installed ROR gem versions match between hosts. Seller `luisfurushio` retains `product_page_react_on_rails=false` on Inertia and `true` on RSC.

| HTTP acceptance | Inertia | RSC |
| --- | ---: | ---: |
| Gzip response body bytes | 6549 | 47410 |
| Decoded HTML bytes | 38728 | 297408 |
| External design stylesheet links | 1 | 0 |

The RSC document contains the full design stylesheet inline, with no external design stylesheet link or HTTP Link preload for that stylesheet. All seven rebased asset URLs use the original asset host and returned HTTP 200. Inertia retains its external design stylesheet link and HTTP preload hint. These checks establish deployment and document behavior; Google PageSpeed measurements are reported separately.

Offline comparison with the previous deployment confirmed identical paths and SHA-256 hashes for the RSC document’s initial script artifacts. The design stylesheet is also byte-identical (154,723 bytes). Other Vite JavaScript filenames changed; after normalizing emitted asset references, the only remaining differences were trailing spaces in type-validation diagnostic strings. Reinstating those spaces reproduced the saved baseline hashes exactly.

### Twelve Google PageSpeed captures

URLs: [Inertia](https://luisfurushio.gumroad-inertia.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search) and [RSC](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search). Both include `layout=profile&recommended_by=search`. The post-verification, post-warmup cutoff is `2026-10-09T23:45:55.487Z` (UTC).

Lighthouse version(s): `13.5.0`. Browser host user agent(s): `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.8010.36 Safari/537.36`. The report JSON settings below are identical within each form factor.

| Form | Throttling method | RTT (ms) | Throughput (Kbps) | CPU slowdown multiplier | Screen emulation |
| --- | --- | ---: | ---: | ---: | --- |
| mobile | `simulate` | 150 | 1638.4 | 1.2 | `{"width":412,"height":823,"deviceScaleFactor":1.75,"mobile":true}` |
| desktop | `simulate` | 40 | 10240 | 1 | `{"width":1350,"height":940,"deviceScaleFactor":1}` |

All twelve saved-report browser-location tooltips identify North America. The applications are hosted in Ohio; browser and application locations are separate observations.

The predefined batch contains three runs per host and form factor. Every report was submitted through the Google PageSpeed website against the specified URLs after three warmup loads per host. All twelve actual `fetchTime` values are later than the recorded deployment/warmup cutoff. Complete settings match within each form factor. The captures span **324.804 seconds**, from `2026-10-09T23:46:08.733Z` to `2026-10-09T23:51:33.537Z`.

| Variant / run | Form factor | Performance | FCP | LCP | `fetchTime` (UTC) | Report |
| --- | --- | ---: | --- | --- | --- | --- |
| inertia-1 | desktop | 76 | 1.4 s | 2.2 s | `2026-10-09T23:46:08.733Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/w5svfjw4x6?form_factor=desktop) |
| inertia-1 | mobile | 45 | 7.2 s | 11.5 s | `2026-10-09T23:46:09.524Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/w5svfjw4x6?form_factor=mobile) |
| rorp-1 | mobile | 74 | 2.0 s | 5.8 s | `2026-10-09T23:47:17.733Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/ss6kmx0shp?form_factor=mobile) |
| rorp-1 | desktop | 98 | 0.3 s | 1.0 s | `2026-10-09T23:47:17.012Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/ss6kmx0shp?form_factor=desktop) |
| inertia-2 | desktop | 61 | 1.4 s | 2.4 s | `2026-10-09T23:48:20.552Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/lyxockk21u?form_factor=desktop) |
| inertia-2 | mobile | 55 | 7.1 s | 10.8 s | `2026-10-09T23:48:19.870Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/lyxockk21u?form_factor=mobile) |
| rorp-2 | desktop | 97 | 0.6 s | 1.0 s | `2026-10-09T23:49:27.379Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/17jeccaz99?form_factor=desktop) |
| rorp-2 | mobile | 72 | 2.0 s | 6.0 s | `2026-10-09T23:49:27.355Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/17jeccaz99?form_factor=mobile) |
| inertia-3 | mobile | 54 | 7.1 s | 10.8 s | `2026-10-09T23:50:30.841Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/tyskyoggwd?form_factor=mobile) |
| inertia-3 | desktop | 75 | 1.4 s | 2.3 s | `2026-10-09T23:50:30.683Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/tyskyoggwd?form_factor=desktop) |
| rorp-3 | desktop | 95 | 0.6 s | 1.0 s | `2026-10-09T23:51:33.537Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/3jqrwhe3ck?form_factor=desktop) |
| rorp-3 | mobile | 76 | 2.0 s | 4.9 s | `2026-10-09T23:51:32.764Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/3jqrwhe3ck?form_factor=mobile) |

Mobile medians are **54 for Inertia and 74 for RSC**, a **20-point gap**. Desktop medians are **75 and 97**. These are Google lab measurements; scores vary between runs.

The preceding local experiment isolates stylesheet delivery under its stated transport limits. This deployed comparison establishes the measured result for the new same-source pair; it does not reconstruct the exact transient conditions behind the October 1 captures.

This complete batch improves on the earlier mobile medians of 53/65, but RSC’s median of 74 does not meet the intended above-80 result or the article’s original approximate score band. No article update is justified by this batch. Further image-scheduling experiments are separate work; these reports are retained without score-driven replacements.

## Static description diagnostics — October 9, 2026

These local diagnostics informed [PR #117](https://github.com/shakacode/gumroad/pull/117), candidate commit [`eae862d6f774b5b7b4b81989a4e41766bf110829`](https://github.com/shakacode/gumroad/commit/eae862d6f774b5b7b4b81989a4e41766bf110829). Both hosts have now been deployed and verified at this candidate; deployment details follow below. The completed Google PageSpeed batch is reported below. Local scores below do not replace the saved Google reports or establish that the article's publication criteria have been met.

Comparing the saved Google RSC mobile reports scoring 80, 65, and 74 separates observed rendering from Lighthouse's simulation. Their observed FCP/LCP values were respectively 991/991 ms, 2423/2423 ms, and 469/651 ms; simulated LCP was 3604.023, 6752.028, and 5813.987 ms (rounded to three decimals). Thus the inline-CSS report scoring 74 displayed the product sooner than the original report scoring 80, while its simulated LCP remained worse. LCP accounted for −13.50 weighted score points between 80 and 65, and −11.50 between 80 and 74. These reports do not supply Google's raw trace and simulation graph, so they do not establish the complete historical cause of the score change. They also do not support backend slowness or a historical CPU slowdown as a simple explanation.

Three local hero-priority pairs changed the hero's request priority as intended but left median score at 85 and median simulated LCP at 3454 → 3451 ms. Three offscreen-cover pairs actually deferred four requests beyond one second and reduced median image bytes completed before one second by 280,642 bytes, but median score changed 86 → 85. Replaying the retained artifacts with CPU multipliers 1.2, 4, 6, and 8 gave median paired score changes of 0 at every multiplier for hero priority, and −1/−3/−3/−3 for cover deferral. This was offline sensitivity analysis, not new browser gathering or calibration to Google's hardware.

An initial description-only experiment added lazy attributes to seven HTML images without changing the client description data. Median local score rose 85 → 90, but client editor enhancement reset every loading attribute to `auto`; all seven requests still began before one second. That experiment demonstrated a transient priority/model effect, not persistent lazy loading or bandwidth savings, and was not treated as a deployable fix.

The subsequent nine-run experiment used three fixed groups with three arms: the inline-CSS baseline, normalized links keeping ordinary descriptions static, and the same static descriptions with six subsequent images lazy. The first description image retained its existing loading behavior. Captured HTML and Flight data were updated consistently using the actual Ruby presenter output; Flight record framing and embedded cache keys were preserved. The tested application code is identical to the final candidate linked above. Tests used Linux ARM Chrome 153.0.8010.36, Lighthouse 13.5.0, simulated mobile throttling (150 ms RTT, 1638.4 Kbps, CPU multiplier 1.2), and a 412 × 823 viewport at device scale factor 1.75. All arms used the same local gzip document transport with a 350 ms delivery delay and actual network requests to the original HTTPS asset hosts. This document transport and local hardware limit comparisons with Google.

| Median of three local runs | Baseline | Static description | Static + six lazy images |
| --- | ---: | ---: | ---: |
| Performance score | 85 | 90 | 95 |
| Observed LCP, ms | 625 | 610 | 613 |
| Simulated LCP, ms | 3445 | 3446 | 2662 |
| Script requests | 73 | 66 | 66 |
| Script transfer bytes | 1,593,275 | 1,068,102 | 1,068,108 |
| Image bytes completed before one second | 1,008,161 | 1,008,114 | 1,008,142 |

Avoiding unnecessary editor enhancement eliminated seven script requests and approximately 525 KB of transferred JavaScript. The six lazy attributes persisted, but all seven description-image requests still began before one second during Lighthouse: **there was no measured early image-byte saving**. The previously identified local simulated-LCP image changed from Medium to Low priority only in the lazy arm, consistent with resource scheduling and Lighthouse's image-selection rules affecting the modeled result. This does not identify the critical node in Google's unavailable raw graph. All three TBT medians were zero; the static-only score increase cannot be attributed solely to CPU savings.

Separate functional checks expanded “Read more,” scrolled through all seven images, verified loaded natural dimensions and visible image pixels, and successfully collapsed “Show less” in all three arms. The final arm retained the first image's default and six lazy attributes throughout. In the first separate UI check, baseline and final-arm initial screenshots were byte-identical. All arms also showed the same existing “Something went wrong” page error; a transient toast affected the static-only screenshot and can affect Speed Index. These checks verify description/image behavior, not an error-free application. An earlier reconstruction attempt that produced blank intervention pages was excluded from the valid nine-run comparison.

Raw local reports, traces, network logs, reconstruction checks, and screenshots were retained locally; the replay fixtures are not attached here, so this summary alone is not a complete public reproduction package. The candidate preserves authored loading preferences, leaves coverless descriptions' image loading unchanged, and retains existing enhancement for interactive descriptions. The matched-deployment Google capture batch below determines the article update gate.

## Referral-query Google diagnostic — October 9, 2026 (HST)

This bounded diagnostic compared two URLs on the same RSC deployment, held at commit [`59c6947b9d80c7c52df8772fe69fd0e42c14fdb5`](https://github.com/shakacode/gumroad/commit/59c6947b9d80c7c52df8772fe69fd0e42c14fdb5):

- [Original URL](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile)
- [Search URL](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search)

All four October 1 saved reports used `?layout=profile` without the referral parameter. This diagnostic isolates that URL difference on the later inline-CSS deployment; it does not reproduce the historical deployment or compare Inertia with RSC.

Both exact URLs were loaded three times before capture. Six alternating submissions produced twelve distinct fresh reports, three per URL and form factor. Lighthouse 13.5.0 and Chrome 153.0.8010.36 ran in North America with simulated throttling, with identical settings within each form factor: mobile 150 ms RTT / 1638.4 Kbps / CPU multiplier 1.2, desktop 40 ms / 10240 Kbps / CPU multiplier 1. The first-to-last JSON fetchTime span was **344.708 seconds** (October 10, 00:49:33.019–00:55:17.727 UTC; October 9, 14:49:33.019–14:55:17.727 HST). Before/after checks confirmed unchanged deployment images and workload versions. Every submitted report is retained below, including the desktop outlier.

| URL | Run | Device | Score | FCP | LCP | JSON fetchTime (UTC) | Saved report |
| --- | ---: | --- | ---: | --- | --- | --- | --- |
| Original | 1 | mobile | 70 | 2.3 s | 6.4 s | 2026-10-10T00:49:33.019Z | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/vujmp7v680?form_factor=mobile) |
| Original | 1 | desktop | 97 | 0.7 s | 1.1 s | 2026-10-10T00:49:33.238Z | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/vujmp7v680?form_factor=desktop) |
| Search | 1 | mobile | 75 | 2.0 s | 5.5 s | 2026-10-10T00:50:38.595Z | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/pxwa43fezy?form_factor=mobile) |
| Search | 1 | desktop | 97 | 0.6 s | 1.1 s | 2026-10-10T00:50:39.012Z | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/pxwa43fezy?form_factor=desktop) |
| Original | 2 | mobile | 75 | 2.0 s | 5.6 s | 2026-10-10T00:51:43.988Z | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/voqh3879h0?form_factor=mobile) |
| Original | 2 | desktop | 98 | 0.6 s | 1.0 s | 2026-10-10T00:51:44.309Z | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/voqh3879h0?form_factor=desktop) |
| Search | 2 | mobile | 80 | 2.0 s | 4.3 s | 2026-10-10T00:53:00.156Z | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/9qg2q73w2i?form_factor=mobile) |
| Search | 2 | desktop | 64 | 0.6 s | 1.1 s | 2026-10-10T00:53:01.809Z | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/9qg2q73w2i?form_factor=desktop) |
| Original | 3 | mobile | 70 | 2.5 s | 5.7 s | 2026-10-10T00:54:11.203Z | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/hqfy0a0nw3?form_factor=mobile) |
| Original | 3 | desktop | 97 | 0.6 s | 0.9 s | 2026-10-10T00:54:10.724Z | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/hqfy0a0nw3?form_factor=desktop) |
| Search | 3 | desktop | 99 | 0.5 s | 0.8 s | 2026-10-10T00:55:16.955Z | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/kc869b0btc?form_factor=desktop) |
| Search | 3 | mobile | 77 | 2.3 s | 4.4 s | 2026-10-10T00:55:17.727Z | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/kc869b0btc?form_factor=mobile) |

Mobile scores were **70/75/70** without the parameter (median **70**) and **75/80/77** with it (median **77**). Desktop scores were **97/98/97** and **97/64/99**, both median **97**. The search URL's desktop score of **64** is retained: its total blocking time displayed **1,830 ms**, despite FCP **0.6 s** and LCP **1.1 s**.

The referral parameter did **not** reproduce the proposed historical negative effect in this batch. Three runs per condition, differing runner conditions, and the retained outlier do not establish a positive causal benefit from adding the parameter either. A separate paired HTTP comparison found identical initial resource lists, with differences limited to URL-derived values, CSRF tokens, and CSP nonces. The application has a feature-gated attribution branch, so these findings do not mean the parameter can never affect timing. Historical rollback/restored-source measurements also used the original URL and had mobile medians 68/71; omission of the referral parameter alone does not establish the historical explanation.

These are diagnostic results on the earlier CSS-only source, not the final static-description candidate's matched-deployment capture or an authorization to update the articles.

## Static description deployment, October 9, 2026 (HST)

Both demos were built from commit `eae862d6f774b5b7b4b81989a4e41766bf110829` using Control Plane Flow 6.0.0 locally, then updated by immutable image digest. No release hook, migration or reseeding ran. Both retain fixed resources in AWS Ohio and their existing configuration. The luisfurushio rendering flag is off for Inertia and on for RSC.

| Demo | Image | Digest | Build start/end UTC | Deploy update start/end UTC |
|---|---|---|---|---|
|gumroad-inertia|`gumroad-inertia:24_eae862d6f774b5b7b4b81989a4e41766bf110829`|`sha256:3b6c98ab0e0d2df08cb45a8159a38c0f9b6c749dce114874de39cb4e1de2086b`|2026-10-10T00:27:42.553814+00:00 / 2026-10-10T01:10:15.966320+00:00|2026-10-10T01:10:52.960267+00:00 / 2026-10-10T01:11:04.733964+00:00|
|gumroad-rorp|`gumroad-rorp:36_eae862d6f774b5b7b4b81989a4e41766bf110829`|`sha256:c05e2cc0522e36c6c27be31b8889321489c8bd9f29e1b91f59562a400e77a5b6`|2026-10-10T00:27:42.553976+00:00 / 2026-10-10T01:09:45.591859+00:00|2026-10-10T01:10:52.968731+00:00 / 2026-10-10T01:11:04.962371+00:00|

All six application workloads reported readyLatest at 2026-10-10T01:12:43.118676+00:00.

Ruby, Node, installed dependency versions and package/lock hashes match between the pair. Runtime source-file hashes match the reviewed source. All non-image workload and GVC specification hashes are unchanged. The existing RSC compiled script paths/hashes and design stylesheet bytes match the preceding inline-CSS deployment. The two hosts have distinct image digests, domains, storage/database/cache identities and credentials. These isolate deployments and can affect URL/metadata/cache state. The product-page feature flag selects the rendering implementation; no second request-time implementation toggle was identified. Configured environment entries have no unexpected differences beyond these established identities and rendering-surface setup.

RSC keeps inline design CSS without an external design stylesheet link/preload. Its simple description stays static without the editor or a fallback RSC fetch; links have the expected target/rel values, the first description image retains its default loading, and the following six remain lazy. The product loads, Read more expands, and all seven description images load on scroll. Inertia keeps its external design stylesheet.

Verification completed 2026-10-10T01:22:31.704771+00:00. Browser hydration, carousel, expanded-image visibility and navigation from the main Add to cart action to the expected checkout URL pass. This verifies navigation only, not checkout completion; no purchase was submitted. Local build method is the same as the preceding inline-CSS deployment; earlier hosted `5df1b68` builds used Flow 5.2. No claim of byte-identical host images or controlled equivalence to the historical October 1 runner is made.

The deployed source above is application-identical to PR #117 test-only follow-up commit `7f0a7d1f833e33ecaf71a3a6a1a08c541745c3a4`. Standard Rails focused validation at that follow-up passed 31 examples; local asset-build validation remained limited by missing frontend dependencies. The successful deployment builds are separate production-asset-build evidence.

Both runtimes report Ruby **3.4.3**, Node **v22.22.2**, React/ReactDOM **19.2.8**, React on Rails/Pro/Node renderer **17.1.0**, and react-on-rails-rsc **19.3.0**. Common dependency-file SHA-256 values are:

- `package.json`: `862b67c72d7710a11338214cd144f3b25bcfb47a7e5c296ad84c484de264d723`.
- `package-lock.json`: `2ca9052d7559dfa6c04502da4effa2c1d8cfcdbb3f3e68cf2917be08586b3a2b`.
- `Gemfile.lock`: `b33772f04939472e16ea8bd17e3255b264ceefae262159a3c05e2d6acded7f7c`.

Fixed allocations match the preceding comparison: Rails **1 CPU / 2 GiB**, renderer and Sidekiq each **0.5 CPU / 1 GiB**, one ready replica per workload, Capacity AI disabled. Resource allocations match across all eight corresponding workloads. All 477 compared compiled asset paths and SHA-256 hashes match the preceding inline-CSS deployment on each host, including 83 RSC artifacts and the design stylesheet. The change is server-provided description data, not a rebuilt client script change.

The verification cutoff is `2026-10-10T01:22:31.704771+00:00`. The Google batch below followed this verification and fresh warmups; deployment success alone does not satisfy the article score gate.

### Twelve Google captures after the static-description deployment

Both [Inertia](https://luisfurushio.gumroad-inertia.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search) and [RSC](https://luisfurushio.gumroad-rorp.reactonrails.com/l/bgfjk?layout=profile&recommended_by=search) used the prescribed `layout=profile&recommended_by=search` URLs. Three successful warmup loads per host completed at `2026-10-10T01:23:30.463Z`. This clock cutoff was recorded after the final visible-heading load and before the first PageSpeed submission at `2026-10-10T01:23:41.203Z`; it was not derived from report timestamps. Six predefined alternating submissions produced twelve distinct fresh reports, with no exclusions or retries. All JSON fetchTimes follow the verification and warmup cutoff, and none reuse retained prior report IDs or timestamps.

The captures span **365.532 seconds**, `2026-10-10T01:23:44.463Z`–`2026-10-10T01:29:49.995Z` (October 9, 15:23:44.463–15:29:49.995 HST). All twelve browser-location tooltips report **North America**. Lighthouse **13.5.0** and HeadlessChrome **153.0.8010.36** were used throughout; complete settings match within each form factor and match the preceding CSS-only batch: mobile simulated 150 ms RTT / 1638.4 Kbps / CPU 1.2, desktop simulated 40 ms RTT / 10240 Kbps / CPU 1. Before/after comparison confirmed unchanged application image digests, workload versions and non-image specifications; the final verification completed at `2026-10-10T01:31:44.122410+00:00`.

| Variant / run | Form factor | Performance | FCP | LCP | `fetchTime` (UTC) | Report |
| --- | --- | ---: | --- | --- | --- | --- |
| inertia-1 | mobile | 55 | 7.1 s | 10.9 s | `2026-10-10T01:23:44.463Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/u78lxp24qi?form_factor=mobile) |
| inertia-1 | desktop | 75 | 1.4 s | 2.2 s | `2026-10-10T01:23:44.496Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/u78lxp24qi?form_factor=desktop) |
| rorp-1 | desktop | 100 | 0.3 s | 0.7 s | `2026-10-10T01:24:59.070Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/tx4ma7by4i?form_factor=desktop) |
| rorp-1 | mobile | 80 | 2.0 s | 4.5 s | `2026-10-10T01:24:59.544Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/tx4ma7by4i?form_factor=mobile) |
| inertia-2 | desktop | 77 | 1.4 s | 2.2 s | `2026-10-10T01:26:14.108Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/2qkck1tfl4?form_factor=desktop) |
| inertia-2 | mobile | 50 | 7.1 s | 10.9 s | `2026-10-10T01:26:14.691Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/2qkck1tfl4?form_factor=mobile) |
| rorp-2 | mobile | 78 | 2.0 s | 5.3 s | `2026-10-10T01:27:24.313Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/0n4zwbvb29?form_factor=mobile) |
| rorp-2 | desktop | 99 | 0.5 s | 0.8 s | `2026-10-10T01:27:23.936Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/0n4zwbvb29?form_factor=desktop) |
| inertia-3 | desktop | 74 | 1.4 s | 2.4 s | `2026-10-10T01:28:35.215Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/peuvxzavus?form_factor=desktop) |
| inertia-3 | mobile | 51 | 7.1 s | 10.9 s | `2026-10-10T01:28:35.792Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/peuvxzavus?form_factor=mobile) |
| rorp-3 | desktop | 99 | 0.6 s | 0.9 s | `2026-10-10T01:29:49.995Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/ubwes2odgs?form_factor=desktop) |
| rorp-3 | mobile | 83 | 1.8 s | 4.3 s | `2026-10-10T01:29:49.484Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/ubwes2odgs?form_factor=mobile) |

Mobile scores are **55/50/51 for Inertia** and **80/78/83 for RSC**, with medians **51 and 80** and a **29-point gap**. Desktop scores are **75/77/74** and **100/99/99**, with medians **75 and 99**. Scores vary between runs.

The editorial criterion was defined before fresh captures: mobile medians within about five points of the original 53/80, with a gap similar to the original 27 points. This batch meets that limited article-update assessment: medians are 51/80 and the gap is 29 points. “Similar” was not assigned a numerical tolerance. This is not a statistical stability test or evidence that repeated batches will have a median of 80. It does **not** establish a median strictly above 80: one RSC run scored 83, but the median is 80.

Each changed-source implementation batch was fixed before capture at six submissions producing twelve samples, three per host and form factor. There were no score-driven retries within a batch; invalid and unfavorable diagnostic results are retained separately above. Source and conditions differed across implementation batches, so they do not form repeated confirmation of a stable 80 or isolate a causal score gain. These measurements establish the recorded result of the verified same-source deployment pair, not the precise cause of the historical October 1 result.

For the article tables, the representative report is the run with the median performance score, breaking ties by earliest fetchTime: Inertia mobile run 3, RSC mobile run 1, Inertia desktop run 1, and RSC desktop run 2. FCP, LCP and capture time come from that same report; they are not separately calculated medians. The approximately 525 KB JavaScript reduction above belongs to the local diagnostic and is not a measured Google transfer-saving claim.

Across all three new RSC mobile Google reports, the same seven editor-related application script URLs are absent compared with all three preceding CSS-only reports. Application-host HTTP(S) script requests fall from **70 to 63**; their median transferred bytes fall from **1,486,096 to 1,202,313**, and decoded bytes from **4,433,001 to 3,556,809**. These counts and sums are computed from each report's network-request audit, excluding third-party scripts and blob URLs. They confirm the reduced application download; the sequential batches do not isolate how much of the score change comes from this reduction.

## Cart-count deployment, October 9, 2026 HST

Both demos were rebuilt from [reviewed commit `7f3557b04e9e8babffb2d8a337f7ea980f405b44`](https://github.com/shakacode/gumroad/commit/7f3557b04e9e8babffb2d8a337f7ea980f405b44) in [application PR #117](https://github.com/shakacode/gumroad/pull/117) using local Control Plane Flow 6.0.0. Both complete builds passed before image-only deployment; no release hook, migration, seeding or template application ran. This change replaces the hidden cart-count iframe's application shell with a small HTML response, preserving the existing storage-access check and message contract. It applies to both demos.

| Demo | Image | Digest | Build start / finish (UTC) | Image update start / finish (UTC) |
|---|---|---|---|---|
| gumroad-inertia | `gumroad-inertia:25_7f3557b04e9e8babffb2d8a337f7ea980f405b44` | `sha256:2e93a5b9b46686248069d9964475b13f2b391437add0d70e4c19a2ef1429c7b4` | `2026-10-10T03:45:54.449043+00:00` / `2026-10-10T04:30:57.508382+00:00` | `2026-10-10T04:31:51.596967+00:00` / `2026-10-10T04:32:03.154341+00:00` |
| gumroad-rorp | `gumroad-rorp:37_7f3557b04e9e8babffb2d8a337f7ea980f405b44` | `sha256:360f90c7f513094bde70fc32097298e32a2a28b47c23ccbbe9d5cb935b58fd57` | `2026-10-10T03:45:54.449162+00:00` / `2026-10-10T04:30:35.884225+00:00` | `2026-10-10T04:31:51.587079+00:00` / `2026-10-10T04:32:03.192382+00:00` |

All six application workloads reported `readyLatest` at `2026-10-10T04:33:41.455446+00:00`; deployment and behavior acceptance finished at `2026-10-10T04:36:08.965971+00:00` (October 9, 18:36 HST). Runtime commit and changed-source hashes match the reviewed source. Both hosts retain Ruby 3.4.3, Node 22.22.2, React/React DOM 19.2.8, React on Rails/Pro/renderer 17.1.0 and react-on-rails-rsc 19.3.0; installed package hashes and package/lockfile hashes match each other and the preceding deployment. The inline design stylesheet bytes are unchanged.

Both retain AWS Ohio hosting, the preceding fixed resource allocations, one replica per workload and disabled CapacityAI. All non-image workload and GVC configuration hashes are unchanged. Database, storage, cache and hostname identities remain distinct, as do image digests. The rendering feature evaluates false for seller `luisfurushio` on Inertia and true on RSC.

Both cart-count endpoints return 439-byte HTML with a nonce matching CSP, private/no-store caching, permitted framing and no external scripts or styles. Mobile and desktop browser checks received the expected cart-count message from each host with zero iframe asset requests. Both Product pages passed hydration, cover navigation and main Add to cart navigation to checkout, without page errors or RSC fallback requests. RSC retained its static description, first-image default and six lazy images; all seven images loaded visibly after expansion and scrolling. Desktop description was already expanded. No purchase was submitted or checkout completion tested.

These checks establish deployment and the tested behaviors, not a performance improvement. The following measurements record the new fixed comparison; no score is inferred from the smaller iframe response.

### Local cart-count before/after diagnostics

Five predefined captures before deployment and five after used the actual installed ShakaPerf 0.1.4 `runLighthouse` function through a task-local wrapper, with Lighthouse 13.0.3 and fresh Chrome profiles. This was a sequential local diagnostic on the real RSC host, not a stock Compare campaign or Google measurement. All ten reports have identical Lighthouse settings; no request interception or blocking was used.

| Local run | Performance | Observed FCP (ms) | Observed LCP (ms) | Simulated LCP (ms) | Iframe own-origin transfer (bytes) | fetchTime (UTC) |
|---|---:|---:|---:|---:|---:|---|
| baseline-1 | 94 | 954 | 1143 | 2891.498 | 651436 | `2026-10-10T03:38:21.117Z` |
| baseline-2 | 94 | 830 | 908 | 2874.6905 | 651509 | `2026-10-10T03:38:46.533Z` |
| baseline-3 | 94 | 859 | 944 | 2882.2715 | 651410 | `2026-10-10T03:39:14.199Z` |
| baseline-4 | 94 | 923 | 1001 | 2874 | 651430 | `2026-10-10T03:39:42.996Z` |
| baseline-5 | 93 | 861 | 974 | 2920.9264999999996 | 651513 | `2026-10-10T03:40:08.087Z` |
| candidate-1 | 94 | 932 | 1114 | 2855.091 | 2501 | `2026-10-10T04:36:59.165Z` |
| candidate-2 | 94 | 898 | 981 | 2870.9105 | 2507 | `2026-10-10T04:37:26.597Z` |
| candidate-3 | 94 | 853 | 944 | 2862.26 | 2495 | `2026-10-10T04:37:54.271Z` |
| candidate-4 | 93 | 897 | 980 | 2933.7855 | 2497 | `2026-10-10T04:38:20.445Z` |
| candidate-5 | 93 | 832 | 931 | 2933.9805 | 2487 | `2026-10-10T04:38:45.695Z` |

Both performance medians are **94**; simulated LCP medians are **2882.2715 → 2870.9105 ms**. The iframe's own-origin transfer median falls from **651436 to 2497 bytes**. Every baseline iframe loaded ten own-origin external scripts and one stylesheet; every candidate loaded none, and its HTML resource size was **439 bytes**. Attribution uses each request's exact document URL and network-audit URL; descendants under other document URLs are excluded.

Whole-page script counts fall from **66 to 53**, and median script transfer from **1324304 to 448266 bytes**, but this includes variable Stripe traffic and must not be attributed entirely to the application iframe. These runs support the reduced iframe download, not a causal timing or score improvement. Baseline and candidate ran sequentially under different time/network conditions; four idle local test-service containers present during baseline were removed before candidate. Fresh profiles avoided reliance on the installed worker's cache-clearing helper. Raw reports, CDP logs, the capture procedure and independent calculations are retained locally; this table is not a publicly reproducible full artifact bundle.

### Twelve Google captures after the cart-count deployment

Both exact Product URLs retained `?layout=profile&recommended_by=search`. Three successful browser warmups per host finished before the independently recorded cutoff `2026-10-10T04:39:38.987Z`. Before those equal warmups, only RSC received the five local candidate captures above (`04:36:59.165Z`–`04:38:45.695Z`); any effect of that additional load on the subsequent Google results is unquantified. Six predefined alternating submissions in the same PageSpeed tab generated twelve fresh reports, three per host and form factor. All fetchTimes follow that cutoff; no score-driven retry, exclusion or replacement occurred.

The actual earliest-to-latest JSON fetchTime span is **246.653 seconds**, from `2026-10-10T04:39:45.177Z` to `2026-10-10T04:43:51.830Z` (October 9, 18:39:45.177–18:43:51.830 HST), within ten minutes. Every report uses Lighthouse **13.5.0** and HeadlessChrome **153.0.8010.36**. Complete settings match within each form factor: simulated mobile 150 ms RTT / 1638.4 Kbps / CPU 1.2 and desktop 40 ms RTT / 10240 Kbps / CPU 1. These Google reports are separate from the local Lighthouse 13.0.3 diagnostics above.

| Run | Form factor | Performance | FCP | LCP | fetchTime (UTC) | Saved report |
|---|---|---:|---:|---:|---|---|
| inertia-1 | mobile | 51 | 7.1 s | 11.4 s | `2026-10-10T04:39:45.749Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/l13ycik38m?form_factor=mobile) |
| inertia-1 | desktop | 75 | 1.5 s | 2.4 s | `2026-10-10T04:39:45.177Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/l13ycik38m?form_factor=desktop) |
| rorp-1 | mobile | 96 | 1.1 s | 2.6 s | `2026-10-10T04:40:32.934Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/gtuz5yhbmq?form_factor=mobile) |
| rorp-1 | desktop | 99 | 0.3 s | 0.9 s | `2026-10-10T04:40:32.901Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/gtuz5yhbmq?form_factor=desktop) |
| inertia-2 | mobile | 55 | 7.2 s | 11.3 s | `2026-10-10T04:41:25.448Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/2dazoiji1x?form_factor=mobile) |
| inertia-2 | desktop | 72 | 1.5 s | 2.4 s | `2026-10-10T04:41:25.758Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/2dazoiji1x?form_factor=desktop) |
| rorp-2 | desktop | 99 | 0.5 s | 0.8 s | `2026-10-10T04:42:12.059Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/4qdh2w83hv?form_factor=desktop) |
| rorp-2 | mobile | 82 | 2.0 s | 4.6 s | `2026-10-10T04:42:12.417Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/4qdh2w83hv?form_factor=mobile) |
| inertia-3 | desktop | 72 | 1.5 s | 2.5 s | `2026-10-10T04:43:06.255Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/y8t8s5ymzc?form_factor=desktop) |
| inertia-3 | mobile | 53 | 7.2 s | 11.4 s | `2026-10-10T04:43:06.320Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-inertia-reactonrails-com-l-bgfjk/y8t8s5ymzc?form_factor=mobile) |
| rorp-3 | mobile | 86 | 1.1 s | 4.2 s | `2026-10-10T04:43:51.782Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/rw8p0jygjc?form_factor=mobile) |
| rorp-3 | desktop | 98 | 0.5 s | 1.1 s | `2026-10-10T04:43:51.830Z` | [Report](https://pagespeed.web.dev/analysis/https-luisfurushio-gumroad-rorp-reactonrails-com-l-bgfjk/rw8p0jygjc?form_factor=desktop) |

Mobile scores are **51/55/53 for Inertia** and **96/82/86 for RSC**, with medians **53 and 86** and a **33-point gap**. Desktop scores are **75/72/72** and **99/99/98**, with medians **72 and 99**. All three RSC mobile runs exceed 80; the median 86 also meets the later above 80 objective. Scores still vary between runs: this is one fixed batch, not proof of a stable 86 or the historical score's cause.

The original editorial condition used “about five points” around 53/80 and a similar 27-point gap. The new RSC median is six points above 80, one point outside a literal five-point band; the gap is 33. Neither material-regression stop condition applies (gap below 15 or RSC median below 70). This improved result should not be described as satisfying a strict ±5 rule. The later objective explicitly prioritized improvement above 80; publication of updated comparison blocks is a separate editorial decision.

Median-score representative reports, with earliest-fetchTime tie-breaking, are Inertia mobile run 3, RSC mobile run 3, Inertia desktop run 2 and RSC desktop run 1. Their FCP/LCP values and times belong to those reports, not separate timing medians. Sequential before/after campaigns do not isolate the cart change's causal contribution to the score difference.

All twelve saved-report browser-location tooltips identify **North America**. The after-capture check ran from `2026-10-10T04:45:17.030521+00:00` to `2026-10-10T04:45:59.039131+00:00`: all six application images and workload versions remained unchanged and ready at the verified source. All sixteen non-image workload specifications, allocations and GVC configuration remained unchanged in Ohio; fresh seller-flag checks remained false on Inertia and true on RSC.


### Post-capture behavior and operational update

After the captures, both variants passed [nonempty-cart browser checks](https://github.com/shakacode/gumroad/pull/117#issuecomment-6095061562): add a product, see cart count 1, reopen the saved item through the badge at bare `/checkout`, remove it, and reload to confirm the empty state. No payment details were entered or purchase submitted. These checks do not certify payment completion or every browser’s storage policy.

At `2026-10-10T07:20:26Z`, after all measurements, CapacityAI was restored on the six stateless application workloads (Rails, renderer and Sidekiq on each demo). All six were ready; image identities and all other workload and GVC settings were unchanged. Both demos remained running; the choice between manual and automatic shutdown was still pending.

The saved benchmarks used the fixed allocations documented above. The live demos now use adaptive resource allocation, so a new visit is not a reproduction of that measurement environment. To repeat the comparison, temporarily restore matched fixed resources, verify both deployments, and warm both exact URLs before capturing reports.
