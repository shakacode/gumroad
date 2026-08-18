# ShakaPerf benchmark twins

The twin harness runs Rails in the dedicated `benchmark` environment. It keeps
production-style code loading, caching, React, Vite, and Rspack behavior while
using only the disposable local twin databases, caches, search service, MinIO,
and renderer.

## Start fresh twins

Confirm Docker Desktop is running and the control checkout configured in
`abtests.config.ts` is at the intended revision. Then run:

```bash
cd /Users/ramezweissa/code/shaka/gumroad
nvm use 24.13.1
shaka-perf servers build -c abtests.config.ts
shaka-perf servers start-containers -c abtests.config.ts
shaka-perf servers start-servers -c abtests.config.ts
```

The image build precompiles production Vite assets with an empty
`VITE_RUBY_ASSET_HOST` and builds the experiment's production product-RSC
bundles. Container setup resets and seeds only the twin services.

Use these storefront URLs after both readiness messages appear:

- Control: <http://o365itpros.localhost:3100/l/O365IT?layout=discover&recommended_by=search>
- Experiment: <http://o365itpros.localhost:3200/l/O365IT?layout=discover&recommended_by=search>

Do not run `/shakaperf-twin/setup-products` against an existing twin unless an
intentional fixture reset is required. It drops, recreates, loads, seeds, and
reindexes that twin's isolated databases.

## Verify the asset origin

Both the initial entries and lazy chunks must resolve against the current
seller storefront. In the browser console, run:

```js
const requests = performance.getEntriesByType("resource").filter(({ name }) => name.includes("/vite/assets/"));

const grouped = Object.groupBy(requests, ({ name }) => new URL(name).pathname.split("/").at(-1));

Object.entries(grouped).filter(([, items]) => new Set(items.map(({ name }) => new URL(name).origin)).size > 1);
```

The result must be `[]`. This should also return one origin matching the page:

```js
[...new Set(requests.map(({ name }) => new URL(name).origin))];
```

No request should use `assets.gumroad.com`, and the page must stay on HTTP
without a redirect.

## Generate a comparison manually

Run the comparison separately when the twins are ready:

```bash
cd /Users/ramezweissa/code/shaka/gumroad
nvm use 24.13.1
shaka-perf compare -c abtests.config.ts --full-report-zip
```

The setup and verification workflow does not run this command automatically.

When finished:

```bash
shaka-perf servers stop-containers -c abtests.config.ts
```
