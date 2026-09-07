# Gumroad contribution action plan

Our goal is for Gumroad maintainers to accept two focused contributions: ShakaPerf performance CI, then a React on Rails Pro prototype using React Server Components (RSC) with convincing performance evidence.

This is a ShakaCode fork planning note. Use [shakacode/gumroad](https://github.com/shakacode/gumroad) as the implementation and benchmark source; use [the demo repository](https://github.com/shakacode/react-on-rails-demo-gumroad-rsc) to present the resulting evidence.

## Actions in order

1. **Agree on scope and acceptance.** Justin leads maintainer alignment on the two proposals, ongoing maintenance, and explicit ShakaPerf CI and React on Rails Pro licensing/support terms. Confirm proposed owners and dates at the next Monday meeting.
2. **Extract the minimum and reconcile the baseline.** Ramez leads implementation. Reuse the existing PR stack as source material, pause broader Profile/Discover migration and duplicate demo infrastructure, and prepare focused changes against current upstream. Apply shared benchmark fixes to both control and candidate; record exact commits, builds, fixtures, tool versions, and run conditions.
3. **Deliver PR 1: ShakaPerf performance CI.** Add a pinned, reproducible comparison of base versus proposed changes in Gumroad's existing CI, independent of RSC. Start with one deterministic Product scenario and an advisory performance report with downloadable artifacts. Demonstrate a no-change comparison, detection of a temporary injected regression, and a real change. Report noise, runtime, and cost; distinguish failed measurements from measured regressions.
4. **Deliver PR 2: one opt-in Product page with RSC.** Cover one ordinary digital product and one layout behind a default-off flag and allowlist. Preserve an Inertia rollback. Verify visual, accessibility, pricing, cart, and navigation parity plus renderer-failure behavior. Use PR 1's harness to publish repeated matched desktop/mobile measurements, including LCP, JavaScript bytes, TTFB, and renderer CPU/memory. Resolve correctness regressions and explain operational tradeoffs before claiming success.
5. **Package and submit the two contributions.** Each PR gets a current What/Why/Before-After/Test Results description, reproducible QA, relevant video evidence, self-review, and AI disclosure. Justin owns submission through [Gumroad's contribution process](https://github.com/antiwork/gumroad/blob/main/CONTRIBUTING.md) and tracking maintainer feedback through acceptance.

**Next engineering milestone:** a reviewable ShakaPerf CI PR with a reconciled baseline and recorded validation runs. Agree on measured acceptance thresholds before the final RSC benchmark campaign.

## Weekly Monday meeting

Use [React On Rails Weekly Progress — 2026](https://docs.google.com/document/d/1F79npHg83vGBe2Y-s7B_GSou0vBkSb6X-P680Mb8nGE/edit?tab=t.acdj6bjdrpij#heading=h.b7odcmvltxb) as the shared home for weekly notes.

For each Monday, record:

- Evidence delivered since the last meeting: PRs, benchmark runs, and QA results.
- Blockers and decisions needed to advance the two contributions.
- Next deliverable, owner, and due date for each active action.

Keep weekly status and meeting history in the Google Doc. Update this plan when scope or acceptance criteria change.
