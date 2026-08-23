# React on Rails RSC autobundling migration handoff

## Purpose

Migrate the public React Server Component page roots from the current manually loaded `product_rsc` browser bundle to React on Rails 17 autobundling.

The migration must remain limited to these Rails-addressable RSC roots:

- `DiscoverPage`
- `ProductPage`
- `ProfileRscCompatibilityPage`

This is infrastructure work. It must not expand the RSC component migration, alter unrelated discover or product content, or change ordinary Inertia pages.

## Summary

React on Rails autobundling is compatible with the intended architecture, but enabling `config.auto_load_bundle = true` is not sufficient by itself.

The current application has a custom three-target Rspack pipeline:

1. A browser bundle, registered manually in `app/javascript/entrypoints/public_rsc/client.tsx`.
2. An SSR bundle, built as `ssr-generated/server-bundle.js`.
3. An RSC payload bundle, built as `ssr-generated/rsc-bundle.js`.

The browser bundle is exposed through a custom `asset-manifest.json`, resolved by `ProductRscHelper`, and inserted manually into the RSC views. React on Rails autobundling instead expects:

- Rails-addressable roots inside directories named by `components_subdirectory`.
- Shakapacker `nested_entries: true`.
- generated client packs under the configured `source_entry_path/generated` directory.
- generated aggregate server registration consumed by the SSR and RSC bundles.
- Shakapacker-compatible manifest output.
- `javascript_pack_tag` and `stylesheet_pack_tag` calls that flush packs appended by the React on Rails helper.
- pack generation before development, test, and production compilation.

The migration should adopt those conventions rather than merely generating files and feeding them through the existing custom manifest.

## Alignment with ShakaCode guidance

The target design follows these public React on Rails conventions:

- Configure `components_subdirectory = "ror_components"`.
- Put only Rails-rendered root entry modules in `ror_components`.
- Use thin default-export wrappers; keep the actual feature implementation in its domain directories.
- Leave the RSC root wrappers without a `"use client"` directive so the generator classifies them as Server Components.
- Let React on Rails generate `registerServerComponent` calls; do not maintain them manually.
- Set `nested_entries: true`.
- Let the view helper append the component-specific generated pack.
- Flush appended packs through the layout.
- Run `react_on_rails:generate_packs` as a Shakapacker precompile hook.

References:

- [React on Rails autobundling](https://reactonrails.com/docs/core-concepts/auto-bundling/)
- [Recommended project structure](https://reactonrails.com/docs/getting-started/project-structure/)
- [React Server Components](https://reactonrails.com/docs/pro/react-server-components/)
- [Hacker News RSC autobundling example](https://github.com/shakacode/react-on-rails-demo-hacker-news-rsc)
- [Marketplace RSC autobundling example](https://github.com/shakacode/react-on-rails-demo-marketplace-rsc)
- [Gumroad-style RSC demo](https://github.com/shakacode/react-on-rails-demo-gumroad-rsc)

The public Hacker News and Marketplace examples use React on Rails 17, React on Rails Pro 17, Shakapacker 10.2, and `react-on-rails-rsc` 19.2.1, matching the important versions in this application.

### Important public-example caveat

The current public RSC autobundling examples use Shakapacker-managed Webpack configuration and its standard manifest. This application uses a custom Rspack RSC build and `RSCRspackPlugin`.

The Gumroad-style public demo resembles the current manual setup: it explicitly disables autobundling and manually registers its RSC roots. It is useful as a migration comparison, but it is not an autobundling reference.

There is therefore no exact public example for this application's combination of:

- React on Rails RSC autobundling
- the existing Vite-owned Inertia application
- an isolated Shakapacker/Rspack public RSC pipeline
- the existing custom RSC transformer and aliases

The implementation must preserve the required Rspack RSC behavior while moving generated entry discovery, registration, pack tags, and manifest resolution under the supported React on Rails/Shakapacker contract.

## Recommended target structure

Do not move the existing product, discover, or profile implementation trees merely to follow an example. Add thin Rails entry wrappers instead.

```text
app/javascript/
├── components/
│   ├── Discover/
│   │   └── DiscoverPage.tsx
│   ├── Product/
│   │   └── ProductPage.tsx
│   ├── Profile/
│   │   └── ProfileRscCompatibilityPage.client.tsx
│   └── PublicPages/
│       └── ror_components/
│           ├── DiscoverPage.tsx
│           ├── ProductPage.tsx
│           └── ProfileRscCompatibilityPage.tsx
├── packs/
│   ├── server-bundle.js
│   └── generated/                  # generated and gitignored
└── generated/
    └── server-bundle-generated.js # generated and gitignored
```

The exact feature parent for `ror_components` may change to fit existing repository conventions. The invariants are:

- It is beneath `app/javascript`.
- It is outside `source_entry_path`, so its source wrappers are not also treated as browser pack entries.
- It contains only the three Rails-addressable roots in scope.
- Wrapper basenames exactly match the names passed to the Rails streaming helpers.
- The wrappers have default exports.
- The wrappers do not have a `"use client"` directive.

Nested client components remain in their current domain folders and continue to be discovered through the RSC client-reference plugin. They do not belong in `ror_components` unless Rails renders them directly by name.

## Inertia and Vite boundary

Ordinary Inertia pages must remain Vite-owned and should not request Shakapacker-generated RSC packs.

The public RSC pages currently reuse the Rails `inertia` layout and create small Inertia compatibility contexts inside the RSC client tree. Preserve all of the following behavior:

- `PageShell` and `ProductPageInertia` continue to provide their existing compatibility contexts.
- RSC controllers continue upgrading Inertia visits to full document navigation through `409` and `X-Inertia-Location`.
- The Vite `base` entrypoint remains suppressed for RSC documents.
- Ordinary Inertia responses continue loading Vite `base` normally.
- The generated-pack flush in `app/views/layouts/inertia.html.erb` is conditional on an RSC document marker such as `@public_rsc_props` or `@product_rsc_document_props`.
- Ordinary Inertia pages emit no generated RSC pack scripts.

Conditional pack flushing is an application-specific adaptation of ShakaCode's examples, which use a layout dedicated to React on Rails and can flush packs unconditionally.

## Largest implementation items

### 1. Add autobundled root wrappers

Create thin wrappers for the three root names. Let React on Rails classify and register them. Do not manually call `registerServerComponent` from these wrappers.

Ensure the profile wrapper is named `ProfileRscCompatibilityPage.tsx` even if the implementation it exports currently has a `.client.tsx` suffix. The auto-bundled root wrapper itself must be a common, server-classified entry.

### 2. Make generated entries first-class Shakapacker entries

Configure:

- `components_subdirectory = "ror_components"`
- `auto_load_bundle = true`
- `nested_entries: true`
- a conventional, isolated `source_entry_path`, preferably `packs`

Do not hand-author files under `packs/generated`; React on Rails owns that directory.

The current Rspack client configuration must build nested generated entries and emit the manifest structure expected by Shakapacker's `javascript_pack_tag` and `stylesheet_pack_tag` helpers.

Prefer using Shakapacker's configuration and manifest plugins as the base, then layering the RSC plugin, aliases, transformer, asset rules, and other application-specific behavior. Avoid maintaining a second custom manifest format for generated packs.

### 3. Consume generated registration in both server targets

Replace the manual root registration in `app/javascript/entrypoints/public_rsc/server.tsx` with the aggregate registration generated by React on Rails.

The same generated registration must be included in:

- `server-bundle.js`
- `rsc-bundle.js`

Preserve:

- the Node target
- private output under `ssr-generated`
- single-chunk server output
- the `react-server` condition for the RSC bundle
- `react-dom/server: false` for the RSC bundle
- the RSC loader and transformer ordering
- existing aliases and asset behavior

Use the Hacker News and Marketplace configurations as references for creating the SSR and RSC bundles from a shared server entry.

### 4. Preserve browser bootstrap behavior

The current shared browser entry also performs application initialization:

- installs the default RSC provider
- initializes `BasePage`
- installs the browser translation guard

Autobundling only generates component registration. Preserve this bootstrap exactly once per RSC document. Do not copy it into every generated pack if that duplicates runtime work or application code.

### 5. Switch the Rails loading contract

After the generated browser packs work:

- Remove `auto_load_bundle: false` from the three streaming helper call paths.
- Remove the manual `javascript_include_tag product_rsc_javascript_path` tags.
- Add conditional `stylesheet_pack_tag` and `javascript_pack_tag` flushes to the shared layout.
- Preserve CSP nonce, crossorigin, and asset-host behavior expected by the application.
- Confirm that the generated script tag is emitted only on RSC documents.

The tag's parser position matters. The browser must not attempt to parse `js-react-on-rails-context` while its streamed JSON script is incomplete. Do not assume autobundling fixes this merely because it controls the tag. Verify the emitted HTML order and browser behavior.

### 6. Remove obsolete manual plumbing

Only after parity is proven, remove code made obsolete by autobundling, such as:

- manual client root registration
- `ProductRscHelper` and its custom asset-manifest lookup, if no remaining caller needs it
- the custom `PublicRscAssetManifestPlugin`, if Shakapacker owns the browser manifest
- obsolete manual client entry configuration
- tests that enforce the old manual-loading architecture

Retain custom RSC build code that is still necessary. Do not perform unrelated bundler cleanup.

### 7. Update development, test, CI, and deployment builds

Pack generation must happen before compilation in:

- local development
- watch mode
- test asset builds
- production Docker builds
- twin-server builds
- CI asset precompilation

Use a Shakapacker `precompile_hook` or the equivalent supported React on Rails mechanism. Avoid having slightly different generation sequences in each environment.

## Performance considerations

The current `product_rsc` browser bundle is shared across all three roots. Autobundling creates a generated entry per root, which improves route-level loading but can duplicate React on Rails, React, Inertia, and application bootstrap code if chunk sharing is not configured.

Measure and control:

- compressed JavaScript bytes on each page
- number of browser requests
- repeated runtime or vendor code across generated entries
- cold-cache loading
- warm-cache discover-to-product navigation
- parse and evaluation time
- hydration completion
- LCP

Use shared runtime/vendor chunks where supported and beneficial, but do not introduce complex chunking without evidence. A simple implementation that regresses warm-cache behavior is not acceptable merely because it follows the folder convention.

## Scope boundaries

Do not:

- migrate additional discover, product, profile, navbar, or checkout components
- change server/client component boundaries beyond what autobundling requires
- rewrite the Inertia compatibility layer
- move the existing domain component trees wholesale
- change controller data fetching or product props
- alter experiments or rollout gates unrelated to asset loading
- convert unrelated Vite entrypoints to Shakapacker
- remove RSC observability
- combine this with further product-page content migration

## Validation requirements

### Configuration and build

- Rails boots with autobundling enabled.
- `react_on_rails:generate_packs` generates exactly the expected root packs.
- Generated files are gitignored.
- Development, test, and production Rspack builds succeed.
- Both private server bundles contain the expected generated registration.
- The Shakapacker manifest resolves every generated browser pack.

### Request behavior

- Product RSC documents load only the `ProductPage` generated root pack plus shared chunks.
- Discover RSC documents load only the `DiscoverPage` generated root pack plus shared chunks.
- Profile compatibility documents load only the profile generated root pack plus shared chunks.
- Ordinary Inertia pages contain no generated RSC script tags.
- RSC documents still omit the Vite `base` entrypoint.
- Existing experiment and request constraints still select the same rendering mode.

### Browser behavior

- All three RSC roots server-render and hydrate.
- There are no hydration warnings.
- There is no `Error parsing Rails context` console error.
- The Rails context element is complete before code attempts to parse it.
- Client navigation and interaction still work.
- Product, discover, and profile visual output remains unchanged.

### Performance

Run baseline-versus-patched tests against equivalent builds and data. Include cold and warm samples. Report medians and run-to-run noise rather than a single best result.

At minimum compare:

- LCP
- JavaScript transfer size
- JavaScript request count
- script parse/evaluation time where available
- hydration or interaction readiness
- warm-cache discover-to-product behavior

Do not claim an improvement if the result is within noise. Treat increased JavaScript bytes, duplicated runtimes, new console errors, or warm-cache regressions as blockers requiring investigation.

## Suggested reviewable commit sequence

Keep every commit working and independently understandable. A likely sequence is:

1. Add the three thin `ror_components` wrappers and focused discovery tests without changing runtime loading.
2. Add generated-pack configuration and build integration while the views still explicitly use the existing manual bundle.
3. Wire the generated aggregate registration into the SSR and RSC bundles, with build tests.
4. Add the conditional layout flush and switch the streaming helpers to autobundling, with request and browser regression tests.
5. Remove the now-unused manual manifest, helper, and registration plumbing.
6. Add or update performance evidence and architecture documentation.

Adjust the boundaries if a dependency makes a commit non-functional, but do not collapse the migration into one large change.

## Copy-ready goal prompt

```text
/goal Migrate the public React Server Component roots in this repository to React on Rails 17 autobundling, following rsc_autobundling_migration_handoff.md and the current ShakaCode documentation and public RSC examples.

Read completely before changing code:
- rsc_autobundling_migration_handoff.md
- rsc_migration_product_page.md
- https://reactonrails.com/docs/core-concepts/auto-bundling/
- https://reactonrails.com/docs/getting-started/project-structure/
- https://reactonrails.com/docs/pro/react-server-components/
- https://reactonrails.com/docs/pro/react-server-components/tutorial/
- https://reactonrails.com/docs/pro/react-server-components/inside-client-components/
- https://reactonrails.com/docs/pro/react-server-components/server-side-rendering/
- https://reactonrails.com/docs/pro/react-server-components/add-streaming-and-interactivity
- https://github.com/shakacode/react-on-rails-demo-hacker-news-rsc
- https://github.com/shakacode/react-on-rails-demo-marketplace-rsc
- https://github.com/shakacode/react-on-rails-demo-gumroad-rsc

Scope:
- Autobundle only ProductPage, DiscoverPage, and ProfileRscCompatibilityPage.
- Add thin default-export wrappers under a configured ror_components directory.
- Keep the actual domain components in their current directories.
- Enable nested generated entries and make React on Rails own root registration and pack selection.
- Integrate generated packs with the existing three-target Rspack RSC build and a Shakapacker-compatible manifest.
- Include generated aggregate registration in both server-bundle.js and rsc-bundle.js.
- Preserve the existing default RSC provider, BasePage initialization, translation guard, aliases, transformer, RSC loader, private server output, and RSC client-reference handling.
- Replace the manual product_rsc browser include with the React on Rails helper/loading contract.
- Flush generated pack tags conditionally in the shared inertia layout so ordinary Inertia/Vite pages are unaffected.
- Update local, test, CI, Docker, and twin-server build paths so pack generation always precedes compilation.
- Remove obsolete manual registration, helper, and custom-manifest code only after parity is demonstrated.

Non-goals:
- Do not migrate any additional components.
- Do not change product, discover, profile, navbar, checkout, or controller behavior.
- Do not rewrite the Inertia compatibility layer.
- Do not move domain component trees wholesale.
- Do not convert unrelated Vite entrypoints to Shakapacker.
- Do not combine this with further product-page RSC content migration.

Implementation requirements:
- Inspect and preserve all existing uncommitted work; do not overwrite or commit unrelated changes.
- Compare the installed React on Rails 17 generator and pack-generation code with the public examples rather than guessing its contract.
- Prefer Shakapacker's generated-entry and manifest mechanisms over extending the bespoke product_rsc asset-manifest format.
- Keep generated files gitignored.
- Keep changes small and make granular, independently reviewable commits.
- Run focused tests after every behavioral commit.
- Prove that ordinary Inertia pages emit no generated RSC pack.
- Prove that each RSC document loads the correct root pack and still suppresses Vite base.
- Prove server rendering and hydration for ProductPage, DiscoverPage, and ProfileRscCompatibilityPage.
- Capture browser console output and fail on hydration warnings or Error parsing Rails context.
- Inspect emitted HTML ordering; do not assume autobundling fixes the streamed Rails-context race.
- Benchmark equivalent baseline and patched branches with repeated cold and warm samples. Report medians, noise, JavaScript bytes/requests, LCP, and hydration readiness.
- Check for duplicated React, React on Rails, Inertia, or bootstrap code across generated entries. Use shared chunks only when evidence supports them.

Before implementation, write a short plan mapping the ShakaCode convention to the current Vite/Shakapacker/Rspack boundaries. Then implement and commit in small steps. Stop and explain the blocker if the supported Shakapacker manifest or generated server registration cannot be reconciled cleanly with RSCRspackPlugin; do not silently recreate autobundling through another custom manifest.

Final handoff must include:
- branch and commit list
- files changed by conceptual area
- exact tests and builds run
- browser QA evidence for all three roots and an ordinary Inertia control page
- baseline-versus-patched performance results, including warm tests
- remaining risks or deviations from ShakaCode's public examples
```
