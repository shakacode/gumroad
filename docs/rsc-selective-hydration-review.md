# RSC selective-hydration review

## Decision

Use React on Rails autobundling with generated component packs loaded as `async`. Bundle the browser bootstrap into every generated public RSC entry so it executes before that component registers.

## What changed after the first experiment

The first candidate moved a shared `product_rsc_javascript_path` tag before the streamed component. That let the shared bootstrap execute while `js-react-on-rails-context` was still being streamed, and browser warmups repeatedly failed to parse the incomplete JSON.

The autobundling branch removes those manual tags and enables `auto_load_bundle`. `stream_react_component` now queues the generated pack for its component, and the layout flushes the queued packs through Shakapacker. React on Rails owns the loading contract rather than a template-level sidecar tag.

Changing only the generated-pack strategy to `async` introduced a different race: Shakapacker emits async packs before the separately deferred `public_rsc_bootstrap` tag. A cached component pack could therefore register and hydrate before the bootstrap installed the default RSC provider and browser initialization. The client build now prepends the bootstrap module to every generated entry and removes its standalone script tag. Module evaluation order is deterministic even though the resulting entry loads asynchronously.

React on Rails documents `generated_component_packs_loading_strategy: :async` as the supported selective-hydration path for Pro apps on Shakapacker 8.2 or newer. The repository uses React on Rails Pro 17.0.0 and Shakapacker 10.2.0.

## Verification evidence

- The configuration spec failed with `Expected :defer to eq :async` before the initializer changed and passed afterward.
- The public RSC build generated and compiled the client, server, and RSC bundles successfully, with the bootstrap included in each generated client entry and no standalone bootstrap entry.
- The autobundled experiment at `http://localhost:3200/discover` emitted the generated `DiscoverPage` pack with `defer` and had no Rails-context parsing errors, confirming the manual tag is gone from the current base.
- The rebased local build emitted the generated `DiscoverPage` pack with `async`, parsed the Rails context successfully on ten consecutive reloads, and hydrated the page each time.
- The Best Sellers tab updated the URL and selected state on the canonical local host with no browser console errors.
- The focused seller-profile and Discover system examples hydrated and completed interactions with the bundled bootstrap.
- The focused structure suite passed 17 JavaScript examples; the configuration and browser-backed system checks passed 4 Ruby examples.

## Remaining proof

The original parsing failure no longer reproduces on the framework-supported path. Before claiming a measured selective-hydration performance improvement, add a deliberately delayed streamed boundary and prove that an interaction succeeds before that boundary completes, then rerun the repeated benchmark.
