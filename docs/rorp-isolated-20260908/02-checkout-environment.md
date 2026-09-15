# Configure benchmark checkout without response rewrites

Retain the PayPal sandbox demo ID (`sb`) as an overridable default in the local Rails launcher and as the RORP Control Plane benchmark GVC setting. The arbitrary .env.test client ID was rejected by the real PayPal SDK; `sb` loaded successfully. No credentials or test response mutation are added to application code. No presenter change is retained.

benchmark.rb supplies the narrow Google Fonts connect source used by SecureHeaders. Stripe fetches that stylesheet from the host page; development's broad http: permission masked the omission. No general scheme allowance, reloading, development instrumentation, or SSR caching is introduced. The test header rewrite is unnecessary with this server configuration.

The prior live Docker check confirmed both servers emitted the Google Fonts source and the PayPal demo ID; the sticky checkout browser check passed with zero differing pixels without either response rewrite. This isolates those same configuration changes onto d66bb3dcf. Ruby lint, shell syntax, formatting, and benchmark Rails initialization passed for the isolated patch. The boot check uses an ephemeral encryption key, as the benchmark launcher does, and confirms eager loading, disabled reloading, controller caching, and the configured font source. Control Plane requires a normal image deployment for the CSP source change; its environment alone is insufficient. No deployment is performed by this isolation task.

Braintree placeholder keys do not authenticate client-token generation. Keep real sandbox payment verification separate; the following test commit retains an explicit token stub and intercepts cart persistence without submitting a payment.
