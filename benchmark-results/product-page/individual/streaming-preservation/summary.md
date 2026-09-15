# Streaming preservation

Conclusion: **keep**. Without the change the browser could not consume the live
profile-product response reliably enough to finish the existing readiness
checks, so this is required for correctness before its performance impact can
be measured.

## Revisions

- Control: `52cc31be3` (the final flagged RORP page at `0b0244a32`, with only
  the committed-response CSRF guard and synchronous streaming compression
  removed)
- Experiment: `0b0244a32479646dcd6924806d50cf779cde30fd`
- Historical source diff: `829d9b641309c193f6333fa47736bc30b653748f`

Both Redis databases enabled `product_page_react_on_rails` for the fixture
seller actor `User;2`. Direct requests returned HTTP 200 and contained the RSC
payload on both sides before the comparison. The two runtime files below were
the only control-side difference:

- `app/controllers/concerns/csrf_token_injector.rb`: omit the early return for
  an already committed streaming response.
- `config/environments/benchmark.rb`: omit synchronous Rack::Deflater flushing
  and NDJSON compression support.

## Result

The exact common commands above were used. On both desktop and phone, the
experiment completed semantic readiness and image/font settling. The control
repeatedly hit the 60-second visual timeout while Playwright waited to capture
the settled page. The run was stopped after repeated retries because it could
not advance to a valid distribution.

LCP, FCP, Speed Index, and JavaScript-byte distributions are therefore
unavailable for the no-streaming control. This is not a neutral performance
result: the control is non-measurable under the unchanged production-like
scenario. No visual mismatch was observed on the experiment; the control did
not produce a comparison image. Generated screenshots were not retained.
