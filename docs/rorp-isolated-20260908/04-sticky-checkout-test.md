# Exercise the visible sticky purchase control

Add the existing phone sticky Add to cart flow without reducing the baseline's four landing scenarios or changing its measurement settings. Wait for the sticky link to be on screen at scrollY zero and receive pointer events, then click coordinates so Playwright cannot scroll an offscreen link into view. Confirm the app reveals the edition controls before continuing to checkout. The prior inline-only registration is retained as a commented alternative.

Reuse existing benchmark navigation setup, local-network permission, and localhost-origin correction. Wait for the expected product and Stripe test-mode card field. Braintree client-token retrieval is explicitly stubbed, and PATCH cart persistence is intercepted to avoid writing shared fixture state. There are no PayPal response-body or CSP header rewrites. No payment is submitted. These are checkout benchmark fixes, not an RSC performance advantage.

Validation: TypeScript and changed-file ESLint, followed by the focused phone visual/behavior comparison using this exact test and navigation helper against the existing local twins. That check validates the interaction and server checkout configuration; those running twins contain other work and are not a before/after measurement of the isolated branch. The shell's production build is validated separately in decision 01.
