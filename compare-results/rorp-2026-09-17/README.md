# Historical Product RSC comparison: September 17, 2026

This ShakaPerf run compared the Inertia profile-layout Product page with an earlier React on Rails Pro Server Components implementation. It does **not** measure the final code at `ba3ad56f64a4190fd8f5096d93348e94c0d651b7` on `ramez/rorp/product-page-components`.

The control was an Inertia baseline. The experiment was an earlier RORP Product implementation. The report did not save immutable Git SHAs for the running servers, so their exact commits cannot be verified from this run. The run ID is `2026-09-17T13:21:25.405Z`.

| Profile-layout Product load | Inertia median FCP | RORP median FCP |
| --------------------------- | -----------------: | --------------: |
| Cold desktop                |            14.34 s |          2.82 s |
| Cold phone                  |            15.58 s |          2.36 s |
| Warm desktop                |             728 ms |          349 ms |
| Warm phone                  |             721 ms |          334 ms |

Each case has 18 measurements per side. The cold desktop and phone article screenshots had zero differing pixels. The report did not capture warm screenshots. It also reported changed accessibility findings, and the run did not save time-aligned memory or swap data. A new Inertia-versus-RORP comparison on the final #96 head is still needed before using these timing estimates for that code.

Open the [self-contained report](self-contained-performance-report.html) locally for the interactive comparison. The [measurement snapshot](latest-results.json) holds extracted samples and source hashes, and the [readable summary](latest-results.md) gives the paired estimates. The `screenshots` folder contains the cold Product article captures extracted from that report.
