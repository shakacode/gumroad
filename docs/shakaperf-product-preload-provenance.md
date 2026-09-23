# Product image preload decision and benchmark provenance

## Decision: keep React-owned product image preloads

On September 23, we chose the React-owned implementation for the RORP Product
page. The current experiment revision, `6b32136ed4a0dbbb5b5d6e21416cb3a14eff6738`,
already contains it: `ProductCoverPreloads.tsx` calls `preload()` for the covers
other than the initial image, which React preloads from its rendered `<img>`.
`LinksController` removes the Rails image preload metadata from the RSC response.
Both sides of the comparison serve RORP with the seller feature enabled.
The React-owned approach first appeared earlier in history at `a43862ea7`.

This decision does not mean React won every metric. It preserves the earlier
browser finding that Inertia's first head update could remove Rails-owned
preloads and abort in-flight image requests. The corrected September 23 runs
also show a small, repeatable cold-phone LCP signal for React when the run is
stable, with no clear desktop or warm paint change.

The historical Product branch at `9cd4ef7f39aaf4f5278c4088f7ffabe0dd3cbc4f`
used Rails-owned hints after `a0e3f54dc7`. The Product portion of the rewritten
stack ends at `ramez/rorp/product-cutover`: React-owned preloads and Rails image-hint
suppression are present there, while the Rails-owned detour is absent from its
history. The rewritten Product component branch also contains the React preload
component before the route is activated.

## September 23 isolated comparison

The comparison used the same seller, product, RORP flag, and phone profile URL
on both sides. We verified live responses: control emitted five product image
preloads in the Rails `<head>`; experiment emitted five through the React
stream. React also emitted an automatic initial-image preload on the control
side, duplicating one Rails hint. Both sides returned the RORP root rather
than an Inertia page.

| Side       | Revision                                   | Image hints       |
| ---------- | ------------------------------------------ | ----------------- |
| Control    | `50bcdb04f87037a0d207af8030510edba31b6152` | Rails metadata    |
| Experiment | `6b32136ed4a0dbbb5b5d6e21416cb3a14eff6738` | React `preload()` |

The paired ShakaPerf runs were:

| UTC run ID                 | Viewport and samples | FCP                                               | LCP                    | Speed Index                                       |
| -------------------------- | -------------------- | ------------------------------------------------- | ---------------------- | ------------------------------------------------- |
| `2026-09-23T10:35:19.857Z` | Phone, 18 pairs      | React −88 ms, p=0.012                             | React −122 ms, p=0.014 | No clear change                                   |
| `2026-09-23T10:45:48.886Z` | Desktop, 18 pairs    | No clear change                                   | No clear change        | No clear change                                   |
| `2026-09-23T11:07:25.995Z` | Phone, 22 pairs      | No clear change                                   | No clear change        | No clear change                                   |
| `2026-09-23T11:17:22.608Z` | Phone, 22 pairs      | React −47 ms, below the 50 ms practical threshold | React −55 ms, p=0.014  | React −36 ms, below the 50 ms practical threshold |

The first two phone runs had large stalls: individual LCP samples reached
about 9–12 seconds, sometimes on opposite sides of a pair. The last phone
run had no such stalls: Rails LCP ranged from 1.48–1.99 seconds and React
from 1.78–1.94 seconds; React was faster in 16 of 22 pairs. The last run's
paired LCP interval was −96 to −10 ms. Across these runs, React transferred
about 2.2 KB more on cold visits (roughly 0.08%).

In representative cold-phone traces, both implementations started the main
image at Low priority and requested it at nearly the same time. Chrome raised
its priority after layout 79 ms and 116 ms sooner on React in the first and
last phone captures, respectively. Those traces are consistent with the LCP
signal but do not establish why layout happened sooner. The saved network
captures showed 12 distinct image URLs per side without a repeated URL.

The current `compare-results/product-page-profile-layout-cold-landing-phone-3dc559b1/perf.json`
and its `artifacts/ab-measurements.json` contain the **last** 22-pair run.
ShakaPerf overwrites that case directory on rerun; the earlier values above
come from the reports inspected immediately after each run. Do not interpret
the directory as an archive of all four runs. The September 17 full report
that previously lived in `compare-results/full-report.html` was also replaced
by the September 23 runs.

## Earlier evidence and limits

An earlier RORP page let Inertia's first head update remove Rails-rendered image
preloads. Under throttling, unfinished image requests aborted and the carousel
requested them again. Moving the hints to React prevented those aborts in the
September 6 browser checks.

Outside `benchmark-results/`, the production-code diff between these revisions
is confined to `LinksController`, `ProductCoverPreloads.tsx`, and `ProductPage.tsx`.
Three test files also differ. The saved comparison is at
`benchmark-results/product-page/individual/react-owned-image-preloads/summary.md`
in the original Product branch. It classified cold and warm phone Speed Index
as regressions with React-owned hints (2,199 to 5,102 ms and 360 to 448 ms;
both p=0.0040). Cold transferred data increased from 2,657.0 to 2,711.2 KB.
It found no classified LCP change and no visual difference. The September 23
reruns did not reproduce that large Speed Index regression, but their changing
run conditions and the historical branch differences prevent a claim of a
definitive performance winner. The later metadata hydration change in
`7394d369b7` was not part of this isolated comparison.

## September 17 full comparison

The September 17 full comparison ran from 13:21:25 to 13:47:16 UTC. It
compared the Inertia Product page with the then-final RORP Product page, not
the two preload candidates above. Its `compare-results/` files have since
been overwritten by the September 23 comparison.

The preserved twin containers were created at 10:57:30 UTC, before the run.
Selected source files in the control volume match the Inertia baseline
`a689ac7ec5fe5b708efe4ddff5388e72fc4ce06d`. Selected Product controller,
component, metadata, and runtime files in the experiment volume match both
`97d21db7ebf8cfb50264f7a1af2380d81b730e59` and its byte-equivalent
rewrite `9cd4ef7f39aaf4f5278c4088f7ffabe0dd3cbc4f`. The experiment volume
has no `ProductCoverPreloads.tsx`. Built Inertia and RSC asset filenames in the
volumes match requests recorded in the report.

Across the four Product landing cases' saved network summaries, each side
requested 12 distinct MinIO image URLs per case, with no repeated URL in a
case. These summaries do not explicitly count aborted requests. The report
does not embed immutable at-run Git identities; the mutable volumes and
matching built assets provide strong provenance, not a cryptographic proof of
the checkout SHA used at run time.

The full comparison found earlier FCP, LCP, and Speed Index on the RORP side
for cold and warm desktop and phone visits. Cold transferred data increased by
about 12% and TTFB rose; warm transferred data fell by about 81%. Its article
in the original Product history records the four-case medians and measurement
limits. This run did not measure the isolated performance effect of image
preload ownership.

## Historical isolated comparison setup

The historical checkouts used for the isolated comparison were:

| Side       | Branch                                       | Checkout                                        |
| ---------- | -------------------------------------------- | ----------------------------------------------- |
| Control    | `ramez/rorp/preload-ab-rails` at `50bcdb04f` | `/Users/ramezweissa/code/shaka/gumroad-control` |
| Experiment | `ramez/rorp/preload-ab-react` at `6b32136ed` | `/Users/ramezweissa/code/shaka/gumroad`         |

`ramez/rorp/preload-final-rails` preserves the later `9cd4ef7f3` Product
checkout. The main Gumroad checkout's unrelated uncommitted article and
benchmark changes were saved in the Git stash named `Preserve Product article
and benchmark edits for preload comparison`. The setup used:

```bash
cd /Users/ramezweissa/code/shaka/gumroad
export SHAKAPERF_CONTROL_DIR=/Users/ramezweissa/code/shaka/gumroad-control
export SHAKAPERF_CONTROL_PORT=3100 SHAKAPERF_EXPERIMENT_PORT=3200
export SHAKAPERF_CONTROL_S3_PORT=9100 SHAKAPERF_EXPERIMENT_S3_PORT=9101
/Users/ramezweissa/.local/bin/shaka-perf servers
```

Those historical revisions did not activate `product_page_react_on_rails`
during twin setup, so the `bgfjk` seller needed the flag enabled in both
benchmark databases. The rewritten ShakaPerf fixtures configure and verify the
flag on each side during setup and refresh. The historical Product landing
comparison used this command from another terminal:

```bash
/Users/ramezweissa/.local/bin/shaka-perf compare \
  --filter 'Product Page - Profile layout (cold|warm) landing' \
  --categories perf,visreg
```

The comparison kept the control and experiment on those revisions. Future runs
should record the resolved checkout SHAs, ShakaPerf version, machine memory/swap
state, and final report run ID with the results.
