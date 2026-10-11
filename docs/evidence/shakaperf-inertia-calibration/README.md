# Inertia landing calibration

This current-source local A/A campaign completed **18 simultaneous pairs per viewport** and retained a **failed regression verdict**. Phone LCP has a significant native paired regression of +16ms (95% [8,33]ms,p=.000145). Both FCP rows and desktop LCP are nonsignificant. The native comparison exits1 because phone regressions exceed its configured absolute timing threshold. No application optimization is intended. An A/A regression does not establish an application cause; this integration remains blocked pending assessment. Passing proves neither a speedup nor equivalence.

Control is complete upstream `921e1d56e1685084b66cb4a532439e4b3069de4c`; experiment is clean `2d64b4db280d88f46b7b424916b485eb2dde0298`. Both used fresh detached snapshots, independent locked builds/services/data and the same explicit environment. [Provenance](provenance.json) preserves the five captured executable/configuration hashes, source SHAs, diff digest, actual selected native tools/versions, source/binary identity and runtime/load. Source SHAs identify content; Git rendering options can still change digest bytes. Later exports/documentation leave measured inputs unchanged. Reproduce with `bin/shakaperf-local`; see [setup](../../shakaperf.md).

ShakaPerf0.3.1/shared0.3.0, Playwright/core1.58.2 and Lighthouse13.4.1 are locked. Performance browser identity, Chromium visual browser revision and observed matching container image IDs are retained in supplementary provenance. The launcher records its core source/build manifest; browser binary, host/Docker resource and container observations, artifact hashes and stage summaries were added during evidence curation. Full browser installations, remote image availability and live Stripe assets are not archived. Rails is development mode with prebuilt Vite assets and one synthetic product. Cold cache,200ms request latency,2700kbit/s throughput,3x CPU slowdown,parallelism1,retries0 and p=.05 are unchanged. The configured estimator timing threshold is **5ms**, not5%; prior prose was wrong. Native transfer/score/other-unit thresholds are1KiB/1per100/0.5; CLS has its own5per100/quality-boundary rule. Configuration and native statistics remain unchanged.

## Statistical evidence

Native paired Wilcoxon/Hodges–Lehmann inference uses18 finite samples per side; negative means lower experiment time/transfer. Descriptive group median differences do not replace the native paired estimate. Displayed rounding is preserved; raw time phases encodeµs under an ms label, while report times arems. Transfer isKiB despite a nativeKB label. Rounded zero endpoints do not establish equality.

| Viewport / metric | Control → experiment median | Native paired estimate | Native95% interval | p |
| --- | --- | --- | --- | --- |
| Desktop FCP | 2034 → 2035ms | -5ms (-0.27%) | [-29ms, 14ms] rounded; [-1.43,0.67]% | 0.4683 |
| Desktop LCP | 12725 → 12714ms | -9ms (-0.07%) | [-23ms, 0ms] rounded; [-0.18,0]% | 0.05386 |
| Desktop transfer | 3915.6 → 3931.3KiB | 0KiB (0%) | [0KiB, 0.1KiB] rounded; [0,0]% | 0.4589 |
| Phone FCP | 2051 → 2073ms | -2ms (-0.11%) | [-16ms, 20ms] rounded; [-0.78,0.95]% | 0.4951 |
| Phone LCP | 12719 → 12752ms | 16ms (0.12%) | [8ms, 33ms] rounded; [0.07,0.26]% | 0.000145 |
| Phone transfer | 3930.9 → 3930.9KiB | 0KiB (0%) | [-1.1KiB, 0KiB] rounded; [-0.03,0]% | 0.1839 |

Native overall flags: **desktop: 17 metrics, areResultsSignificant=true, isBelowRegressionThreshold=true; phone: 17 metrics, areResultsSignificant=true, isBelowRegressionThreshold=false**. The primary/supporting rows above are not the whole verdict. Every significant secondary row follows; no metric is suppressed or retrospectively adjusted. These are exploratory results within34 metric/viewport comparisons at the unchanged per-metric threshold, without a causal or production claim.

Every stage kind isok and meta.errors=[], yet native aggregate phone isBelowRegressionThreshold=false and the CLI exits1. Phone speed-index +15ms and TBT +6ms accompany primary LCP +16ms; desktop speed-index −11ms is significant. This is a completed measurement with a failed verdict. The cause is unresolved; no score-triggered rerun or threshold change follows.

| Significant secondary metric | Control → experiment median | Native paired estimate | Native95% interval | p |
| --- | --- | --- | --- | --- |
| Desktop speed-index | 12578 → 12571ms | -11ms (-0.09%) | [-23ms, -1ms] rounded; [-0.18,-0.01]% | 0.02629 |
| Phone speed-index | 12248 → 12279ms | 15ms (0.12%) | [7ms, 35ms] rounded; [0.06,0.29]% | 0.001086 |
| Phone TBT | 133 → 140ms | 6ms (4.21%) | [3ms, 9ms] rounded; [2.29,6.7]% | 0.0004196 |

| Viewport / metric | Control descriptive range | Experiment descriptive range |
| --- | --- | --- |
| Desktop FCP | 1969.163–2128.461ms | 1990.320–2128.899ms |
| Desktop LCP | 12617.381–13873.708ms | 12610.174–13840.794ms |
| Desktop transfer | 3913.3242–3959.1885KiB | 3914.0752–3959.1621KiB |
| Phone FCP | 2017.352–2178.163ms | 2014.926–2188.902ms |
| Phone LCP | 12638.287–13065.544ms | 12632.330–13166.848ms |
| Phone transfer | 3914.0137–3961.3691KiB | 3913.9990–3959.1875KiB |

Read complete native [desktop](desktop-report.json)/[phone](phone-report.json) statistics and all [desktop](desktop-ab-measurements.json)/[phone](phone-ab-measurements.json) samples. The empty top-level compare summaries supply no estimates. Empty raw metadata and zero duration fields supply no pairing identity: [timing lines](pair-timing.json) retain indices0–17, both group identities and navigation timestamps. Original numerical artifact SHA256 values survive; numerical exports preserve every native number.

Pair identity inspection: exactly18 unique navigation pairs per viewport, both roles once per index; desktop maximum observed navigation skew 1ms; phone maximum observed navigation skew 1ms. Simultaneous dispatch does not guarantee equal resource interference.

## Seven-question review

| Question | Assessment and consequence |
| --- | --- |
| Limiter | Partly supported. Separate single-pair [diagnostics](diagnostics.json) show4.02MB transfer/0.88s main-thread and 4.02MB transfer/0.83s main-thread. Upstream [vendor chunk configuration](https://github.com/antiwork/gumroad/blob/921e1d56e1685084b66cb4a532439e4b3069de4c/config/vite/manual-chunks.ts) and the request chain suggest substantial cold-transfer cost. Competing load and generator saturation were not isolated; no causal limiter. |
| Production tuning | Missing production parity. Fresh sources/builds and matching local services are recorded, but development middleware, synthetic data, simulation and shared load limit generalization. Native device/UA settings survive in diagnostics; viewport labels alone do not prove real-device fidelity. |
| Physical plausibility | Supported narrowly. Desktop diagnostic4024558 bytes at2700kbit/s implies nominal11.92s serialization, compatible with12.79s diagnostic LCP. Overlap, overhead and contention are unknown; never sum nested costs or use one diagnostic pair for an effect estimate. |
| Errors | Counted local work supported; global success incomplete. [Work counts](work-counts.json) retain84 contexts/9400 attempted/9400 HTTP-success/9400 completed local requests,0 counted local errors/0 uncaught page errors,87 CSP console errors/2 other console errors.84 Google requests were identically excluded. External work is outside that local denominator; passing accessibility contains existing critical findings. |
| Reproducibility | Supported with limits. Source/build/tool/native identity,18 complete pairs, effective thresholds/settings, commands, host load and all artifacts survive. Supplemental observations are explicitly distinguished from generated launcher fields. Full Chrome installation and live third-party assets are not pinned/archived; workload reproduction does not guarantee identical timing. |
| User relevance | Supported narrowly. Existing product content, Inertia identity and local checkout-link destination are asserted in desktop/phone viewports. Initial FCP/LCP are relevant paints, not full checkout or purchase latency. One synthetic cold landing, UA limits and shared simulated resources do not establish production user experience. |
| Timed work | Paint boundary supported; full external completeness missing. Timing logs retain paired navigation/collection. Real JSON terminal success, content/link/Inertia checks and awaited image/font/DOM/network settling prove intended local landing work. FCP/LCP remain navigation-relative paint times, not assertion duration. Local completion cannot certify later/third-party work. |

Control diagnostic network observations: desktop:119 entries/6 Stripe requests/290571 Stripe bytes, statuses{200 => 118, 204 => 1}; phone:119 entries/6 Stripe requests/289692 Stripe bytes, statuses{200 => 118, 204 => 1}. These single pairs do not establish external success across all statistical samples. Diagnostic profiles explain possible costs and supply no statistical effect estimate. Other console errors remain in work-counts.json rather than being discarded.

Actual diagnostic device identities: desktop: formFactor=desktop, screen={"mobile":false,"width":1280,"height":800,"deviceScaleFactor":1,"disabled":false}, networkUserAgent=Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36; phone: formFactor=mobile, screen={"mobile":true,"width":375,"height":667,"deviceScaleFactor":3,"disabled":false}, networkUserAgent=Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36. A mobile network UA with desktop screen/formFactor limits device fidelity; the viewport label alone cannot establish a desktop browser workload. These native settings remain unchanged.

## Behavior and visual evidence

[Native visual/accessibility evidence](behavior-visual-accessibility.json) retains actual article comparison results and findings. Both-side desktop/phone crops and an existing-functionality video are attached as GitHub PR assets. Article crops omit the rest of the page. Manual checks reached the checkout-link destination without a purchase. Passing does not mean an accessible page; the actual critical/moderate rule IDs and node counts are retained.

Visual results: desktop: 0 differing pixels, 0% mismatch, savedByRetries=false; phone: 0 differing pixels, 0% mismatch, savedByRetries=false. Accessibility findings: desktop-control: aria-roles/critical/1 nodes, image-alt/critical/1 nodes, landmark-one-main/moderate/1 nodes, region/moderate/7 nodes; desktop-experiment: aria-roles/critical/1 nodes, image-alt/critical/1 nodes, landmark-one-main/moderate/1 nodes, region/moderate/7 nodes; phone-control: aria-roles/critical/1 nodes, image-alt/critical/1 nodes, landmark-one-main/moderate/1 nodes, region/moderate/7 nodes; phone-experiment: aria-roles/critical/1 nodes, image-alt/critical/1 nodes, landmark-one-main/moderate/1 nodes, region/moderate/7 nodes.

## Execution and history

Launcher2026-10-11T03:50:57Z–2026-10-11T04:15:35Z (24m38s), including fresh installs/builds/cleanup. Native compare1173945ms; launcher comparison/report/cleanup interval1178.000522s. Build/capture/wait time is separate from incremental checklist review and engineering/Shaka review.

Earlier completed captures remain separate. Attempt12 used an existing experiment workspace. Clean-source attempt14 retained nonsignificant FCP/LCP but significant opposite secondary TBT estimates: desktop−3ms,p=.03849,[−5,0]ms rounded; phone+3ms,p=.01387,[1,6]ms,18 pairs each. All17 metrics/viewport and true aggregate significance flags remain in [that immutable evidence](https://github.com/shakacode/gumroad/tree/e0784ab0d3ff65bf990357d74a7e3eeac8fa0ef0/docs/evidence/shakaperf-inertia-calibration). They were not discarded or pooled with this capture. Independent review required a terminal pending-response guard and explicit native tool selection; the rebuilt binary changed, so Shaka required this current-source campaign. An intervening lifecycle-suppression/native-addon failure completed zero statistical pairs. No favorable-result selection or protocol/threshold change.

The frozen optional lock has eight advisories, including two critical classifications. This owned loopback workload does not clear broader adoption. Recommend a short reading guide and specific numerical/stage-error/pair/settings/units/provenance checks under existing ShakaPerf [#36](https://github.com/shakacode/shakaperf/issues/36), [#68](https://github.com/shakacode/shakaperf/issues/68) and [#69](https://github.com/shakacode/shakaperf/issues/69). Defer broad adoption pending dependency review and complete external-work accounting. No new Shaka or CI gate is added.
