## Summary

Commit `fa19e1c8fbc1f3ed488123f80ed52dd30b072c3f` correctly hardens the public RSC routing boundary. It places specialized endpoints before wildcard document routes, makes each RSC route retain its host constraint, and prevents explicitly JSON-accepting requests from being treated as HTML documents. The request-level coverage exercises the relevant behavior across the Gumroad root domain, seller subdomains, seller custom domains, and product custom domains.

## Issues

No findings at or above the 80% confidence threshold.

## Checklist

- Targeted tests pass: 36 RSpec examples and 6 Rails tests, 0 failures.
- `git diff HEAD^ HEAD --check` passes.
- PR-only requirements (description, visual evidence, QA steps, self-review, and AI disclosure) cannot be assessed from a local commit.

## Verdict

Approve. This is a good solution for the routing collision: route ordering protects known specialized paths, while the composite host/request constraints prevent an RSC route in one domain block from leaking into another host class. The explicit JSON exclusion is a useful second boundary for routes whose HTML format is defaulted.
