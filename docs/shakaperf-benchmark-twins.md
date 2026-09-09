# Compare Gumroad changes with ShakaPerf

Use two separate cloned checkouts. ShakaPerf runs each checkout with its own database,
cache, search index, and object store. Both sides use the same seeded products.
The harness uses the Inertia app and the local `benchmark` Rails environment.

## Set up

Install Docker, dockerize, Overmind, GNU parallel, Ruby 3.4.3, and Node 22.22.2.
On macOS, Overmind and GNU parallel are available through Homebrew
(`brew install overmind parallel`). Install the CLI and project packages:

```sh
npm ci
npm install --global shaka-perf@0.3.0
```

The CLI and project `shaka-shared` dependency are pinned to 0.3.0; upgrade them
together. Record `shaka-perf --version` with each run.

Audit screencasts also need FFmpeg. With ShakaPerf 0.3.0, use FFmpeg 7:
FFmpeg 9 removes the `-vsync` option used by the recorder. On macOS:

```sh
brew install ffmpeg@7
export PATH="$(brew --prefix ffmpeg@7)/bin:$PATH"
ffmpeg -version
```

Keep this PATH in the shell that runs ShakaPerf; a global FFmpeg relink is unnecessary.

Clone the shared benchmark baseline into a sibling `gumroad-control` directory.
Keep the harness and fixtures in both checkouts; apply the change under test only
to the experiment. From the experiment checkout:

```sh
git clone https://github.com/shakacode/gumroad.git ../gumroad-control
git -C ../gumroad-control checkout --detach origin/codex/shakaperf-showcase-tests
git -C ../gumroad-control rev-parse HEAD
git rev-parse HEAD
```

Record these full SHAs with the results. To reproduce an existing comparison,
check out its recorded control and experiment SHAs instead of moving branch tips.
`controlDir` reads `SHAKAPERF_CONTROL_DIR` and defaults to the sibling
`gumroad-control`. Set an absolute override only when using another location:

```sh
export SHAKAPERF_CONTROL_DIR="/absolute/path/to/gumroad-control"
```

Build the images, prepare the disposable databases, and launch the apps explicitly:

```sh
shaka-perf servers build
shaka-perf servers start-containers
shaka-perf servers start-servers > /tmp/gumroad-shakaperf-servers.log 2>&1 &
```

`start-containers` resets and seeds both disposable databases. `start-servers`
runs continuously under Overmind; wait for both readiness announcements in its
log before measuring. After changing committed application code, rebuild the
changed image (`shaka-perf servers build --target experiment`), recreate the
containers, and restart the apps so the compiled assets match the source.

Run the focused showcase comparison from the experiment checkout:

```sh
shaka-perf compare --filter "Discover showcase"
```

For a visual-only check:

```sh
shaka-perf compare --filter "Discover showcase" --categories visreg
```

Open `compare-results/full-report.html`. Compare the screenshots and pixel diff.
For performance, inspect each metric, the sample count, and the uncertainty.
The default profile uses 18 paired samples, 100 ms RTT, 2.7 Mbps download and
upload, 200 ms request latency, and 3× CPU slowdown. See [the config](../abtests.config.ts).
Cold and warm cases run on desktop and phone. Accessibility results are separate
from visual and performance results.

For the complete registered suite and standalone experiment audits:

```sh
shaka-perf compare --categories visreg,perf,accessibility
shaka-perf audit --categories audit
```

Open `audit-results/full-report.html` for the standalone results. ShakaPerf 0.3.0
includes every registered test in audits, even when its explicit `testTypes` list
omits `audit`. These are single experiment captures, not additional paired samples.

## Checkout coverage

The phone scenario `Product Page - Profile layout sticky add to cart` opens the
seeded product, clicks its sticky purchase link without scrolling, selects the
purchase link in the revealed product section, and captures checkout after Stripe’s
card field is ready. It does not submit a payment.

```sh
shaka-perf compare --filter "sticky add to cart" --categories visreg,accessibility
```

Checkout requires a Stripe test-mode publishable key. The benchmark launcher defaults
the PayPal SDK to its sandbox demo client ID, and benchmark CSP allows Stripe to
fetch Google Fonts stylesheets. The test intercepts the cart’s debounced save so
repeated samples do not change shared fixtures. This routing disables Chromium’s
HTTP cache for this scenario; compare it only with the same setup on the other side.

## Use the evidence in a PR

Gumroad's [contribution guide](../CONTRIBUTING.md) asks for before/after visual
evidence. Attach the paired screenshots or replay, the metric table, and the
commands to the PR. Record both Git SHAs. State the viewport and throttle profile.
Run the same case on each side. Keep visual failures visible when reporting a
performance gain. Include dark-mode evidence when the change affects that mode;
the Discover showcase includes light and dark screenshots and accessibility checks
on desktop and phone. Its performance measurements use light mode only.

A faster paint does not prove visual parity. A clean pixel diff does not prove
keyboard access. Use the separate outputs to check each claim.

## Cache and cleanup

The preferred control and experiment ports are 3100 and 3200. The shared port
configuration selects and remembers an available pair automatically.
`CONDUCTOR_PORT`, when set, supplies the control port and the next port for the
experiment; explicit paired ShakaPerf overrides take precedence. To pin a pair, set both
`SHAKAPERF_CONTROL_PORT` and `SHAKAPERF_EXPERIMENT_PORT` before all server and
comparison commands. Use the selected ports with `control.localhost` and
`experiment.localhost`. Seller pages use subdomains of the same root.
If the default object-store ports 9100 and 9101 are occupied, also set
`SHAKAPERF_CONTROL_S3_PORT` and `SHAKAPERF_EXPERIMENT_S3_PORT` to two free ports
before starting containers. Keep all overrides identical for startup and comparison.

This lets the seller page and cart iframe reuse the same cached assets. Warm
cases keep the warmup assets. Request blocking uses CDP so it does not disable
the browser cache. The tests block reCAPTCHA and suppress development profiler UI.

If Docker runs low on disk space, `shaka-perf servers prune-cache` removes only
this project’s isolated Buildx cache. Elasticsearch can reject fixture writes
when its disk watermark is reached; restore sufficient Docker disk space before
rerunning setup and measuring. Do not treat a partially seeded run as evidence.

Stop the disposable containers when finished:

```sh
shaka-perf servers stop-containers
```
