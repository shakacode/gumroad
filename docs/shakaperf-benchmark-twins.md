# Compare Gumroad changes with ShakaPerf

Use two clean Git worktrees. ShakaPerf runs each worktree with its own database,
cache, search index, and object store. Both sides use the same seeded products.
The harness uses the Inertia app and the local `benchmark` Rails environment.

## Set up

Use Docker, Ruby 3.4.3, and Node 22.22.2. Install the CLI and project packages:

```sh
npm ci
npm install --global shaka-perf@0.2.4
```

Create the control worktree from the completed showcase branch. Keep the test
harness and fixtures in both worktrees. Make the change under test only in the
experiment worktree.

```sh
git worktree add --detach ../gumroad-control HEAD
export SHAKAPERF_CONTROL_DIR="../gumroad-control"
shaka-perf servers
```

This command resets and seeds the disposable twin databases. Leave it running.
Use a second terminal in the experiment worktree to run one case:

```sh
shaka-perf compare --filter "Product Page - Discover layout cold landing"
```

For a visual-only check:

```sh
shaka-perf compare --filter "Product Page - Discover layout cold landing" --categories visreg
```

Open `compare-results/report.html`. Compare the screenshots and pixel diff.
For performance, inspect each metric, the sample count, and the uncertainty.
The default profile uses 18 paired samples, 100 ms RTT, 2.7 Mbps download and
upload, 200 ms request latency, and 3× CPU slowdown. See [the config](../abtests.config.ts).
Cold and warm cases run on desktop and phone. Accessibility results are separate
from visual and performance results.

## Use the evidence in a PR

Gumroad's [contribution guide](../CONTRIBUTING.md) asks for before/after visual
evidence. Attach the paired screenshots or replay, the metric table, and the
commands to the PR. Record both Git SHAs. State the viewport and throttle profile.
Run the same case on each side. Keep visual failures visible when reporting a
performance gain. Include dark-mode evidence when the change affects that mode;
the current cases do not establish dark-mode coverage.

A faster paint does not prove visual parity. A clean pixel diff does not prove
keyboard access. Use the separate outputs to check each claim.

## Cache and cleanup

The control root is `http://control.localhost:3100`; the experiment root is
`http://experiment.localhost:3200`. Seller pages use subdomains of the same root.
This lets the seller page and cart iframe reuse the same cached assets. Warm
cases keep the warmup assets. Request blocking uses CDP so it does not disable
the browser cache. The tests block reCAPTCHA and suppress development profiler UI.

Stop the disposable containers when finished:

```sh
shaka-perf servers stop-containers
```
