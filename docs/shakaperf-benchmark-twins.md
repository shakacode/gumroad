# ShakaPerf benchmark twins

The twin harness runs two clean checkouts in the local-safe `benchmark`
environment. Each side gets its own MySQL, MongoDB, Redis, Elasticsearch, and
MinIO services, plus Memcached on that application container's loopback
interface. No production service or data is used.

## Install ShakaPerf

Install the repository dependencies required by `abtests.config.ts`, then install
the ShakaPerf CLI from npm:

```bash
npm ci
npm install --global shaka-perf
```

## Start clean twins

Use Ruby 3.4.3 and Node 22.22.2. Point the control side at a clean sibling
checkout containing the complete benchmark-environment foundation. From the
repository root, start the twin servers:

```bash
export SHAKAPERF_CONTROL_DIR="../gumroad-control"
shaka-perf servers
```

Leave that command running. In a second terminal, also from the repository
root, run the comparisons:

```bash
shaka-perf compare
```

Both commands automatically detect `abtests.config.ts`; no config flag is
needed.

The build copies the repository `.npmrc`, installs with plain `npm ci`, and
precompiles benchmark assets in both images. ShakaPerf forwards the host user,
UID, and GID to the image build; the rendered Compose bind targets therefore
match `/home/${USER}/app` on both sides.

Container setup resets and normally seeds only that twin's databases. It also
starts loopback Memcached if needed; rerunning setup reuses the healthy daemon.
The control and experiment use separate cache namespaces in separate
containers.

Readiness is fixture-independent:

- Control: <http://control.localhost:3100/healthcheck>
- Experiment: <http://experiment.localhost:3200/healthcheck>

When finished, stop and remove the disposable twins:

```bash
shaka-perf servers stop-containers
```

The server workflow loads the deterministic benchmark catalogs after twin
isolation is established, and the compare workflow runs the configured suites.

## Asset and browser cache behavior

Each stack serves shared assets from its root origin: `http://control.localhost:3100`
for control and `http://experiment.localhost:3200` for experiment (or the configured ports).
Seller pages (for example `luisfurushio.control.localhost`) and `/cart_items_count`
use those same URLs. Keeping sellers beneath each stack root also puts them in
the same Chromium HTTP cache partition; `seller.localhost` and bare `localhost`
do not share that partition ([Chrome cache partitioning](https://developer.chrome.com/blog/http-cache-partitioning/)). The live demos use
their respective `https://gumroad-inertia.reactonrails.com` and
`https://gumroad-rorp.reactonrails.com` roots. Static responses allow cross-origin
module and font loading and retain the benchmark's immutable cache headers.
Static files run before Rack::Cors to avoid an origin-dependent cache variant.
RORP compiles its chunk prefix from `BENCHMARK_PROTOCOL` and `CUSTOM_DOMAIN`,
or the local `BENCHMARK_HOST` and `DEV_LANE_PORT`. Local twin setup rebuilds
these bundles with its configured host and port. Do not use Rspack's `"auto"`
public path: the RSC manifest emits an empty prefix and SSR requests chunks
relative to the seller page. Rebuild when changing the RORP asset origin.

Deploy live changes through the baseline branches' `cpflow-deploy-rorp.yml`
and `cpflow-deploy-inertia.yml` GitHub workflows. Use local builds for testing;
do not upload images or deploy workloads directly.

ShakaPerf clears browser data before the navigation hook; caching stays enabled
during navigation so the cart iframe can reuse the parent's assets. Seller
Profile warm hooks run after that reset and retain `disableStorageReset: true`
for both performance measurements and audits. Keep resource blocking on the CDP-based
`installRequestBlocking` helper; Playwright routing disables HTTP caching.
The primary benchmark includes the real cart iframe and only blocks reCAPTCHA.
Any iframe-blocked run must be labeled as an isolation diagnostic.

Verify with a fresh browser context: both documents must request identical
shared bundle URLs, iframe responses should reuse the browser cache, and a
second context must download those assets again. For warm samples, verify the
measured navigation reuses the warmup assets. Inspect lazy chunks and fonts as
well as entry scripts, and check for CORS or CSP errors. Track all script
responses and failures, including URLs outside `/vite/` and `/public-rsc/`,
so malformed chunk URLs cannot escape the check.
