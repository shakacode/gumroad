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
together.

Audit screencasts also need FFmpeg. With ShakaPerf 0.3.0, use FFmpeg 7:
FFmpeg 9 removes the `-vsync` option used by the recorder. On macOS:

```sh
brew install ffmpeg@7
export PATH="$(brew --prefix ffmpeg@7)/bin:$PATH"
ffmpeg -version
```

Keep this PATH in the shell that runs ShakaPerf; a global FFmpeg relink is unnecessary.

Clone the shared benchmark baseline into a sibling `gumroad-control` directory.
Keep the harness and fixtures in both checkouts. Apply the change under test only
to the experiment. From the experiment checkout:

```sh
git clone https://github.com/shakacode/gumroad.git ../gumroad-control
```

Check out the baseline commit in the control directory and the proposed commit in
the experiment directory. If you use a different folder name, set its absolute
path:

```sh
export SHAKAPERF_CONTROL_DIR="/absolute/path/to/gumroad-control"
```

Build the images, prepare the disposable databases, and launch the apps:

```sh
shaka-perf servers
```

This command runs:

```sh
shaka-perf servers build
shaka-perf servers start-containers
shaka-perf servers start-servers
```

`start-containers` resets and seeds both disposable databases. `start-servers`
runs continuously under Overmind; wait for both readiness announcements in its
log before measuring. After changing committed application code, rebuild the
changed image (`shaka-perf servers build --target experiment`), recreate the
containers, and restart the apps so the compiled assets match the source.

Run the focused Discover category comparison from the experiment checkout:

```sh
shaka-perf compare --filter "Discover Page - Programming category"
```

For a visual-only check:

```sh
shaka-perf compare --filter "Discover Page - Programming category" --categories visreg
```

Open `compare-results/full-report.html`. Compare the screenshots and pixel diff.
For performance, inspect each metric, the sample count, and the uncertainty.
The default profile uses 18 paired samples, 100 ms RTT, 2.7 Mbps download and
upload, 200 ms request latency, and 3× CPU slowdown. See
[the config](../abtests.config.ts).

For the complete registered suite and standalone experiment audits:

```sh
shaka-perf compare --categories visreg,perf,accessibility
shaka-perf audit --categories audit
```

## Use the evidence in a PR

Gumroad's [contribution guide](../CONTRIBUTING.md) asks for before/after visual
evidence. Attach the paired screenshots or replay, the metric table, and the
commands to the PR. Record both Git SHAs. State the viewport and throttle profile.
Run the same case on each side. Keep visual failures visible when reporting a
performance gain. Include dark-mode evidence when the change affects that mode;
the Discover programming category tests include light and dark screenshots and
accessibility checks on desktop and phone. Its performance measurements use light
mode only.

Stop the disposable containers when finished:

```sh
shaka-perf servers stop-containers
```
