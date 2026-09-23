# ShakaPerf benchmark twins

The twin harness runs two clean checkouts in the local-safe `benchmark`
environment. Each side gets its own MySQL, DynamoDB, Redis, Elasticsearch, and
MinIO services, plus Memcached on that application container's loopback
interface. No production service or data is used.

## Install ShakaPerf

Install the repository dependencies required by `abtests.config.ts`, then install
the ShakaPerf CLI from npm:

```bash
npm ci
npm install --global shaka-perf@0.3.0
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
precompiles Vite, Rails, and optional public RSC assets in both images. The
image's RSC build uses the benchmark defaults so the image remains complete.
After containers start, a separate setup step recompiles only those RSC bundles
using each side's runtime host and resolved application port. This keeps plain
`shaka-perf servers` compatible with shared Docker build arguments and with a
control checkout that does not define `build:public-rsc`.

Container setup resets and normally seeds only that twin's databases, then
rebuilds its RSC assets with the runtime origin when that script exists. It does
not reinstall packages or rerun Vite or Rails asset compilation. It also starts
loopback Memcached if needed; rerunning setup reuses the healthy daemon. The
control and experiment use separate cache namespaces in separate containers.

Application and MinIO host ports are assigned per checkout and stay stable
across runs. Set both variables in either pair to pin them explicitly:

```bash
export SHAKAPERF_CONTROL_PORT=3100 SHAKAPERF_EXPERIMENT_PORT=3200
export SHAKAPERF_CONTROL_S3_PORT=9100 SHAKAPERF_EXPERIMENT_S3_PORT=9101
```

With those example pins, readiness is fixture-independent:

- Control: <http://control.localhost:3100/healthcheck>
- Experiment: <http://experim.localhost:3200/healthcheck>

The `control` and `experim` host labels have equal length so benchmark URLs
do not differ in size solely because of the side's name.

When finished, stop and remove the disposable twins:

```bash
shaka-perf servers stop-containers
```

The server workflow loads the deterministic benchmark catalogs after twin
isolation is established, and the compare workflow runs the configured suites.
Product setup also applies and verifies the seller-scoped RORP flag after the
`bgfjk` fixture exists. Both sides default to `enabled`, which is required for
isolated optimization comparisons and is harmless when the control revision
predates the flag. For the final same-commit flag comparison, recreate the
twins with only the control side disabled:

```bash
SHAKAPERF_CONTROL_PRODUCT_PAGE_RORP=disabled \
  SHAKAPERF_EXPERIMENT_PRODUCT_PAGE_RORP=enabled \
  shaka-perf servers
```

The setup fails instead of benchmarking if the stored feature state does not
match the requested state.

## Refresh running twins without rebuilding containers

Use this loop when the interactive `shaka-perf servers` menu is already running
and a change only requires new source or RSC assets:

```text
save experiment changes -> sync control changes -> rebuild both RSC bundles -> restart servers -> compare
```

The running menu watches the experiment checkout and automatically copies saved
files into the experiment volume. It does not watch the separate control
checkout, so control changes still need `servers sync-changes control`.
ShakaPerf normally proxies commands to the running menu, which rejects manual
syncs to avoid racing its watcher; the control sync therefore uses
`SHAKAPERF_NO_PROXY=1`.

Run the complete refresh from the repository root:

```bash
bin/refresh-shakaperf-twins
```

The helper:

1. syncs Git-visible control changes into the control volume;
2. runs `/shakaperf-twin/build-public-rsc` in both containers, preserving each
   side's benchmark hostname and port;
3. reapplies and verifies each side's requested product-page feature state;
4. calls `servers start-servers`, which the live menu interprets as **Restart
   servers** (the same action as menu option `6`).

It does not rebuild images, restart containers, reset databases, or run a
comparison. Run the desired comparison after the refresh finishes:

```bash
shaka-perf compare
```

Pass `--skip-control-sync` when the control checkout has not changed. Use
`--dry-run` to print the commands without executing them. Set `CONFIG_PATH` if
the configuration is not the repository's `abtests.config.ts`:

```bash
CONFIG_PATH=/path/to/abtests.config.ts bin/refresh-shakaperf-twins --dry-run
```

`sync-changes` only copies files Git reports as changed. Dependency,
Dockerfile, or other image-level changes still require a rebuild from the menu.
Switching a clean checkout to another commit does not copy that commit's files
into an existing volume. For original-baseline comparisons, rebuild the affected
image and recreate its application volume from the intended checkout. Verify
the served source and dependency versions before measuring; a checkout SHA
alone does not identify the code running in the container. Vite source changes
also require a Vite build: the refresh helper only rebuilds public RSC assets.
If the interactive menu is not running, `servers start-servers` starts a new
foreground server session instead of returning after a restart.

## Asset and browser cache behavior

Each stack serves shared assets from its root origin: `http://control.localhost:3100`
for control and `http://experim.localhost:3200` for experiment (or the configured ports).
Seller pages (for example `luisfurushio.control.localhost`) and `/cart_items_count`
use those same URLs. Keeping sellers beneath each stack root also puts them in
the same Chromium HTTP cache partition; `seller.localhost` and bare `localhost`
do not share that partition ([Chrome cache partitioning](https://developer.chrome.com/blog/http-cache-partitioning/)). The live demos use
their respective `https://gumroad-inertia.reactonrails.com` and
`https://gumroad-rorp.reactonrails.com` roots. Static responses allow cross-origin
module and font loading and retain the benchmark's immutable cache headers.
Static files run before Rack::Cors to avoid an origin-dependent cache variant.
RORP compiles its chunk prefix from `BENCHMARK_PROTOCOL` and `CUSTOM_DOMAIN`,
or the local `BENCHMARK_HOST` and `DEV_LANE_PORT`. The container setup step
compiles these bundles once with its side's configured host and port. Do not use Rspack's `"auto"`
public path: the RSC manifest emits an empty prefix and SSR requests chunks
relative to the seller page. Rerun container setup when changing the RORP asset
origin.

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
