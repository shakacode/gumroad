# Asynchronous generated RSC packs

Conclusion: **drop**. Loading the generated packs with `async` and folding the
bootstrap into every generated entry reduced request count, but increased
transferred bytes and regressed cold-desktop LCP and warm-phone Speed Index.

## Revisions

- Control: `9cac194481d122f5e4ae665f83d3c0f17eb86b4a` (final RORP page with only
  the three runtime changes below reversed)
- Experiment: `fa46dd4119` before applying this decision
- Historical source diff: `1e1d39ed6`

Both sides rendered the RORP profile-product page with the seller feature on.
The only control-side runtime differences were:

- restore the explicit `public_rsc_bootstrap` pack in the RSC layout;
- use React on Rails' `:defer` generated-pack strategy instead of `:async`;
- stop prepending bootstrap imports to each generated Rspack entry.

## Results

Values are reported medians in milliseconds.

| Case | FCP | Speed Index | LCP |
| --- | --- | --- | --- |
| Cold desktop | 1,353 → 1,406 (`none`) | 2,330 → 2,243 (`none`) | 2,034 → 2,167 (**regression**, p=0.016) |
| Cold phone | 1,269 → 1,323 (`none`) | 1,648 → 2,739 (`none`) | 1,889 → 2,174 (`none`) |
| Warm desktop | 459 → 589 (`none`) | 503 → 632 (`none`) | 459 → 589 (`none`) |
| Warm phone | 378 → 387 (`none`) | 397 → 494 (**regression**, p=0.0019) | 386 → 392 (`none`) |

Cold transferred bytes increased from 2,656.9 KB to 2,692.4 KB (+1.34%,
classified regression) while request count fell from 104 to 97. Warm bytes
increased from 35.5 KB to 35.9 KB. The profiler's JavaScript-only bucket was
zero on both sides, so total network bytes are the useful secondary measure.

Landing-page visual comparisons matched pixel-for-pixel on desktop and phone.
The unchanged sticky-cart scenario again timed out separately; the completed
landing distributions and low-noise captures were retained before stopping its
accessibility retry. `raw/` excludes all screenshots and generated image dirs.
