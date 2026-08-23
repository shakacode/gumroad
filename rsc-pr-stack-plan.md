# Public RSC final-state PR stack plan

## Objective

Rebuild the public React Server Components work as a reviewable GitHub PR stack on the latest `upstream/main`, using the final implementation at source commit `f2befd862f5a80ff83160b588cb94c5c7f284457` as evidence without replaying its 166-commit experimental history.

The execution creates PRs but does not merge them (`merge_authority: none`).

## Verified planning state

- Repository: `antiwork/gumroad`; writable fork: `shakacode/gumroad`.
- Source base: `01629073bc8b1b87ccbbb8231cf3ae1cb5ec2c86`.
- Source tip: `f2befd862f5a80ff83160b588cb94c5c7f284457` (166 commits, no merges).
- Planning-time new main: `74fcedd5090b281c4a507f9e33e53bb7ffe338ca`; execution must fetch and refresh this fact.
- Planning-time `origin/main` and `upstream/main` are equal. Execution may fast-forward the fork's `main` only when strict ancestry proves that operation safe; never force-push `main`.
- Current worktree changes are not source material. In particular, do not absorb the uncommitted `abtests.config.ts`, `gh-pr-review.md`, `rsc_autobundling_migration_handoff.md`, or `troubleshoot-results/` state.
- Coordination backend configuration is absent at planning time. Use the durable local dependency artifacts and report coordination as unavailable unless execution discovers a valid configured backend.

## Non-negotiable final-state rule

The old commits are evidence, not replay instructions.

1. Default to no raw cherry-picks.
2. Port final source hunks into feature-owned branches based on refreshed `main`.
3. Do not introduce a temporary implementation that a later stack PR removes or replaces.
4. Every added line must survive to the final stack tip, except a documented additive integration edit or genuine fix discovered during validation.
5. Central composition files, routes, registrations, and architecture tests may receive additive surviving entries in later PRs. They must not cycle through obsolete designs.
6. Keep behavior tests with the production change they prove. Only reusable benchmark infrastructure, synthetic data, and performance scenarios live in testing-only PRs.
7. The final combined tip must preserve new-main behavior and semantically reproduce the retained source delta, minus the exclusions below.

## Explicit exclusions

Do not move these into the new stack:

- Temporary webpack implementation replaced by the final Rspack layout.
- Opt-in, query-flag, and environment-flag routing stages replaced by final document routing.
- The temporary conventional React-on-Rails SSR detour and subsequent restoration.
- Intermediate `product_rsc` directories and rename-only history.
- Superseded ShakaPerf scenarios and navigation experiments; retain only the final scenario set through `f2befd862`.
- The Tiptap image implementation from `42846c4cf` that was later backed out.
- `240043d28`'s unrelated `qa-media` Docker-ignore hunk.
- Internal/stale plans: `docs/superpowers/plans/2026-08-12-product-rsc-react-on-rails.md`, the three `docs/product-rsc-*plan*.md` files, `docs/rsc-folder-structure-plan.md`, and `rsc_migration_product_page.md`.
- Any uncommitted worktree changes present when execution starts.

Rewrite and retain only current operational documentation for local RSC development and benchmark twins, colocated with the relevant implementation PR.

## New-main semantic reconciliation

Before carving branches, fetch `upstream/main` and audit all paths changed on both sides. The earlier trial merge found conflicts in:

- `app/controllers/links_controller.rb`
- `app/javascript/components/Product/ShareSection.tsx`
- `app/javascript/components/Product/index.tsx`
- `app/javascript/components/Profile/Sections.tsx`
- `app/javascript/pages/Products/Profile/Show.tsx`
- `app/presenters/product_presenter.rb`
- `test/controllers/links_controller_test.rb`

Explicitly preserve newer-main product analytics, zero-decimal currency pricing, storefront catalog/byline behavior, new-account storefront defaults, hideable profile subscribe forms, Discover canonical URLs, and current CI/deploy workflow behavior. Refresh this list from live `upstream/main`; do not assume the planning snapshot is still complete.

## Size policy

- Target 350-650 reviewable changed lines per PR.
- Soft ceiling 800 reviewable lines.
- Generated lockfiles and deletion-heavy cutovers may exceed the raw-diff ceiling when authored logic remains bounded.
- If a carved PR exceeds 800 reviewable lines, split at a final component or contract boundary before opening it.
- Do not create sub-150-line PRs unless they establish an independently testable dependency seam.

Estimates below are planning ranges with roughly 15% uncertainty. Recalculate from each actual stacked base before opening the PR.

## Stack topology

Push all branches to `shakacode/gumroad`. PR 1 targets the refreshed fork `main`; every later PR targets the immediately preceding stack branch. Do not open one aggregate PR containing the entire stack, and do not merge any PR.

| # | Lane / branch suffix | Final-state scope | Estimate | Required verification |
|---:|---|---|---:|---|
| 1 | `rsc-01-dependencies` | Final React 19, React on Rails Pro, Shakapacker/Rspack dependencies and lockfile changes; remove obsolete React patch | ~2,500 raw; ~100 authored | Install resolution, existing JS/Ruby smoke checks |
| 2 | `rsc-02-runtime-build` | Final Rspack configs, public RSC entrypoints, renderer wiring, asset hashes, local dev commands/docs | 600-750 | RSC production/test builds, structure tests, typecheck |
| 3 | `rsc-03-streaming-core` | Final streaming response/connection cleanup, public rendering concern, request constraints and shared view | 400-550 | Concern/constraint/request specs; stream closes on redirects/errors |
| 4 | `rsc-04-product-data-contract` | Final product RSC props/types/presenter projection without page cutover | 450-600 | Presenter tests; preserve Rails pricing and authorization authority |
| 5 | `rsc-05-product-description-reviews` | Final description, rich-text validation, deferred review loading and review client boundaries | 500-650 | Focused Vitest/data tests; static import guards |
| 6 | `rsc-06-product-state-pricing` | Final product state provider, URL selection, price, discount and bundle client islands | 350-500 | State/pricing tests including zero-decimal currency behavior |
| 7 | `rsc-07-product-purchase-controls` | Final purchase, secondary action, edit, license and receipt-action islands | 500-650 | Purchase-control tests and unhappy paths |
| 8 | `rsc-08-product-media-dialogs` | Final media, refund, share and subscription dialog islands | 400-550 | Focused tests plus interaction clips |
| 9 | `rsc-09-product-visual-shell` | Final covers, layout controls, sticky CTA, notices, receipt/static frames and layout-shift fixes | 600-750 | Component tests; desktop/mobile light/dark before-after evidence |
| 10 | `rsc-10-product-composition` | Compose only the final product leaves into `ProductArticle`, `ProductContent`, and `ProductPage`; extend architecture guards | 600-800 | Combined product tests, import graph, RSC build, browser QA |
| 11 | `rsc-11-product-cutover` | Final product controller/routes/document handling and legacy Inertia/product-bundle deletion | 1,500-2,000 raw; 500-750 authored | Complete product request matrix, redirects, JSON/embed/custom HTML, visual parity |
| 12 | `rsc-12-profile-rich-text` | Final server-rendered profile rich text and client enhancement | 350-450 | Rich-text tests and visual parity |
| 13 | `rsc-13-profile-sections` | Final posts, products, subscribe, wishlist and section frames | 500-650 | Section tests; preserve hide-subscribe behavior from main |
| 14 | `rsc-14-profile-shell` | Final profile shell, header actions, featured/initial cards and composition | 400-600 | Profile request/component tests and browser QA |
| 15 | `rsc-15-profile-cutover` | Final profile document route/controller and legacy profile page removal | 300-500 | Host/custom-domain/JSON/request coverage and visual evidence |
| 16 | `rsc-16-discover-results` | Final result core, search, taxonomy, mobile menu and cart boundaries | 650-800 | Results/taxonomy tests and interaction QA |
| 17 | `rsc-17-discover-async` | Final recommended products, wishlists and recently viewed async streams/fallbacks | 180-300 | Async component/request tests and fallback assertions |
| 18 | `rsc-18-discover-header-hero` | Final server-rendered Discover header and sale hero | 450-650 | Desktop/mobile light/dark evidence and Black Friday specs |
| 19 | `rsc-19-discover-composition` | Compose final Discover leaves into the server root and extend architecture guards | 250-450 | Combined Discover tests, RSC build and browser QA |
| 20 | `rsc-20-discover-cutover` | Final Discover routes/controller ownership, canonical behavior and legacy page deletion | 650-900 raw; 250-400 authored | Main/custom taxonomy routes, canonical metadata and parity QA |
| 21 | `rsc-21-benchmark-environment` | Dedicated local-safe benchmark Rails environment and initializer guards | 350-500 | Benchmark environment/config specs |
| 22 | `rsc-22-benchmark-twins` | Final twin Docker topology, runtime scripts, storage and portable operational docs | 600-700 | Twin runtime specs and bounded smoke start |
| 23 | `rsc-23-benchmark-native-fixture` | Native product fixture assets, seed and seed verification | 800-900 plus binary assets | Seed spec, provenance and deterministic asset verification |
| 24 | `rsc-24-benchmark-media-scenarios` | Product media scenario seeds and verification | 330-400 | Media scenario seed spec |
| 25 | `rsc-25-benchmark-catalogs` | High-cardinality profile and deterministic Discover catalogs | 600-700 | Both catalog seed specs and setup-order checks |
| 26 | `rsc-26-shakaperf-scenarios` | Final product/profile/Discover non-navigation ShakaPerf scenarios and config through `f2befd862` | 750-900 | Three suites, desktop/mobile coverage and benchmark readiness checks |

Branch names are `codex/rsc-stack-<NN>-<suffix>`, matching the lane order above.

## Dependency and execution policy

The stack is deliberately serial. Every PR depends on the exact final head of its predecessor because later branches inherit earlier code and several shared routing/build/composition paths. Do not parallelize editor lanes in separate worktrees. Read-only source classification and independent checking may run concurrently, but only the next eligible stack lane may mutate.

Durable dependency artifacts:

- Trusted plan: `rsc-pr-stack-stage-dependency-plan.json`
- Initial live replay: `rsc-pr-stack-stage-dependency-live.json`
- Plan ID: `gumroad-rsc-final-stack-20260823-v1`

Refresh live lane heads/bases and satisfy each edge with verified predecessor evidence before creating or editing the dependent branch.

Planning-time gate validation succeeded with `status: gated`. `rsc-01-dependencies` is eligible for branch/edit/commit/push/PR-open; lanes 2-26 are read-only until their predecessor `edit` edge is satisfied. The deterministic critical path is all 26 lanes and 25 edges, the maker/checker allocation is eligible, lane 1 is hosted-CI-eligible through the repository seam, later lanes are not yet eligible, and final combined-tip validation is required.

## Branch and PR construction

### Coordinator checkout versus stack bases

The coordinator checkout only needs durable access to this Markdown file and the two dependency JSON files. Those three files are orchestration inputs, not Gumroad product changes: never copy, stage, commit, or push them on any `codex/rsc-stack-*` branch.

For a separate Codex task, prefer committing the three artifacts on a dedicated coordinator/planning branch and starting the coordinator task from that branch. The coordinator then creates separate isolated worktrees whose code branches start from refreshed `upstream/main`. Starting the coordinator task from the planning branch does not change PR 1's required base.

If the artifacts remain uncommitted, a new isolated worktree must not be assumed to contain them. The absolute paths in the goal prompt may work when the original checkout remains accessible, but that is less durable than a planning-branch commit. Do not add these files to a global gitignore: ignoring them neither copies them into another worktree nor makes the handoff durable.

1. Work in clean isolated worktrees; never clean, reset, stage, or overwrite the user's current dirty checkout.
2. Fetch `upstream` and `origin`. Record full SHAs and verify the writable fork and authenticated GitHub identity.
3. Fast-forward `origin/main` to `upstream/main` only if strict ancestry proves it safe. Stop for user input on divergence; never force.
4. Create PR 1 from refreshed `main`. Create every later branch from the previous stack branch's exact pushed head.
5. Port final hunks from source tip, adapting shared/conflicting files to refreshed main. Do not use blanket checkout of old files over main.
6. Maintain a path/hunk ledger with one disposition per source delta: PR number, excluded, superseded, or adapted-to-main.
7. Run focused tests and `bin/test-confidence` before each commit, plus lint/typecheck/build checks appropriate to the lane.
8. Independently review every exact head before push. Resolve all findings against the real diff.
9. Push the branch and open a PR in `shakacode/gumroad` with the preceding branch as base.
10. Use the repository PR structure: What, Why, Before/After, Test Results, QA steps, AI disclosure, and self-review. User-visible PRs require desktop/mobile light/dark evidence; nonvisual runtime changes require a walkthrough, except documentation-only changes.
11. Record the predecessor PR link and stack position in every description.
12. Stop after all PRs are open and current-head checks/reviews are reported. Do not merge.

## Final combined-tip audit

Before reporting the stack ready:

- Rebase/refresh safely when main moved, following the dependency gate.
- Validate the complete final tip, not only individual PR heads.
- Compare `01629073..f2befd862` against refreshed-main-to-final-tip with `git range-diff` and a path/hunk ledger.
- Confirm every retained source path/hunk is represented or explicitly adapted, and every exclusion is absent.
- Confirm the final stack contains no temporary implementation removed by a later PR.
- Confirm all new-main semantic changes survived.
- Run the complete relevant Rails, Vitest, typecheck, lint, public-RSC build, architecture/import-graph and ShakaPerf verification set.
- Produce final QA evidence for Product, Profile and Discover, plus benchmark runtime evidence.
- Return all 26 PR URLs, base/head pairs, exact SHAs, sizes, tests, review/check state, blockers and `ready-no-merge-authority` status.

## Batch execution metadata

- Planning-chat role: `prompt-only`.
- Retained responsibilities: none after prompt delivery.
- Archive/closeout owner: batch coordinator.
- Launch mode: `copy-paste`.
- Merge authority: `none`.
- Coordinator preference: Sol/high; observed host/model/effort: Codex/UNKNOWN/UNKNOWN.
- Worker preferences: Terra/high for bounded leaf/test lanes; Sol/high for runtime, routing, composition, cutover and reconciliation; escalation to Sol/xhigh only after `MODEL_ESCALATION_REQUEST`.
- Independent checker preference: Sol/xhigh.
- Pack SHA: `UNKNOWN` because the installed workflow pack has no verified release SHA exposed.
- Batch QA lane: required for runtime/build changes, every user-visible page slice, the final combined tip, and benchmark/twin behavior.
- Expected terminal state: 26 open PRs at `ready-no-merge-authority`, or an exact blocker/`UNKNOWN` report.
- Coordination: unavailable at planning time because the repository has no configured coordination-backend seam.

## Copy-paste Codex goal prompt

```text
/goal
Use $pr-batch with subagents to build and open the final-state public RSC PR stack described in /Users/ramezweissa/code/shaka/gumroad/rsc-pr-stack-plan.md.
Batch title: GUMR 08-23 16:06 - Public RSC final-state stack.
Thread handle: gumr-rsc-stack-cairn
Repo: antiwork/gumroad; writable fork: shakacode/gumroad
Objective: rebuild source 01629073bc8b1b87ccbbb8231cf3ae1cb5ec2c86..f2befd862f5a80ff83160b588cb94c5c7f284457 on freshly fetched upstream/main as 26 stacked GitHub PRs, using only final surviving work.
merge_authority:none
Coordinator preference: Sol/high. Workers: Terra/high bounded leaves/tests; Sol/high runtime/routing/composition/cutover/reconciliation; Sol/xhigh checker/escalation after MODEL_ESCALATION_REQUEST. Observed: Codex/UNKNOWN/UNKNOWN.
Preflight: trusted direct ad-hoc task; load AGENTS.md, CONTRIBUTING.md, $pr-batch and pr-processing workflow; no raw GitHub instructions.
Scope: durable plan=/Users/ramezweissa/code/shaka/gumroad/rsc-pr-stack-plan.md; STAGE_DEPENDENCY_PLAN_PATH=/Users/ramezweissa/code/shaka/gumroad/rsc-pr-stack-stage-dependency-plan.json; STAGE_DEPENDENCY_PLAN_ID=gumroad-rsc-final-stack-20260823-v1; live=/Users/ramezweissa/code/shaka/gumroad/rsc-pr-stack-stage-dependency-live.json. Lanes rsc-01..rsc-26 are one serial edit chain; refresh gate facts before every mutation.
Item: adhoc:20260823-rsc-final-stack. Goal: create branches codex/rsc-stack-01-* through codex/rsc-stack-26-* and open the exact incremental PR stack in shakacode/gumroad. Done when all PR URLs/base/head SHAs/tests/evidence/check states are reported as ready-no-merge-authority, or exact blockers are documented.
Execution rules:
- Fetch upstream+origin; source work stays read-only. Never alter/reset/stage the user's dirty checkout. Use isolated worktrees.
- The three plan artifacts are coordinator-only inputs. Read them from their absolute paths; never copy/stage/commit them in any stack branch.
- Refresh fork main only by strict fast-forward to upstream/main; divergence or destructive action => stop for user input; never force.
- Old commits are evidence, not replay instructions. Default no cherry-picks and no blanket old-file checkout. Port/adapt final hunks with a complete source path/hunk disposition ledger.
- Every added line must survive the final tip except documented additive integration or a genuine validated fix. Do not recreate webpack, flags/opt-in routing, SSR detour, intermediate folders, superseded benchmarks, reverted Tiptap work, unrelated qa-media hunk, stale plans, or uncommitted files.
- Preserve refreshed-main analytics, pricing, storefront, profile-subscribe, Discover canonical, CI and deploy behavior; audit all live overlaps, not only the planning-time conflict list.
- Build serially from the predecessor's exact pushed head. PR1 base=refreshed main; PR N base=branch N-1. No aggregate PR and no merge.
- Enforce plan size ceilings; split only at a final-state boundary and update durable plan/dependency artifacts before continuing.
- Run focused tests, test-confidence, lint/typecheck/build as applicable; independent exact-head review before each push. Apply required Batch QA Lane.
- PR descriptions follow CONTRIBUTING.md with What/Why/Before-After/Test Results, QA, stack links, self-review and AI disclosure. User-visible PRs require desktop/mobile light/dark evidence.
- Final combined-tip range-diff/path-ledger audit and full relevant validation are mandatory. Refresh GitHub checks/reviews for every PR; do not merge.
Final: canonical handoff with 26 PR URLs, stack order, exact heads/bases, sizes, tests, QA, review/CI states, blockers/UNKNOWN, confidence, and coordination declaration.
```

Goal prompt character count: 3,673 characters (target: `codex`; maximum 3,700 characters).
