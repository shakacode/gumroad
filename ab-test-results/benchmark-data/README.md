# Product page article data and graphs

The article is `ab-test-results/index.md`. Its main comparison uses the
September 17 Product run, not the current top commit. The original case
directories were overwritten by later ShakaPerf runs. The saved
`latest-results.json` has the extracted samples, estimates, user agents, and
SHA-256 hashes of the source files. The two saved Lighthouse reports and the
diagnostic replay are from that run.

From the Gumroad repository root, regenerate all five graphs from the saved
measurement snapshot and replay:

```sh
node ab-test-results/benchmark-data/build-buyer-ab-results.mjs --snapshot-only
node ab-test-results/benchmark-data/timeline-replay/build.mjs --snapshot-only
```

The snapshot option checks the stored run ID, sample counts, and replay frame
counts. It does not recheck the original input hashes because those source
files are no longer present. If the September 17 case directories are restored,
run the extractor first, then run both graph builders without the snapshot
option. That path checks all input hashes against the source files.

The scripts select four profile-layout Product landings: cold and warm on
Desktop and Mobile, with 18 measurements per side. Sticky add-to-cart is
excluded. The replay is one diagnostic Mobile load, not the 18-pair result.
The chart builder generates the paint, cost, and FCP-range graphs from the
saved measurements. The replay builder generates the filmstrip and FCP/LCP
timeline from its saved frames. Green is the RORP series in all five graphs.

The meeting proposal included URL-parameter switching on one server. The
current route selects the RSC response by seller feature flag (and profile
layout); this article does not claim a separate override parameter exists.
The older Inertia SSR TTI/video observation is historical context, not a
measurement from this run, so the article does not claim a new TTI result.

The September 17 report did not embed immutable at-run Git identities.
Preserved container files matched an earlier Inertia baseline and an earlier
RORP Product implementation. That RORP implementation did not include the
final React-owned Product cover preloads. The article makes no claim that its
large Inertia-versus-RORP estimates apply to the final stack.

No time-aligned memory or swap telemetry was saved for the selected run. The
source report also has accessibility finding changes that need review. The
article states both limits. The later RORP-versus-RORP checks are summarized
in `later-checks.md` with their saved report summaries.
