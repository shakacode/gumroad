# Retained RORP baseline changes

Branch: `codex/rorp-cpln-baseline`. Base: `d66bb3dcf1ce690f1645192d24a94ee410597786`. Isolated worktree: `/Users/ramezweissa/code/shaka/gumroad-rorp-isolated`. The original checkout remains on `backup`; its staged, unstaged, and untracked work is not moved or reset.

## Retained from backup

| Change                               | Rationale                                                                                                         | Details                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Profile RSC shell composition        | Server composition avoids putting the shared shell and legacy Profile implementation beneath one client boundary. | [01](01-profile-shell.md)                                                |
| Benchmark checkout configuration     | PayPal SDK demo ID and narrow Google Fonts CSP permission allow rendering without response rewriting.             | [02](02-checkout-environment.md)                                         |
| Provider-specific reCAPTCHA blocking | Preserve application RSC payload requests whose query data contains recaptcha.                                    | [03](03-rsc-request-blocking.md)                                         |
| Sticky checkout phone test           | Wait for the visible sticky CTA at scroll zero, verify application-driven selection reveal, then verify checkout. | [04](04-sticky-checkout-test.md), [validation](checkout-validation.json) |

## Already present in d66bb3dcf

Product server-rendered content and interactive client boundaries, public RSC views, async Discover props, streaming rendering helpers, and synchronized gzip flushing remain as in the base. They do not need to be copied from later optimization commits. No new streaming implementation was found among the selected post-base changes; the pending view/controller changes were SSR caching and were excluded.

## Excluded from this branch

- Shared responsive Profile header optimization (4ee1a867d).
- Shared receipt ReviewForm loading change (35db5bc9f).
- Shared native thumbnail import optimization (14b7a186e).
- Shared public-file context extraction (e5c4ab3d6).
- All later SSR-cache helpers, token normalization, controller/presenter nonce changes, cached streaming views, and the Discover resolved-props cache path.
- Inertia SSR Docker build/renderer additions and its generated-bundle ignore entry.
- Later benchmark throttling, sample-count, parallelism, and landing-coverage reductions; original abtests.config.ts and the four baseline product landing scenarios remain.
- Historical full reports, replay artifacts, unrelated deployment edits, and other workspace changes.

Benchmark checkout fixes are intentionally retained even though they are shared environment requirements, not intrinsic RSC performance wins. There is no new SSR caching. Existing base caches are neither expanded nor reconfigured.

## Validation

The isolated shell passes TypeScript, changed-file ESLint, and a fresh production public-RSC build in a separate Docker directory. Environment changes pass RuboCop, shell syntax, formatting, and a benchmark Rails initialization check confirming eager loading, caching, and disabled reloading. Final TypeScript and changed-file ESLint pass. The exact added checkout test and shared hook pass against both existing local twins with zero differing pixels; source hashes and the report location are recorded in checkout-validation.json. The resulting checkout capture shows the English edition at $40 and the test waits for the Stripe card field.

The running twins contain other changes, so their behavior check is not a performance comparison of this isolated branch. No full benchmark or new performance claim is made. The isolated branch has not been deployed to either live twin or Control Plane. No bundler/generated output, dependency, or original backup working file is committed by this task.
