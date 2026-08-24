# Public RSC generated-pack loading

## Decision

Load React on Rails generated component packs with `async`. Bundle the public RSC browser bootstrap first in every generated entry instead of emitting it as a separate script.

## Ordering contract

An async generated pack may execute before a separately deferred bootstrap. That would let the component register and hydrate before the default RSC provider, browser translation guard, and page initialization are installed.

The client configuration removes the standalone bootstrap entry and prepends its imports to every `generated/*` entry. Module evaluation order is therefore deterministic inside each generated pack even though different packs may load asynchronously. The Rails layout flushes only the component packs queued by React on Rails.

Generated pack tags retain their CSP nonce and use the environment-aware `/public-rsc/` asset path. Production and staging continue to publish the same files under `/assets/public-rsc/`.

## Regression proof

- Exercise string and array entry shapes through the real client configuration.
- Generate packs and verify every generated entry starts with the bootstrap imports and no standalone bootstrap remains.
- Build the client, server, and RSC compilers in test and production modes and inspect their manifests.
- Hydrate Product, Profile, and Discover documents with cold and warm caches; each document must emit one async generated component script, no standalone bootstrap script, and no CSP or Rails-context parsing errors.
