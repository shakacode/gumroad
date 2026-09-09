# Discover: fewer image requests and named controls

## What and why

This Inertia comparison defers offscreen card images for anonymous buyers, names Discover carousel buttons, and gives category navigation a valid landmark. It measures resource use, checks screenshots, and records accessibility findings together.

## Results

Run `2026-09-09T21:48:50.397Z`, with 18 samples per side for each light-mode viewport. Transfer units are KiB; times are milliseconds. P-values are unadjusted for multiple comparisons. Chromium used DevTools throttling: 100 ms RTT, 2.7 Mbps down/up, 200 ms request latency, and 3× CPU slowdown. Desktop was 1280×800 at DPR 1; phone was 375×667 at DPR 3.

| Metric         | Desktop control → fixed       | Phone control → fixed         |
| -------------- | ----------------------------- | ----------------------------- |
| Total transfer | 1,576.2 → 1,462.7; p=0.000214 | 1,576.4 → 1,463.0; p=0.000214 |
| Requests       | 93 → 89; p=0.000125           | 93 → 89; p=0.000129           |
| FCP            | 8,042 → 7,711; p=0.1297       | 9,285 → 9,121; p=0.5226       |
| LCP            | 9,069 → 8,642; p=0.2121       | 10,799 → 10,481; p=0.04317    |
| JavaScript     | 911.4 → 912.9; p=0.0000247    | 911.4 → 912.9; p=0.0000247    |

Four fewer requests saved about 113.4–113.5 KiB overall. Separate low-noise traces show four fewer object-store image requests, saving 115.08 KiB before other transfer increases. Body hashes identify the images despite different storage URLs.

FCP and desktop LCP changes are not significant at 0.05. Phone LCP is nominally significant before adjustment. Do not treat this as a general page-speed claim.

**The comparison exited 1:** JavaScript grew about 1.5 KiB, with the same 62 script requests. The increase remains a measured tradeoff; its cause is not established. This is not an all-checks-passed result.

## Visual and accessibility evidence

All four viewport pairs have **zero differing pixels**, without retries. Dark-mode cases test visual appearance and accessibility only.

| Viewport       | Control                                                               | Fixed                                                                    |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Desktop, light | [Screenshot](../../qa-media/pr-55-discover-light-desktop-control.png) | [Screenshot](../../qa-media/pr-55-discover-light-desktop-experiment.png) |
| Phone, light   | [Screenshot](../../qa-media/pr-55-discover-light-phone-control.png)   | [Screenshot](../../qa-media/pr-55-discover-light-phone-experiment.png)   |
| Desktop, dark  | [Screenshot](../../qa-media/pr-55-discover-dark-desktop-control.png)  | [Screenshot](../../qa-media/pr-55-discover-dark-desktop-experiment.png)  |
| Phone, dark    | [Screenshot](../../qa-media/pr-55-discover-dark-phone-control.png)    | [Screenshot](../../qa-media/pr-55-discover-dark-phone-experiment.png)    |

Each pair removes one `aria-roles` finding and two `button-name` findings. Other rule/node findings remain unchanged. The page is not accessibility-clean.

[Watch the walkthrough](../../qa-media/pr-55-discover-walkthrough.mp4). [Read the evidence](evidence.json) or [download raw artifacts](evidence.zip).

## Source provenance

The served control app sources match `c8ec0c727b51b6a27d85ba0b904161583ba4dc2e`; fixed app sources match `c08deb5e58b6016cac253f38636489d672d4c620`. Image and running-volume hashes matched those commits. Mounted fixture/runtime files matched committed sources.

The measured harness is published at control `652b994c0b2510b004821b79d4cb6d9244bc42c1` and fixed `deab778216f7343569507ada7f97ebc8b782a7d6`. Relative to the image-source commits, only the showcase starting path/comment changed: `/software-development` supplies stable category recommendations. That harness edit does not change app behavior.

## Reproduce

Use Docker and ShakaPerf 0.2.4. Follow the [twin setup guide](../shakaperf-benchmark-twins.md). From the fixed worktree, create the control worktree at the measured harness commit:

```sh
git worktree add --detach ../gumroad-control 652b994c0b2510b004821b79d4cb6d9244bc42c1
export SHAKAPERF_CONTROL_DIR="$PWD/../gumroad-control"
export SHAKAPERF_CONTROL_PORT=3300 SHAKAPERF_EXPERIMENT_PORT=3400
export SHAKAPERF_CONTROL_S3_PORT=9200 SHAKAPERF_EXPERIMENT_S3_PORT=9201
shaka-perf servers
```

In a second terminal with the same environment:

```sh
shaka-perf compare --filter "Discover showcase"
```

The cases visit `http://control.localhost:3300/software-development` and `http://experiment.localhost:3400/software-development`. Open `compare-results/full-report.html`. Inspect requests, bytes, rule/node changes, and screenshots. Scroll to confirm deferred images appear.

This run recovered from local disk pressure by sharing built dependency layers, restoring the exact control source differences, and rebuilding assets. Search disk-watermark adjustments were limited to disposable demo services. These adaptations do not establish clean independent builds; source and runtime hashes establish the compared app versions. No full application suite was run.

Use this paired evidence format in contributions: record both source commits, command, viewport, throttle settings, visual differences, and remaining failures beside performance results.
