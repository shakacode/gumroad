# React-owned product image preloads

Conclusion: **drop**. Moving product image hints from the existing Rails/Inertia
metadata into React preserved LCP and appearance, but increased cold transfer
and significantly regressed phone Speed Index.

## Revisions

- Control: `50bcdb04f87037a0d207af8030510edba31b6152` (final deferred-pack RORP
  page with only React preload ownership removed)
- Experiment: `6b32136ed` before applying this decision
- Historical source diff: `a43862ea7`

Both sides were RORP with the seller feature enabled. Control retained the
image preload metadata already produced by Rails. Experiment removed those
hints from Inertia metadata and recreated them through `react-dom/preload`.

## Results

Values are reported medians in milliseconds.

| Case | FCP | Speed Index | LCP |
| --- | --- | --- | --- |
| Cold desktop | 4,355 → 7,979 (`none`) | 5,447 → 8,417 (`none`) | 4,355 → 7,979 (`none`) |
| Cold phone | 2,026 → 2,089 (`none`) | 2,199 → 5,102 (**regression**, p=0.0040) | 2,379 → 2,127 (`none`) |
| Warm desktop | 358 → 356 (`none`) | 391 → 387 (`none`) | 358 → 356 (`none`) |
| Warm phone | 344 → 359 (`none`) | 360 → 448 (**regression**, p=0.0040) | 350 → 359 (`none`) |

Cold transferred bytes increased from 2,657.0 KB to 2,711.2 KB (+2.04%,
classified regression) with the same request count. Warm bytes were unchanged
at 35.6 KB. The JavaScript-only profiler bucket was zero on both sides.

Desktop and phone landing captures matched pixel-for-pixel. The exact common
command was stopped after the complete 72-sample distributions because the
unchanged sticky-cart scenario was retrying independently. `raw/` excludes all
screenshots and generated image directories.
