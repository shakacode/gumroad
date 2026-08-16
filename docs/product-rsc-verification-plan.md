# Product page RSC verification plan

## Objective

Prove that the product-page RSC migration preserves buyer-visible behavior, Rails authority, security boundaries, and browser behavior while progressively removing Inertia from the product tree.

This plan supplements [Product page RSC migration roadmap](product-rsc-migration-roadmap.md). It does not require every test at every checkpoint. Each checkpoint runs the rows affected by its diff; checkpoints 5 through 7 run the complete required matrix.

## Evidence hierarchy

Use the narrowest test that can actually prove the behavior:

| Evidence                       | What it proves                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| Static import/bundle assertion | Server/client separation and absence of Inertia from the product graph                      |
| Presenter or unit test         | Pure data shaping, pricing display logic, and isolated component behavior                   |
| Controller/request test        | Routing, formats, authorization, props, headers, mutations, redirects, and errors           |
| JavaScript component test      | Client-island interaction and state transitions                                             |
| System/browser test            | Hydration, navigation, history, media, cart, checkout handoff, CSP, and integrated behavior |
| Production build inspection    | Actual emitted chunks, client references, and server-only isolation                         |
| Visual comparison              | Layout parity across viewport and color mode                                                |
| Accessibility comparison       | New or changed axe findings and keyboard behavior                                           |
| Production-twin benchmark      | Relative performance under identical source data and topology                               |

A unit test does not prove browser parity. A successful build does not prove bundle isolation until the emitted graph is inspected. A page containing the right text does not prove that it was server-rendered.

## Baseline preservation

The immutable behavior baseline is `fb39dbe24b3f632d96aa0b7b5e3d3e778fd9796a`.

Before migrating a behavior:

1. Locate existing coverage.
2. Add characterization coverage when the behavior is important and unproved.
3. Run it against the baseline or demonstrate that reverting the migration makes the new assertion fail.
4. Record any intentional gap rather than silently changing behavior.

Use existing factories and product presenters. Do not introduce a simplified fixture that bypasses the real product dependency graph.

## Required automated invariants

The final stack must include automated assertions for the following:

### Routing and response selection

- A qualifying full HTML Discover request reaches the RSC controller.
- Ordinary Discover HTML remains the control until rollout changes it deliberately.
- Inertia partial requests do not enter the streaming renderer.
- JSON, iframe, overlay, profile, and custom HTML responses retain their existing selection behavior.
- Offer-code and applicable custom-domain routes select the correct controller without changing precedence.
- Unsupported formats and malformed parameters do not enter the RSC path.

### Rails authority and data exposure

- The existing authorization and visibility rules run before rendering.
- Product price, variants, quantity limits, eligibility, discounts, taxes, and checkout decisions come from Rails-owned data or endpoints.
- Client input cannot override authoritative product or seller fields in a Flight payload request.
- Props crossing a client boundary are explicitly allowlisted and serializable.
- Sensitive global, seller, buyer, or request context is absent unless the consuming island requires it.
- Metadata and custom styles are generated from the same authoritative data as the control.

### RSC architecture

- The registered product root is a Server Component.
- The initial response contains recognizable server-rendered product content.
- The initial render does not issue a duplicate `/rsc_payload/` request.
- Every embedded Flight payload script carries the CSP nonce.
- Server-only modules are absent from the browser bundle.
- Client-only modules are absent from the `react-server` graph except through generated client references.
- The final product graph contains no `@inertiajs` import and does not mount `InertiaApp`.
- The final HTML has no Inertia application root, serialized Inertia page, or Inertia runtime bootstrap.
- Removing the static boundary assertion would allow a deliberately added forbidden import to fail the test.

### Streaming lifecycle

- Rendering context is computed before Active Record connections are released.
- Connections are released before the long-lived stream and cleaned up on success, failure, and disconnect.
- Proxy buffering headers remain correct.
- Useful product content precedes non-critical suspended content where the transport exposes chunk timing.
- A renderer exception and a rejected suspended subtree have a defined error path.
- An initial delayed subtree does not cause an avoidable post-hydration Flight request when it belongs in the initial response.

## Functional matrix

The discovery checkpoint marks each row `required`, `not applicable`, or `covered elsewhere`, with a linked test. A row cannot be omitted without a reason.

### Product identity and presentation

| Behavior                                                      | Minimum evidence                                 |
| ------------------------------------------------------------- | ------------------------------------------------ |
| Product name, seller, price, CTA                              | Controller/request plus browser parity           |
| Cover image or video                                          | Component plus browser test for applicable media |
| Description and rich content                                  | Browser parity using production-shaped content   |
| Seller colors and custom CSS metadata                         | Request assertion plus visual comparison         |
| SEO/social metadata                                           | Request or rendered-head assertion               |
| Reviews, ratings, sales count, or badges when present         | Presenter plus browser parity                    |
| Recommended content and recently viewed sections when present | Component/request coverage and browser smoke     |
| Empty and minimal product states                              | Request or component coverage                    |

### Pricing and configuration

| Behavior                                          | Minimum evidence                         |
| ------------------------------------------------- | ---------------------------------------- |
| Variant/tier selection changes displayed state    | Client component plus browser test       |
| Quantity limits and availability                  | Rails request plus browser failure state |
| Pay-what-you-want or custom price when applicable | Rails request plus browser interaction   |
| Subscription/recurrence choice when applicable    | Component plus browser test              |
| Discount and offer-code application               | Request plus browser success/failure     |
| Currency/localized price presentation             | Presenter plus rendered output           |
| Sold out, unavailable, or ineligible state        | Request plus browser assertion           |

### Cart and checkout handoff

| Behavior                                     | Minimum evidence                                          |
| -------------------------------------------- | --------------------------------------------------------- |
| Add to cart with default configuration       | System test                                               |
| Add to cart with selected options            | System test asserting submitted authoritative identifiers |
| Cart state updates without an Inertia router | Component plus system test                                |
| Buy-now/checkout navigation                  | System test including destination and parameters          |
| Validation or eligibility failure            | Request plus visible browser error                        |
| CSRF protection                              | Request test and real browser mutation path               |
| Redirect and return behavior                 | System test including history where applicable            |
| Duplicate submission prevention              | Component or system test                                  |

Payment processing beyond the page handoff remains covered by the existing purchase suite unless the migration changes that path. If it does, run the affected success and failure purchase examples rather than duplicating them in an RSC-specific file.

### Navigation and browser behavior

| Behavior                                   | Minimum evidence                                          |
| ------------------------------------------ | --------------------------------------------------------- |
| Product links and seller links             | Browser test                                              |
| Query parameters, offer codes, and anchors | Request plus browser test                                 |
| Back and forward restoration               | Browser test                                              |
| Scroll and focus behavior                  | Browser assertion                                         |
| Rapid consecutive navigation               | Browser test proving stale responses cannot win           |
| Normal document navigation where selected  | Navigation Timing assertion                               |
| RSC subtree navigation where selected      | DOM identity, history, and Flight request assertions      |
| Prefetch where implemented                 | Network assertion proving prefetched identity is consumed |

### Analytics and browser persistence

- Product impressions fire once at the equivalent lifecycle point.
- CTA, configuration, cart, checkout, share, and recommendation events preserve names and required properties.
- Hydration does not duplicate server- or browser-triggered events.
- Recently viewed or cart persistence uses the same browser storage/cookie semantics.
- Tracking failure does not break product interaction.

Use existing analytics test helpers when available. Do not make an external analytics service a condition for deterministic CI.

## Visual and accessibility matrix

Capture the control and experiment from the same deterministic product and viewport:

| Surface                        | Desktop  | Mobile   | Light              | Dark                    |
| ------------------------------ | -------- | -------- | ------------------ | ----------------------- |
| Initial product page           | Required | Required | Required           | Required when supported |
| Product with options           | Required | Required | One supported mode | One supported mode      |
| Open dialog or selector        | Required | Required | One supported mode | One supported mode      |
| Cart/checkout transition state | Required | Required | One supported mode | One supported mode      |
| Error or unavailable state     | Required | Required | One supported mode | One supported mode      |

For each scenario:

- compare screenshots after fonts and images settle;
- run axe against both control and experiment;
- fail on new or worsened findings;
- keyboard-test menus, selectors, dialogs, media controls, scroll regions, CTA, and checkout handoff;
- record pre-existing findings separately rather than treating them as migration regressions.

Pixel equality is expected for stable regions. Dynamic media or timestamps need explicit masks and an explanation.

## Checkpoint test gates

### Checkpoint 1

- React on Rails/RSC configuration test.
- Product RSC build.
- controller selection and response-header tests.
- initial RSC system smoke.
- baseline characterization for the behaviors the compatibility island still owns.

### Checkpoint 2

- server-content rendering assertions.
- props allowlist and serialization tests.
- metadata/custom-style parity.
- initial response and no-duplicate-payload assertions.
- browser parity for migrated read-only sections.

### Checkpoint 3

- component tests for each new client island.
- browser tests for product options, pricing display, media, dialogs, and cart state as applicable.
- build graph showing migrated read-only components are not client references.

### Checkpoint 4

- Rails mutation success and expected-error tests.
- CSRF and authorization tests.
- browser navigation, history, stale-response, cart, and checkout-handoff tests.
- analytics deduplication checks.

### Checkpoint 5

- complete required functional matrix.
- forbidden-import traversal for the product graph.
- production bundle inspection proving no product-path Inertia dependency.
- rendered-response assertion proving no Inertia bootstrap or serialized page remains.
- unaffected Inertia route smoke test.

### Checkpoint 6

- production-mode builds.
- stream ordering, renderer exception, disconnect cleanup, CSP, and error-boundary tests.
- query/payload duplication audit.
- complete focused product matrix after hardening.

### Checkpoint 7

- complete functional matrix in the production-twin environment.
- visual and accessibility comparison.
- deterministic performance suite.
- final architecture audit against every completion invariant.

## Commands and execution record

Discover exact commands from the branch rather than freezing line numbers here. The checkpoint report must include the commands actually run. Expected command families are:

```shell
npm run build:product-rsc:test
npm run typecheck
npm run test -- <focused frontend tests>
bin/rails test test/config/react_on_rails_rsc_configuration_test.rb
bin/rails test test/controllers/links_controller_test.rb
bin/rspec spec/requests/products/show/product_rsc_spec.rb
bin/rspec <affected cart, checkout, presenter, or custom-domain specs>
DISABLE_TYPE_CHECKED=1 npx eslint <changed TypeScript files>
bundle exec rubocop <changed Ruby files>
```

Before committing, follow the repository’s current `test-confidence` requirement when credentials are available. If it cannot run, record that limitation and the manually selected equivalent checks.

## Final audit record

The validation branch should publish a compact table with one row per required behavior:

| Requirement                        | Test or artifact                   | Result | Notes |
| ---------------------------------- | ---------------------------------- | ------ | ----- |
| No product-page Inertia dependency | Import traversal and bundle report |        |       |
| Server-rendered initial content    | HTML/stream assertion              |        |       |
| Product behavior parity            | Functional matrix                  |        |       |
| Rails authority                    | Request and mutation tests         |        |       |
| Visual parity                      | Screenshot comparison              |        |       |
| Accessibility parity               | Axe and keyboard report            |        |       |
| Performance disposition            | Production-twin report             |        |       |

Missing or indirect evidence is an incomplete migration, not a pass.
