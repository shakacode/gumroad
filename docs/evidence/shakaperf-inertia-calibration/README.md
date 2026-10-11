# Inertia landing calibration

This retained capture passed every configured stage with **18 simultaneous pairs per viewport**. Native paired FCP/LCP differences were nonsignificant and their 95% intervals span zero. Secondary TBT results were significant in opposite directions, as disclosed below. This local A/A calibration has no intended application optimization. Passing proves neither a speedup nor equivalence. A subsequent terminal-response guard and explicit compiler selection require a fresh current-source campaign; these numbers remain evidence for their recorded source.

Control is complete upstream `921e1d56e1685084b66cb4a532439e4b3069de4c`. Experiment is clean commit `9307ea81bb2944c64c60aa57fdd8475e19e0cb10`, adding optional tooling and existing fork workflow wrappers. Both sides used detached clean snapshots, fresh locked dependency installs/builds and the same explicit environment. [Provenance](provenance.json) records five actual executable/configuration hashes, the source diff digest, native sampler sources/build tools, matching container image identities, runtime versions and host load. The two source SHAs identify content; user Git rendering settings can still change the diff digest. Compiler/response-guard corrections made afterward change two captured input files, so these measurements do not certify those repairs. Reproduce the current workload with `bin/shakaperf-local`; see [setup](../../shakaperf.md).

ShakaPerf 0.3.1, shared 0.3.0, Lighthouse 13.4.1 and Playwright/core 1.58.2 are locked. Performance used Chrome Canary 157.0.8097.0; visual checks used Chromium 145.0.7632.6/revision1208. The Chrome executable hash is recorded, but its full installation and live Stripe assets are not archived. Rails used development mode with prebuilt Vite assets and synthetic data. Settings: cold cache, 200ms request latency, 2700kbit/s throughput, 3x CPU slowdown, parallelism1, no retries, p=.05, 5% estimator regression threshold.

## Statistical evidence

Negative values mean lower experiment time/transfer. Native rounded Hodges–Lehmann estimates use paired differences; group median differences do not replace them. All rows have 18 finite samples per group and native paired Wilcoxon inference.

| Viewport / metric | Control → experiment median | Paired estimate | Native 95% interval | p |
| --- | --- | --- | --- | --- |
| Desktop FCP | 2054 → 2046ms | −6ms (−.29%) | [−36,26]ms; [−1.75,1.24]% | .6705 |
| Desktop LCP | 12709 → 12708ms | −1ms (−.01%) | [−17,15]ms; [−.14,.12]% | .8986 |
| Desktop transfer | 3929.4 → 3929.3KiB | 0KiB | [0,0]KiB, rounded | .6317 |
| Phone FCP | 2053 → 2037ms | −17ms (−.85%) | [−41,8]ms; [−1.97,.39]% | .154 |
| Phone LCP | 12664 → 12667ms | −6ms (−.04%) | [−19,7]ms; [−.15,.06]% | .4423 |
| Phone transfer | 3914 → 3914KiB | 0KiB | [0,.1]KiB, rounded | .107 |

Both native reports have `areResultsSignificant:true` and `isBelowRegressionThreshold:true`. All17 metrics per viewport remain in the linked native reports; the predeclared primary FCP/LCP and supporting transfer rows above are not the whole verdict. Secondary TBT is the only significant metric in each viewport:

| Secondary metric | Control → experiment median | Paired estimate | Native95% interval | p |
| --- | --- | --- | --- | --- |
| Desktop TBT | 144 → 141ms | −3ms (−1.82%) | [−5,0]ms rounded; [−3.64,−.04]% | .03849 |
| Phone TBT | 143 → 148ms | +3ms (+2.05%) | [1,6]ms; [.48,3.91]% | .01387 |

These opposite, small secondary estimates are exploratory within34 metric/viewport comparisons at the unchanged per-metric p=.05 threshold. They do not establish a coherent improvement, causality or production benefit. Rounded zero endpoints do not replace the unrounded interval or significance flag. No adjustment or threshold change is applied retrospectively.

| Viewport / metric | Control descriptive range | Experiment descriptive range |
| --- | --- | --- |
| Desktop FCP | 1992.728–2126.942ms | 1985.641–2106.745ms |
| Desktop LCP | 12623.398–12789.583ms | 12624.083–12820.027ms |
| Desktop transfer | 3913.6494–3930.4590KiB | 3913.6670–3930.4473KiB |
| Phone FCP | 1994.607–2125.609ms | 1995.421–2084.592ms |
| Phone LCP | 12609.754–12789.143ms | 12630.756–12781.337ms |
| Phone transfer | 3913.5908–3915.2285KiB | 3913.5801–3915.2490KiB |

Read native [desktop](desktop-report.json)/[phone](phone-report.json) statistics and all [desktop](desktop-ab-measurements.json)/[phone](phone-ab-measurements.json) samples. Raw phases encode microseconds under an `ms` label; divide by1000 for milliseconds. Transfer is bytes/1024 despite the native `KB` label. Rounded zero intervals do not establish exact equality. Empty sample metadata and zero duration fields supply no pairing identity: [timing lines](pair-timing.json) preserve indices0–17 and paired navigation. Maximum observed launch skew was1ms desktop and0ms phone. Empty top-level stage summaries supply no estimates. Original numerical artifact SHA256 values survive in provenance.

## Seven-question review

| Question | Assessment and consequence |
| --- | --- |
| Limiter | Partly supported. Separate single-pair [diagnostics](diagnostics.json) show4.02/4.05MB transfer and~.91/.86s main-thread work. The upstream [vendor chunk configuration](https://github.com/antiwork/gumroad/blob/921e1d56e1685084b66cb4a532439e4b3069de4c/config/vite/manual-chunks.ts) and request chain suggest substantial cold-transfer cost. Shared contention and generator saturation were not isolated; no causal limiter established. |
| Production tuning | Missing production parity. Both local sources/builds/services match. Development middleware, synthetic data, simulation and shared host limit generalization. Native diagnostic settings identify desktop1280×800/mobile=false and phone375×667/mobile=true, but both report a mobile network user agent. Viewport labels therefore do not prove complete real-device fidelity. |
| Physical plausibility | Supported narrowly. Desktop diagnostic4,024,602 bytes at2700kbit/s gives nominal11.92s serialization, compatible with12.76s diagnostic LCP. Overlap, protocol overhead and contention are unknown; never add nested costs or estimate effects from the single diagnostic pair. No changed component saving is claimed. |
| Errors | Counted local work supported; global success incomplete. [Work counts](work-counts.json) retain84 contexts and9400 attempted/HTTP-success/body-completed local requests, zero counted local HTTP/request failures and zero uncaught page errors.86 CSP console errors remain; no other console error was recorded in this capture.84 Google requests were identically excluded. Live third-party work remains outside the local denominator. Passing accessibility comparison contains equal critical violations. |
| Reproducibility | Supported with limits. Clean source/build identity, locked tool/native sources,18 finite pairs, effective settings, commands, machine load and native artifacts survive. Full Chrome installation, live Stripe content and Docker image availability are not guaranteed. Reproducing the workload does not guarantee identical timing. |
| User relevance | Supported narrowly. Existing Inertia product content and checkout-link destination are checked at both viewports. Initial FCP/LCP are user-relevant paint metrics; one synthetic cold landing and the recorded user-agent mismatch cannot establish real desktop/phone or production transaction latency. No purchase or full checkout was exercised. |
| Timed work | Paint boundary supported; full external completion missing. Timing logs retain each paired navigation/collection. Content/link/Inertia assertions and the real product-view JSON success marker check intended landing work. Images/fonts/DOM/network settling hold collection open. FCP/LCP remain navigation-relative paint times, not assertion or checkout durations. Local completion at the assertion boundary cannot certify late or third-party work. |

The two control diagnostic network audits each contain119 entries:112 local200 responses, one excluded Google204 response and six live Stripe200 responses. Stripe contributes290619/318362 bytes and a late request chain. Those single-pair observations cannot certify external success for all statistical samples. Both mobile network-user-agent strings are retained alongside the actual form factor and screen settings. Diagnostic profiles explain possible costs; they supply no statistical effect estimate.

## Behavior and visual evidence

[Visual/accessibility evidence](behavior-visual-accessibility.json) records zero differing article pixels and no retries. Original control/experiment desktop/phone crops and an existing-functionality video are attached to the PR through GitHub assets. Manual checks verified the local checkout destination without a purchase; article crops omit the rest of the page. Development Bullet warnings remain visible. Each side has critical `aria-roles`/`image-alt` findings (one node each), moderate `landmark-one-main` (one) and `region` (seven). Passing does not mean an accessible page.

## Execution and history

Corrected launcher:2026-10-11T03:09:06Z–03:32:11Z (23m05s), including fresh installations/builds and cleanup. Native compare:1165927ms (19m25.927s), generated03:32:08.247Z; launcher comparison interval1170.121307s includes report/cleanup overhead. Measurement/build/wait time is separate from checklist review.

The earlier completed capture used an existing experiment workspace and is retained as historical evidence. Independent review required clean source parity and an independent assertion for analytics responses whose errors the application catches. An intervening attempt failed before any statistical pair because lifecycle-script suppression omitted the mandatory sampler addon. The corrected launcher explicitly compiles inspected pinned native sources and preflights both descriptors while leaving other lifecycle scripts disabled. This campaign verifies those functional repairs, with unchanged sampling/statistics; it was not selected for favorable estimates. Captures are not pooled. Later evidence-only edits require no new campaign.

The frozen optional lock has eight advisories, including two critical classifications. The bounded local command does not clear broader adoption; see the setup guide's input/reachability limits. Recommend a short evidence-reading guide and specific artifact/error-work checks under existing ShakaPerf [#36](https://github.com/shakacode/shakaperf/issues/36), [#68](https://github.com/shakacode/shakaperf/issues/68) and [#69](https://github.com/shakacode/shakaperf/issues/69). Broader adoption awaits a separate dependency refresh and complete external-work accounting. No new verification gate is added.
