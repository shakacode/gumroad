# Product page RSC migration roadmap

## Purpose

Migrate the Discover product page from an Inertia-owned React tree to a genuine React Server Components tree without changing product behavior or removing Inertia from unrelated Gumroad pages.

This roadmap coordinates the implementation. Detailed verification lives in [Product page RSC verification plan](product-rsc-verification-plan.md). Performance measurement, rollout, and optimization live in [Product page RSC performance and rollout plan](product-rsc-performance-rollout-plan.md).

## Authoritative baseline

- Repository: `/Users/ramezweissa/code/shaka/gumroad`
- Source revision: `fb39dbe24b3f632d96aa0b7b5e3d3e778fd9796a`
- Reference implementation: `/Users/ramezweissa/code/shaka/react-on-rails-demo-gumroad-rsc`
- Planning branch: `ramezweissa/product-rsc-migration-plan`

All behavior and performance comparisons use `fb39dbe24b3f632d96aa0b7b5e3d3e778fd9796a` unless a checkpoint report explicitly records a replacement baseline and why it is equivalent. The older `df09b435c974084b71b6f56c27d1efe1e4b398b7` reference in the original validation checkpoint is superseded.

## Current state at the baseline

The product RSC path is opt-in through `layout=discover&rsc=1`. Rails routes matching requests to `ProductRscLinksController`, and `LinksController` streams `links/rsc_show` with React on Rails Pro.

The transport and build separation are already useful:

- dedicated browser, SSR, and `react-server` webpack targets;
- explicit server and client registration;
- streamed HTML with embedded Flight data;
- CSP nonces on streamed payload scripts;
- no duplicate initial `/rsc_payload/` request in the existing system spec;
- the ordinary Discover route remains an Inertia control and rollback path.

The product root is not yet a real server-first component. `ProductPage.tsx` starts with `"use client"`, constructs an Inertia `Page`, mounts `InertiaApp`, and passes the existing product props through the client tree. This proves the RSC transport but does not remove Inertia from the product render tree or keep server-safe product rendering off the browser.

## Completion invariants

The migration is complete only when all of these are true:

1. The product-page root is a Server Component and has no `"use client"` directive.
2. No component reachable from the product RSC root imports or mounts Inertia.
3. No product client island reads Inertia page props or uses the Inertia router.
4. The product response does not rely on an Inertia bootstrap, data-page attribute, or Inertia-specific Rails layout behavior. Neutral layout markup may be shared.
5. Server Components own page composition and read-only rendering.
6. Client Components are restricted to interaction, browser APIs, effects, or mutable client state.
7. Client boundaries receive minimal, serializable data rather than the former page-prop object.
8. Rails remains authoritative for authorization, pricing, eligibility, taxes, variants, mutations, and redirects.
9. Browser, SSR, and RSC bundles stay isolated; server-only modules cannot reach the browser bundle.
10. Initial HTML contains meaningful product content and does not require a second Flight request for the initial tree.
11. Existing URLs, metadata, custom styling, analytics, cart, checkout, and failure behavior remain correct.
12. Inertia continues to work outside the product-page scope.
13. The migration passes the correctness and performance gates in the linked plans.

## Scope boundary

Included:

- Discover-layout product pages selected by the product RSC route;
- product content, options, pricing presentation, media, cart entry, and checkout handoff used by that page;
- Discover shell elements that are part of the selected product-page tree;
- product-page navigation and mutations currently coupled to Inertia;
- focused Rails, frontend, build, system, visual, accessibility, and performance coverage.

Excluded:

- removing Inertia from dashboards, settings, or other application surfaces;
- redesigning the product page;
- moving Rails business rules into TypeScript;
- replacing stable mutation endpoints without a demonstrated need;
- broad dependency upgrades or unrelated cleanup;
- changing iframe, overlay, profile, JSON, custom HTML, or mobile-app behavior unless the route audit proves they share the migrated tree.

## Work organization

Use an isolated worktree created from the authoritative baseline. Each checkpoint branch is stacked on the preceding branch and uses the `ramezweissa/` prefix. The primary implementation agent owns integration, branch creation, and commits.

Subagents receive bounded assignments with explicit file ownership. Good parallel tasks are dependency mapping, Rails data-flow review, test inventory, bundle audit, browser regression checks, and benchmark analysis. Overlapping code edits remain with the primary agent; investigative subagents report evidence instead of editing shared files.

Every checkpoint report records:

- branch name and parent SHA;
- commits and their purposes;
- changed architectural surfaces;
- behavior migrated and behavior intentionally unchanged;
- exact validation commands and results;
- remaining Inertia imports and runtime dependencies;
- changes to Server/Client Component boundaries;
- diff statistics, risks, and next checkpoint scope.

## Discovery map required before code migration

The first checkpoint must produce a checked-in or checkpoint-attached dependency map covering:

| Area            | Questions to answer                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Request routing | Which host, custom-domain, offer-code, format, partial, iframe, overlay, and mobile conditions can reach the RSC controller? |
| Rails data      | Which presenter fields are read by each product section? Which fields are authorization-sensitive or expensive?              |
| Inertia         | Where are `InertiaApp`, `usePage`, `router`, page props, Inertia links, and partial reloads reachable from the product tree? |
| Providers       | Which providers are server-safe, browser-only, or only present because the current root emulates an Inertia page?            |
| Read-only UI    | Which product, seller, media, description, metadata, and navigation sections can render on the server?                       |
| Interactive UI  | Which components own selection, pricing display, quantity, media controls, dialogs, cart state, or browser persistence?      |
| Mutations       | Which Rails endpoints handle cart, checkout, wishlists, reviews, recommendations, discounts, and tracking?                   |
| Navigation      | Which flows need normal document navigation, history updates, or an RSC subtree request?                                     |
| Analytics       | Which impressions and actions fire, at what lifecycle point, and with which deduplication rules?                             |
| Tests           | Which existing examples prove presenter, routing, product, cart, checkout, and custom-domain behavior?                       |
| Bundles         | Which imports enter each of the three product RSC targets, and which client chunks are actually transferred?                 |

The map is a migration input, not an excuse for a broad refactor. Record uncertain ownership and resolve it before moving the affected component.

## Stacked checkpoints

### 1. Server root and characterization

Branch: `ramezweissa/product-rsc-server-root`

Deliverables:

- characterization coverage for the critical route and product-page behaviors;
- a genuine Server Component root;
- verified server/client registration, streaming, hydration, and bundle separation;
- a temporary, explicit compatibility island around the existing client/Inertia tree if needed;
- an inventory of all remaining Inertia dependencies beneath that island.

Exit gate:

- the server root renders meaningful stable framing or metadata;
- ordinary and opt-in paths still render equivalent product identity, price, and CTA;
- the temporary compatibility boundary is smaller and named as temporary;
- configuration, build, request, and smoke tests pass.

### 2. Server-owned shell and content

Branch: `ramezweissa/product-rsc-server-content`

Deliverables:

- server composition for product layout and server-safe read-only sections;
- Rails-owned, section-specific data preparation;
- minimal props for the remaining compatibility subtree;
- meaningful content in the initial stream;
- Suspense only around independently resolvable work.

Exit gate:

- the initial response contains the migrated content without waiting for hydration;
- serialized data is allowlisted and contains no unnecessary global page payload;
- metadata, seller styling, authorization, and product content parity pass;
- the remaining Inertia subtree is materially smaller and measured.

### 3. Focused client islands

Branch: `ramezweissa/product-rsc-client-islands`

Deliverables:

- replacements for product dependencies on `usePage` and Inertia-specific providers;
- focused islands for options, price-affecting selections, media, dialogs, cart UI, and other applicable interaction;
- narrowly scoped state shared only where interactions require it;
- component and system coverage for each migrated interaction.

Exit gate:

- read-only product sections are absent from the browser client-reference graph;
- no single island recreates the whole page as client code;
- remaining Inertia usage is limited to documented navigation or mutation flows.

### 4. Navigation and mutations

Branch: `ramezweissa/product-rsc-navigation-mutations`

Deliverables:

- replacement of product-page Inertia navigation with normal Rails navigation, browser history, or RSC subtree navigation according to the flow;
- mutation clients that call the existing Rails endpoints and preserve CSRF, validation, redirects, and errors;
- preservation of cart, checkout handoff, eligibility, analytics, and accessibility behavior;
- request and browser tests for success, expected failures, and history behavior.

Exit gate:

- no product interaction requires the Inertia router;
- checkout and cart flows preserve server authority;
- stale or late navigation responses cannot overwrite newer state;
- browser back/forward, query parameters, offer codes, anchors, and redirects behave correctly.

### 5. Remove product-page Inertia

Branch: `ramezweissa/product-rsc-remove-inertia`

Deliverables:

- removal of the compatibility island and synthetic Inertia `Page`;
- removal of product-tree imports of Inertia components, hooks, router APIs, and page props;
- replacement of any Inertia-specific HTML bootstrap or Rails layout dependency with a dedicated or neutral RSC response layout;
- removal of obsolete adapters and providers;
- an automated dependency/bundle assertion preventing regression.

Exit gate:

- a static import traversal and a production bundle inspection both prove that the product RSC tree does not include Inertia;
- the rendered HTML contains no Inertia application root or serialized Inertia page;
- Inertia remains available to unrelated application entrypoints;
- the full product verification matrix passes.

### 6. Streaming and production hardening

Branch: `ramezweissa/product-rsc-streaming-hardening`

Deliverables:

- validation of useful initial streaming and nested Suspense behavior;
- removal of avoidable follow-up Flight requests, waterfalls, duplicate queries, and duplicated serialized data;
- CSP, error-boundary, connection cleanup, renderer-failure, and production-build coverage;
- browser/server/RSC graph validation.

Exit gate:

- the initial tree produces exactly one document response with embedded Flight data and no duplicate initial payload request;
- renderer failure and interrupted streams release resources and produce defined behavior;
- production-mode builds and focused tests pass;
- no new security, CSP, or module-boundary defect is present.

### 7. Validation evidence

Branch: `ramezweissa/product-rsc-validation`

Deliverables:

- deterministic production-twin comparison against the authoritative baseline;
- desktop and mobile functional, visual, and accessibility evidence;
- browser, Rails, renderer, database, and bundle measurements;
- final architecture and operational documentation;
- a performance disposition for every gate: pass, accepted regression, or unresolved blocker.

Exit gate:

- all required scenarios have comparable control and experiment artifacts;
- material regressions are attributed and either fixed or explicitly accepted by an owner;
- the final implementation satisfies every completion invariant.

## Integration rules

- Rebase or otherwise update only according to the repository’s branch policy; never merge unrelated current-checkout work into the baseline worktree.
- Run the smallest sufficient checks while iterating, then the checkpoint gate before branching again.
- Do not carry a known failing correctness gate into the next branch.
- A performance regression may continue only when the measurement is reliable, the regression is recorded, and the next branch specifically addresses it.
- Keep generated benchmark artifacts out of functional commits. Store only the compact summary and review evidence selected by the performance plan.
- Do not push branches or open pull requests without explicit authorization.

## Work after the migration stack

The validation branch ends the architectural migration, not the operational rollout. Follow-up work is intentionally separate:

1. Establish a guarded production rollout and observability baseline.
2. Run a small canary, compare RSC and control cohorts, and validate renderer capacity.
3. Optimize one attributed bottleneck per branch: Flight payload, JavaScript, Rails queries, renderer latency, streaming waterfalls, or navigation prefetch.
4. Expand the rollout only after correctness and performance gates remain stable.
5. Remove the opt-in control only after rollback has been exercised and the observation window is complete.
6. Consider other RSC surfaces only after the product-page results justify them.

The sequence and gates for that work are defined in [Product page RSC performance and rollout plan](product-rsc-performance-rollout-plan.md).
