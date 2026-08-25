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

- Control: <http://localhost:3100/healthcheck>
- Experiment: <http://localhost:3200/healthcheck>

When finished, stop and remove the disposable twins:

```bash
shaka-perf servers stop-containers
```

The server workflow loads the deterministic benchmark catalogs after twin
isolation is established, and the compare workflow runs the configured suites.
