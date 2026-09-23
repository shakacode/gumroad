# Product page article data and graphs

The article is `ab-test-results/index.md`. Its main comparison uses the
September 23 Product run in `compare-results-sep23/full-report.html` and the
four cold/warm profile-layout case directories beside it. The generated
`latest-results.json` records the extracted samples, estimates, user agents,
accessibility summaries, and SHA-256 hashes of every source file used.

From the Gumroad repository root, regenerate the data, replay, and all five
graphs:

```sh
node ab-test-results/benchmark-data/extract-latest-results.mjs
node ab-test-results/benchmark-data/build-buyer-ab-results.mjs
node ab-test-results/benchmark-data/timeline-replay/build.mjs
```

The extractor checks the full report, run ID, selected artifact directories,
sample counts, paired statistics, viewport/user-agent alignment, cold visual
results, and accessibility summaries. The graph builder then checks every
recorded source hash before it writes the SVG files.

The scripts select four profile-layout Product landings: cold and warm on
Desktop and Mobile, with 20 measurements per side. Sticky add-to-cart is
excluded. The replay is one diagnostic Mobile load, not the 20-pair result.
The chart builder generates the paint, cost, and FCP-range graphs from all four
cases. The replay builder generates the filmstrip and FCP/LCP timeline from
the source traces. Green is the RORP series in all five graphs.

The meeting proposal included URL-parameter switching on one server. The
current route selects the RSC response by seller feature flag (and profile
layout); this article does not claim a separate override parameter exists.
The older Inertia SSR TTI/video observation is historical context, not a
measurement from this run, so the article does not claim a new TTI result.

The September 23 report does not embed immutable at-run Git identities. The
article therefore describes the measured behavior without claiming exact
source commits for the two running servers.

The report contains no time-aligned memory or swap telemetry. Its cold
accessibility comparisons have no new or fixed findings, but they classify 20
findings as changed on each viewport. The article states both limits.
