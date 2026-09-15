# Deferred call-booking calendar

Conclusion: **drop**. Deferring the calendar did not improve LCP or FCP in any
profile-product case, and it produced statistically significant Speed Index
regressions on both cold and warm phone loads.

## Revisions

- Control: `0b0244a32479646dcd6924806d50cf779cde30fd`
- Experiment: `088a9215c6` (only the call-booking calendar boundary and its
  focused tests)
- Historical source diff: `43becdbfc` / `d901c205f7`

Both sides rendered the RORP profile-product page with
`product_page_react_on_rails` enabled for the same fixture seller (`User;2`).
Direct preflight requests returned HTTP 200 RSC documents. The experiment's
document was 147,526 bytes versus 152,752 bytes for control.

## Results

The exact common commands in the parent README were used. Values below are the
reported medians in milliseconds; `none` means the sampler did not classify a
statistically significant change.

| Case | FCP | Speed Index | LCP |
| --- | --- | --- | --- |
| Cold desktop | 1,849 → 1,906 (`none`) | 2,724 → 2,726 (`none`) | 2,198 → 2,249 (`none`) |
| Cold phone | 1,614 → 1,952 (`none`) | 1,898 → 3,461 (**regression**, p=0.000076) | 2,290 → 2,550 (`none`) |
| Warm desktop | 411 → 401 (`none`) | 445 → 433 (`none`) | 411 → 401 (`none`) |
| Warm phone | 423 → 429 (`none`) | 434 → 527 (**regression**, p=0.045) | 423 → 429 (`none`) |

The profiler did not attribute any bytes to its JavaScript-only bucket on
either side. As a secondary network measure, cold transferred bytes increased
from 2,633.7 KB to 2,674.5 KB (+1.55%, classified regression), despite two
fewer requests. Warm transferred bytes were effectively unchanged at 35.8 KB.

The desktop and phone landing captures matched pixel-for-pixel. The broad
prefix filter also selected the pre-existing sticky-add-to-cart scenario; its
checkout mutation timed out during accessibility retries after the landing
measurements had completed. That unrelated scenario is not used in this
decision. The run was stopped rather than spending additional retries on it.

`raw/` retains the four landing cases' measurements, warmups, low-noise
summaries, compact reports, and network logs. Generated screenshots and image
directories are intentionally excluded.
