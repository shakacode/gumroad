# ShakaPerf benchmark twins

The twin harness runs two clean checkouts in the local-safe `benchmark`
environment. Each side gets its own MySQL, MongoDB, Redis, Elasticsearch, and
MinIO services, plus Memcached on that application container's loopback
interface. No production service or data is used.

## Start clean twins

Use Ruby 3.4.3 and Node 22.22.2. Point the control side at a clean sibling
checkout containing the complete benchmark-environment foundation, then run:

```bash
export SHAKAPERF_CONTROL_DIR="../gumroad-control"
shaka-perf servers build -c abtests.config.ts --no-cache
shaka-perf servers start-containers -c abtests.config.ts
shaka-perf servers start-servers -c abtests.config.ts
```

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
shaka-perf servers stop-containers -c abtests.config.ts
```

This foundation does not load benchmark catalogs or run measurements. Later
benchmark lanes add fixtures and comparison suites after twin isolation is
established.
