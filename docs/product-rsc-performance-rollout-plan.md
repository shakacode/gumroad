# Product page RSC performance and rollout plan

## Objective

Measure the product-page RSC migration against an immutable Inertia control, attribute regressions to the browser, Rails, renderer, database, or network, and roll it out only when correctness and capacity are demonstrated.

This work starts during discovery, becomes a release gate on `ramezweissa/product-rsc-validation`, and continues after the migration stack as isolated optimization and rollout branches.

The implementation sequence is defined in [Product page RSC migration roadmap](product-rsc-migration-roadmap.md). Functional gates are defined in [Product page RSC verification plan](product-rsc-verification-plan.md).

## Comparison contract

### Control

- Revision: `fb39dbe24b3f632d96aa0b7b5e3d3e778fd9796a`
- Renderer: existing ordinary Discover/Inertia product page
- Selection: the normal Discover URL without `rsc=1`

### Experiment

- Revision: the tip of `ramezweissa/product-rsc-validation`
- Renderer: final product RSC tree with no product-path Inertia dependency
- Selection: the RSC route or rollout flag used by the final implementation

The older `df09b435c974084b71b6f56c27d1efe1e4b398b7` comparison reference is obsolete for this plan.

### Required equivalence

Control and experiment must use:

- the same production build mode;
- the same application code except for the branch under comparison;
- the same deterministic database records and presenter inputs;
- the same assets, host behavior, viewport, browser, throttling, and cache state;
- the same Rails, renderer, proxy, and database topology unless topology itself is the measured change;
- matching warmup and sample order;
- no external service variance in the critical path.

Run control and experiment from separate processes or containers. Do not alternate source files in one running process. Record image digests, revisions, ports, environment variables that change behavior, Node/Ruby/browser versions, and benchmark-tool version.

## Harness location

Keep the reusable benchmark runner outside the Gumroad application unless a small application-side fixture or metric endpoint is necessary. ShakaPerf is suitable when available because it supports paired production-twin comparisons and preserves Lighthouse, low-noise, network, visual, and accessibility artifacts.

Do not copy the demo application or its synthetic dashboard fixture into Gumroad. Reuse its measurement pattern:

- paired control and experiment;
- deterministic data;
- ten or more paired samples for noisy metrics;
- a serial low-noise capture for network attribution;
- separate desktop/mobile visual and axe comparisons;
- functional assertions embedded in each scenario.

The earlier demo results are method guidance, not a Gumroad performance baseline. That fixture improved FCP/LCP and request count but regressed TTFB and JavaScript bytes; Gumroad must measure its real product graph before accepting the same tradeoff.

## Deterministic product fixtures

Create or select products that exercise the real presenter and component graph. The control and experiment must refer to the same records.

Minimum fixture set:

1. **Typical digital product** — representative cover, description, price, seller styling, and CTA.
2. **Configuration-heavy product** — applicable variants/tiers, quantity or recurrence choices, and price changes.
3. **Content-heavy product** — large rich content and realistic media/navigation data to expose serialization and stream behavior.
4. **Cart/checkout product** — deterministic eligibility and a safe test-mode checkout handoff.
5. **Unavailable/error product** — sold-out, ineligible, or invalid-offer state that exercises the error UI without an external failure.

Prefer factories or a repeatable seed command that invokes existing presenters and Rails rules. Store identifiers and fixture-generation revision in the artifact summary. Do not use production buyer data or secrets.

## Benchmark scenarios

### P0: initial typical product load

Start from a clean browser context and navigate directly to the product URL.

Assertions:

- correct renderer;
- product identity, price, and CTA visible;
- initial document contains server-rendered product content;
- hydration completes without console errors;
- one document navigation and no duplicate initial Flight request.

### P1: initial content-heavy product load

Use the content-heavy fixture to expose Flight size, serialization time, streaming order, and media scheduling.

Assertions:

- content parity;
- useful shell/content arrives before non-critical suspended work;
- no duplicated product payload;
- images and fonts do not introduce a new CLS regression.

### P2: configuration interaction

Load the configuration-heavy product and choose an option that changes displayed state or price.

Assertions:

- no document reload;
- selected state and price are correct;
- no unnecessary Flight navigation for purely local interaction;
- long-task and interaction timing are captured.

### P3: cart and checkout handoff

Add the configured product to cart and continue to the existing checkout boundary.

Assertions:

- mutation occurs once;
- submitted identifiers match the selected authoritative configuration;
- cart state and destination are correct;
- no duplicate analytics or mutation request;
- failure status is surfaced when the error fixture is used.

### P4: navigation and history

Exercise a product-owned link or RSC subtree navigation selected by the final architecture, then use back and forward.

Assertions:

- correct history entries;
- shell identity is preserved only when the architecture promises it;
- focus and scroll behavior are correct;
- a late first response cannot replace the newer destination.

### P5: warm repeat view

Repeat P0 with browser caches warm and the renderer prewarmed.

Assertions:

- cache state is recorded;
- no correctness changes from reuse;
- client chunk and Flight cache behavior is attributable.

Cold and warm results must be reported separately.

## Metrics

### User-visible browser metrics

- TTFB from Navigation Timing and Lighthouse;
- FCP and LCP;
- CLS;
- INP for interactive runs when the harness supports field-style event timing;
- Total Blocking Time and main-thread long tasks for lab attribution;
- time to visible product identity and time to enabled CTA;
- configuration interaction latency;
- cart mutation and checkout-navigation latency.

### Network and payload metrics

- total transferred and uncompressed bytes;
- JavaScript bytes and request count;
- CSS, font, image, document, and Flight bytes separately;
- total requests;
- Flight request count and bytes;
- embedded initial Flight bytes;
- request start/finish ordering;
- cache hits and misses;
- duplicate URLs or materially duplicated serialized fields.

### Rails and renderer metrics

- controller and presenter duration;
- time to renderer request, first renderer byte, first client byte, and stream completion;
- Node renderer queue time and render duration;
- renderer errors, disconnects, and restarts;
- Active Record checkout duration and pool occupancy during streams;
- SQL query count, total SQL time, and duplicate-query count;
- Rails and renderer CPU and RSS under steady concurrency.

### Quality metrics

- functional assertion failures;
- console and server errors;
- visual difference percentage with documented masks;
- new, changed, fixed, or blocked accessibility findings;
- product RSC browser bundle composition;
- browser client-reference count;
- presence of forbidden Inertia or server-only modules;
- presence of an Inertia root, serialized page, or runtime bootstrap in the final HTML.

## Sampling and statistics

- Warm both control and experiment before collecting samples.
- Randomize or interleave paired sample order when the tool supports it.
- Collect at least ten paired Lighthouse samples per scenario; increase the count when variance prevents attribution.
- Preserve medians, paired deltas, confidence information or p-values, and individual samples.
- Run a serial low-noise capture after the paired samples for request attribution.
- Do not combine initial-load and interaction timing into one unlabeled number.
- Do not compare a cold control with a warm experiment.
- Treat a statistically significant small regression and a large noisy regression as investigation triggers; neither is automatically harmless.

## Initial release gates

Ratify these thresholds before checkpoint 7 begins. Changing a gate after results are visible requires a written reason and owner.

| Gate                        | Initial threshold                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Functional assertions       | Zero failures                                                                            |
| New accessibility findings  | Zero                                                                                     |
| Stable-region visual change | Zero unexplained pixels                                                                  |
| CLS                         | No material regression and remains at or below 0.1                                       |
| FCP/LCP                     | No statistically supported regression greater than 5%                                    |
| TTFB                        | No statistically supported regression greater than the larger of 10% or 20 ms            |
| Time to enabled CTA         | No statistically supported regression greater than 5%                                    |
| Configuration interaction   | No regression large enough to cross the 100 ms lab target                                |
| Total transferred bytes     | No unexplained increase greater than 5%                                                  |
| JavaScript transferred      | Must not increase unless an owner accepts a measured user-visible or operational benefit |
| Initial Flight requests     | No duplicate initial payload request                                                     |
| Product-path Inertia        | Absent from import traversal and production bundle                                       |
| Rails SQL                   | No unexplained query-count or total-query-time regression greater than 10%               |
| Renderer errors             | Zero during the benchmark                                                                |

These are migration gates, not universal product SLOs. Production rollout additionally uses live error, latency, and resource thresholds derived from the pre-canary baseline.

## Attribution procedure

When a gate fails, identify the layer before changing code:

| Symptom                         | First evidence to inspect                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Higher TTFB                     | Rails/presenter duration, renderer queue, renderer first-byte time, connection release timing          |
| Higher FCP/LCP with stable TTFB | request waterfall, CSS/fonts, client bootstrap, LCP resource priority, stream chunk timing             |
| More JavaScript                 | client-reference graph, shared providers, accidental client boundaries, duplicated runtime chunks      |
| Larger Flight payload           | serialized props by section, repeated global data, client-boundary placement                           |
| More requests                   | duplicate initial payload, post-hydration Suspense request, chunk fragmentation, analytics duplication |
| Slow interaction                | island render scope, state propagation, long tasks, mutation/network duration                          |
| Higher SQL cost                 | presenter duplication, per-section reloads, suspended work causing repeated queries                    |
| Renderer resource growth        | queueing, cache retention, stream lifetime, concurrency, leaked work after disconnect                  |

Change one attributed cause per optimization branch and rerun the affected scenarios plus P0.

## Artifact contract

Store a compact checked-in summary under a dated `docs/performance-artifacts/product-rsc-<date>/` directory only when the evidence is ready for review. Large raw captures may live in the benchmark tool’s artifact storage or an attached archive.

The summary must include:

- capture timestamp and timezone;
- control and experiment revisions;
- commands and tool/browser versions;
- environment and fixture identifiers;
- sample count and cache mode;
- scenario assertions;
- medians, paired deltas, and statistical result;
- gate disposition;
- visual and accessibility summary;
- links or paths to raw network, trace, screenshot, and report artifacts;
- bounded conclusions and known limitations.

Do not report Lighthouse navigation scenarios as isolated interaction timing when they include the initial document load.

## Follow-up branches after validation

Create only the branches justified by measured evidence. Keep them stacked on the accepted validation revision or independently based on it when they can be reviewed in parallel.

### A. Observability and guarded rollout

Branch: `ramezweissa/product-rsc-rollout-observability`

- expose selection in logs/traces so RSC and control requests are distinguishable;
- record Rails, renderer, stream, Flight, error, and resource metrics;
- define dashboards and alerts before serving real traffic;
- retain an immediate server-side rollback switch;
- avoid high-cardinality product or buyer labels.

### B. Renderer capacity test

Branch: `ramezweissa/product-rsc-renderer-capacity`

- load-test representative product mixes at expected concurrency;
- measure queue time, throughput, CPU, RSS, stream duration, disconnect cleanup, and error rate;
- test renderer restart and Rails behavior when the renderer is unavailable;
- define instance sizing, concurrency, timeout, and autoscaling inputs.

Capacity tests use synthetic/test data and an isolated environment. They do not send purchases or mutate production records.

### C. Canary rollout

Branch: `ramezweissa/product-rsc-canary`

- enable a small deterministic cohort with a matched control;
- compare error rate, p50/p75/p95 latency, conversion-funnel integrity, cart/checkout failures, renderer saturation, and client vitals;
- run long enough to cover normal traffic variation;
- exercise rollback during the canary rather than assuming it works.

Increase exposure only when the observation window passes its predefined gates.

### D. Attributed optimization branches

Potential branches, created only when their metric fails or opportunity is material:

- `ramezweissa/product-rsc-flight-payload` — remove duplicated or over-broad serialization;
- `ramezweissa/product-rsc-client-bundle` — shrink client islands and shared client dependencies;
- `ramezweissa/product-rsc-stream-waterfalls` — move eligible initial work into the original stream;
- `ramezweissa/product-rsc-rails-queries` — remove duplicated presenter or SQL work;
- `ramezweissa/product-rsc-renderer-latency` — improve warmup, pooling, or queueing;
- `ramezweissa/product-rsc-navigation-prefetch` — add measured prefetch without stale-response or bandwidth regressions.

Each branch carries a before/after benchmark for its target metric and reruns correctness coverage for the changed behavior.

### E. Default rollout and control retirement

Branch: `ramezweissa/product-rsc-default`

- make RSC the default only after canary gates pass;
- keep the control/rollback path during a defined observation window;
- compare live cohorts after defaulting;
- remove the opt-in parameter and obsolete compatibility code only in a later reviewable cleanup;
- retain a documented operational rollback even after code cleanup where practical.

## Decision record

The validation and rollout reports end with one of four decisions:

1. **Proceed** — all gates pass.
2. **Proceed with accepted regression** — the owner names the regression, evidence, compensating benefit, and monitoring condition.
3. **Optimize and repeat** — the regression is attributed and a bounded follow-up branch is defined.
4. **Rollback or pause** — correctness, capacity, or unexplained performance risk prevents rollout.

An average Lighthouse score alone cannot justify proceeding. The decision requires scenario-level correctness, browser metrics, server cost, bundle evidence, accessibility, and an operable rollback.
