# Product-page article regeneration

The article source is `ab-test-results/index.md` from
`codex/rorp-cpln-baseline` (tip `ef3e4a7676e2bec00004ccf96ab3f5b91f083daf`,
article blob `ea1c0c28b9f2bb828cbd07e9be682c68066b10c9`). The article
and tracked assets on this branch happen to have the same Git blobs as those
on `ramez/cpln/rorp-baseline`; the requested branch is nevertheless the
reference for this revision.
This product-only revision keeps its section order, clearer titles, replay-first
presentation, measurement detail, and closing takeaway. It replaces every
retained result visual with a graph from the selected Product run.
The two scripts here adapt the sibling article's
`benchmark-data/extract-latest-results.mjs` and
`benchmark-data/build-buyer-ab-results.mjs` to the September 17 Product run.
The replay builder adapts the sibling article's
`benchmark-data/timeline-replay/build.mjs`. The sibling article and its
existing scripts were not changed.

From the Gumroad repository root, regenerate the data and all retained graphs:

```sh
node ab-test-results/benchmark-data/extract-latest-results.mjs
node ab-test-results/benchmark-data/build-buyer-ab-results.mjs
node ab-test-results/benchmark-data/timeline-replay/build.mjs
```

The extractor accepts an optional source directory and output directory. The
chart script accepts an optional source directory and image directory. By
default, both read `compare-results` and write under `ab-test-results`.

The scripts select exactly four cases: cold and warm profile-layout Product
landings on Desktop and Mobile. They assert 18 measurements per side, matching
run IDs, aligned viewport user agents, and the cold visual results. The chart
script verifies every source hash recorded by the extractor before writing SVGs.
The sticky add-to-cart case from the same run is deliberately excluded.
The replay uses one low-noise Mobile diagnostic load from the selected cold
case. It verifies the target navigation, shared throttling, Lighthouse/trace
time origin, source hashes, and that the original timeline was not changed.
The same replay builder generates the four-moment filmstrip and FCP/LCP timeline
SVGs. These diagnostic visuals must not be treated as the 18-pair performance
result. The other script generates the paint, cost, and split-scale FCP-range
charts from all four selected cases. Green is the experiment series throughout.

The meeting proposal included URL-parameter switching on one server. The
current route selects the RSC response by seller feature flag (and profile
layout); this article does not claim a separate override parameter exists.
The older Inertia SSR TTI/video observation is historical context, not a
measurement from this run, so the article does not claim a new TTI result.

The report was generated at `2026-09-17T13:47:16.128Z`. The current source
checkouts at article preparation time were `a689ac7ec5fe5b708efe4ddff5388e72fc4ce06d`
for control and `97d21db7ebf8cfb50264f7a1af2380d81b730e59` for experiment.
Their exact at-run identities were not embedded in the ShakaPerf report, so
these checkout observations should not be treated as an immutable run manifest.
Current HTTP responses show `Products/Profile/Show` for control and
`product-rsc-root` for experiment.

No time-aligned memory/swap telemetry was saved for the selected run. It is
not certified against the previously specified swap gate. Also, the source
report has accessibility finding changes that need separate review. The
article states both limitations; its numerical results are the measured
snapshot, not a claim of clean final validation.
