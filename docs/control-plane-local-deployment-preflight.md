# Local deployment preparation for the paired demos

The existing local Control Plane Flow path can operate without merging the
hosted workflow changes. It is an alternative for an explicitly authorized
deployment window, not a deploy-ready status or permission to change a host.
Do not merge operations PRs merely to enable commands: pushing the deployment
base already triggers both deployments. Dependent PR publication still follows
the repository workflow's prerequisite rules; choosing local operation does not
waive them.

Before choosing this path, the maintainer must confirm local operation and the
operator must establish effective deployment access. Historical successful
deployments and readable access reports do not prove current write permission.
The installed CLI exposes no deployment dry-run; do not perform a write to test
access. Review the required image, workload, runner and secret-policy permissions
against the operator's authenticated principal without revealing secret values.

## Required source and evidence

Obtain the full final application integration SHA and its prerequisite
relationship, passing flag-off/flag-on behavior evidence, published exact-head
technical review and ready outcome. React-19 prerequisite PR #122 alone is
insufficient. Its published source lacks the benchmark environment and Control
Plane files, and does not descend from the deployment foundation.

Require one clean, separately reviewed deployment-capable integration containing
that application source and the deployment foundation below. Validate its actual
build, renderer, fixture, storage and routing support against current upstream.
Do not copy historical application files or optional performance experiments
over the reviewed integration. Do not overlay missing verification commands.
Run the trusted repository validation and independent review on the final source;
an application review does not attest to an added operations integration.
The pinned foundation commit first supplied the paired-demo deployment support.
If a history rewrite removes it, stop and obtain an explicitly reviewed replacement
foundation; do not silently replace the ancestry check with a file-existence test.

Run these read-only guards from that clean source checkout:

```sh
set -eu
: "${INTEGRATION_SHA:?Set the reviewed full deployment integration SHA}"
case "$INTEGRATION_SHA" in
  *[!0-9a-f]*|'') echo 'Expected a lowercase full SHA' >&2; exit 1 ;;
esac
[ "${#INTEGRATION_SHA}" -eq 40 ]
[ "$(git rev-parse HEAD)" = "$INTEGRATION_SHA" ]
[ -z "$(git status --porcelain --untracked-files=all)" ]
git merge-base --is-ancestor \
  5df1b6827002108389e337bbe308896d49da30a1 "$INTEGRATION_SHA"
for required in .agents/bin/setup .agents/bin/test .agents/bin/validate \
  .controlplane/Dockerfile .controlplane/controlplane.yml \
  .controlplane/entrypoint.sh .controlplane/release_script.sh \
  config/environments/benchmark.rb scripts/seed_native_product_page.rb \
  scripts/verify_control_plane_benchmark_storage.rb \
  scripts/configure_control_plane_product_page.rb; do
  test -f "$required"
done
cpflow doctor --app gumroad-inertia --org shakacode-open-source-examples-staging
cpflow doctor --app gumroad-rorp --org shakacode-open-source-examples-staging
```

These guards are necessary, not full source compatibility or behavior proof.
For hosted deployment, additionally retain #116's workflow-history guard:
the selected source must be an ancestor of the reviewed workflow commit.
Local Flow does not have a workflow commit; it must still retain the foundation
and reviewed application provenance checks. Choosing local operation does not
make a source acceptable that failed the foundation check.

## Build and promotion window

Record the exclusive operator interval, tool versions and package/lockfile
hashes. Snapshot all workload/GVC specifications, previous image references,
flags and effective allocations. Pause competing app-image builds and verify
that no deployment is in progress. Preserve suspended runner workloads.

Flow 6.0.0 builds the working directory. Its `--commit` option supplies a
`GIT_COMMIT` build argument; it does not check out or verify that commit. Its
`deploy-image` resolves the latest app image and uses a digest when configured.
Its default release runner also resolves latest. Do not use `deploy-image` for
the final comparison. Select the explicit image produced by the verified build
for both the release job and workload updates below. Never assume the commit
label proves the Docker context or promoted digest.

The release runs a manual job on `rails-runner`. Flow keeps its schedule suspended
but may synchronize its environment, identity and limits from Rails. Explicitly
approve this one-off job and any reviewed configuration changes in the window;
if suspended runners must remain entirely untouched, this release path is blocked.
Do not start a suspended runner as a persistent service.

After source checks and deployment authorization, build each app sequentially
from the same checkout. Supply its host-specific build argument explicitly:

```sh
set -eu
: "${INTEGRATION_SHA:?Set the reviewed full deployment integration SHA}"
CPLN_ORG=shakacode-open-source-examples-staging
APP=gumroad-inertia # Repeat the complete sequence for gumroad-rorp.
BUILD_CONTEXT=$(mktemp -d)
BUILD_ARCHIVE=$(mktemp)
trap 'rm -rf -- "$BUILD_CONTEXT" "$BUILD_ARCHIVE"' EXIT
git archive --format=tar --output="$BUILD_ARCHIVE" "$INTEGRATION_SHA"
tar -xf "$BUILD_ARCHIVE" -C "$BUILD_CONTEXT"
(cd "$BUILD_CONTEXT" && cpflow build-image --app "$APP" --org "$CPLN_ORG" \
  --commit "$INTEGRATION_SHA" --docker-context "$BUILD_CONTEXT" \
  --build-arg "BENCHMARK_APP=$APP")
```

The archive contains the tracked immutable commit only. Flow reads its recipe
and configuration there too. Ignored local files, installed dependencies and
generated assets cannot enter that Docker context.

Record the image name printed by the build and inspect that explicit image with
`cpln image get`. Record and verify its SHA256 digest and runtime `GIT_COMMIT`
against the source. Recheck the clean source. Only then, using that exact identity:

```sh
set -eu
: "${APP:?Set the reviewed app}"
: "${CPLN_ORG:?Set the reviewed organization}"
: "${BUILT_IMAGE:?Set the image name produced by the verified build}"
: "${BUILT_DIGEST:?Set its verified SHA256 digest}"
cpflow run --app "$APP" --org "$CPLN_ORG" \
  --image "$BUILT_IMAGE@$BUILT_DIGEST" -- \
  'ALLOW_BENCHMARK_SEED=true .controlplane/release_script.sh'
for workload in rails sidekiq renderer; do
  cpln workload update "$workload" --gvc "$APP" --org "$CPLN_ORG" \
    --set "spec.containers.${workload}.image=/org/$CPLN_ORG/image/$BUILT_IMAGE@$BUILT_DIGEST"
done
```

Validate the actual workload/container names against the snapshot first. Require
all running images to converge to that exact reference and readiness before
continuing. On a partial failure, restore each workload's own prior image; do not
retry a selection of latest or continue toward measurement.

The historical release migrates, seeds, reindexes and probes storage. It also
clears the product-page feature gates and globally enables RSC on the RORP app.
That global setting does not meet a seller-scoped comparison. The final reviewed
release must enable only the test seller on RORP, leave Inertia disabled, and
prove another seller is unaffected. Preserve actor/group/percentage rollback
semantics deliberately. Do not change flags during measurement.

Image promotion does not apply changed templates. Review any necessary renderer
command, secret reference, benchmark environment, storage, asset-cache or routing
adjustment before the window. Do not blindly apply the historical template set:
it can overwrite unrelated settings. Read back all six workload image digests and
runtime revisions after release, then prove product/media/fixture and interaction
parity before warming the exact URLs.

## Measurement, rollback and restoration

Use the predetermined Google protocol: both original product URLs, including
`layout=profile&recommended_by=search`; three alternating mobile and desktop
reports per host, twelve reports within 600 seconds of JSON fetchTime. Warm each
exact URL three times first and record the freshness cutoff. Keep diagnostics
separate. Preserve every attempt, raw JSON/hash, report URL, rounded display and
raw metric. A failed, cached or over-time result invalidates the whole batch;
allow only one complete replacement. Scores never justify retries or tuning.

For the measurement window, disable CapacityAI on exactly Rails, Sidekiq and
renderer in both apps. Verify effective allocation convergence: Rails 1 CPU/2Gi,
Sidekiq and renderer 500m/1Gi, one ready replica each. Declaration alone is not
proof. Restore CapacityAI and verify readiness on success or failure.

For image rollback, use each workload's recorded prior immutable image:

```sh
set -eu
: "${APP:?Set the recorded app}"
: "${CPLN_ORG:?Set the recorded organization}"
: "${WORKLOAD:?Set one recorded workload}"
: "${CONTAINER:?Set its recorded container name}"
: "${PREVIOUS_IMAGE:?Set the recorded immutable container image}"
cpln workload update "$WORKLOAD" --gvc "$APP" --org "$CPLN_ORG" \
  --set "spec.containers.${CONTAINER}.image=$PREVIOUS_IMAGE"
```

Repeat separately for each recorded workload/container pair and verify its ready
running digest. Never reuse one prior image across workloads unless the snapshot
proves they were identical. Record failed restoration steps and stop for recovery.

An image rollback does not undo migrations, seeded data, storage probes or feature
flags. Review schema compatibility and data recovery before release; after any
failure, restore the recorded flag/resource policy and compare all specifications
against the baseline. Do not run a destructive data rollback automatically.

CapacityAI keeps workloads running. An optional stop/start proof needs its own
authorized availability window, an inventory including MongoDB, and explicit
operator restart. Preserve already-suspended runners; never start every workload.
