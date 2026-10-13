# Control Plane benchmark deployments

`gumroad-inertia` and `gumroad-rorp` are isolated benchmark apps in `shakacode-open-source-examples-staging` (`aws-us-east-2`). Each GVC runs Rails, Sidekiq, a private authenticated renderer, MySQL, DynamoDB, Redis, Elasticsearch, and Memcached. Each app uses an operator-owned R2 bucket with its own key prefix; the buckets and public custom domains must exist before deployment.

The RORP path serves full profile-layout Product documents for enabled sellers. Discover, seller profiles, and Discover-layout Product pages remain on Inertia. The paired comparison enables only the fixture seller `luisfurushio` on RORP and leaves Inertia off; it never enables the feature globally.

Keep these operations changes separate from the upstream-facing application PR. Before any deployment or measurement, obtain the full final application integration SHA, its prerequisite relationship, passing Product behavior checks, and published exact-head Shaka review and ready outcome. Require a separately verified deployment-capable integration with compatible benchmark runtime, fixtures, media/storage, renderer, cache and routing support. A prerequisite-only or unfinished application head is insufficient. Preserve the deployment foundation and actual application provenance; do not overlay missing wrappers or historical application files.

Local integration preparation may proceed under an explicit maintainer exception when the application's adoption assessment remains held. That exception does not clear the assessment or authorize a deployment. Record the application SHA, operations SHA and combined deployment SHA separately, prove their ancestry, and retain the original reviews and unresolved concerns. Application implementation and dependency locks come from the reviewed application source; benchmark environment and packaging changes need their own validation and review.

The benchmark environment keeps API calls on the configured custom root, supports guarded Control Plane instance routes, and uses production asset directories with content hashes. The Docker recipe installs locked dependencies once, builds widget assets, lets `assets:precompile` build Vite and all public/private RSC targets, then copies the renderer cache. Rails and the private renderer reference the same password and license dictionary entries. This configuration does not prove that a valid license or effective write access exists.

Benchmark context exclusions live in `.controlplane/Dockerfile.dockerignore`; the shared `.dockerignore` retains the application source's ordinary web/nginx policy. Docker selects the recipe-specific file when Flow supplies `.controlplane/Dockerfile`. The verified source command requires that policy and records its hash. To check native context selection locally, run `RUN_DOCKER_CONTEXT_TEST=true ruby spec/bin/docker_context_test.rb`. The test exports synthetic contexts from scratch to temporary directories; it runs no application recipe and exports no image. Ordinary runtime files remain available while benchmark context excludes local dependencies, caches and secrets and retains the required public certificates.

The hosted workflows retain explicit `source_sha` selection and allow manual dispatch from the owned preparation branch, without merging the deployment base. Their Flow actions still resolve latest images; they are not the final matched comparison's verified promotion path. Use the local digest-bound command below for that comparison. No merge, dispatch or deployment is authorized by this guide; pushing the live deployment base already triggers both workflows.

The commit must already belong to the selected deployment branch's history and descend from `5df1b6827002108389e337bbe308896d49da30a1`, the paired-demo deployment foundation. PR #103's application head alone lacks the required Control Plane runtime and storage configuration. Omit the input to build the workflow commit; pushes to the deployment branch retain that behavior.

Each hosted run records the workflow/application SHAs. Build and deploy check out the resolved SHA. The deployment branch and preparation dispatch share one queue per app; feature-branch pushes and unrelated refs cannot deploy. Preserve the source and history guards even when choosing local operation. Establish an exclusive operation interval, pause competing builds/deployments and record tool versions, lockfile hashes, specs, flags, effective allocations, suspension states and each workload's prior digest. Readable access reports or historical deployments do not prove current write permission; establish effective permission without a test write.

After deployment, verify all six running digests, runtime `GIT_COMMIT`, package versions and fixture/media hashes. Confirm Product `bgfjk` belongs to `luisfurushio`, actor-only enablement on RORP, Inertia off and another seller unaffected. Prove variants, rich content, covers, description expansion, cart add/remove/persistence and checkout navigation on desktop/mobile and light/dark; record console/network/HTTP errors and never purchase. Explain host/build-argument differences rather than hiding arbitrary asset differences.

## Idle operation and reproducing measurements

Follow [Control Plane Flow's demo guidance](https://github.com/shakacode/control-plane-flow/blob/main/docs/tips.md#enable-capacity-ai-for-demo-and-starter-staging-apps): Rails, Sidekiq, and renderer use Capacity AI with disabled replica autoscaling. This right-sizes running stateless services; it does **not** shut them down. Stateful services remain manually sized. Keep fixed benchmark allocations temporary, not the everyday demo default.

If the operator chooses to take the demos offline between sessions, use Flow's reversible [pause/resume commands](https://github.com/shakacode/control-plane-flow/blob/main/docs/tips.md#pause-and-resume-with-psstop--psstart):

```sh
for app in gumroad-inertia gumroad-rorp; do
  cpflow ps:stop --app "$app" --org shakacode-open-source-examples-staging --wait
done
```

This suspends the eight workloads listed in `app_workloads` and `additional_workloads`. Inventory live workloads first: older deployments may also have an unlisted MongoDB workload. Stop any such existing service explicitly with `cpflow ps:stop --app "$app" --workload mongo --org shakacode-open-source-examples-staging --wait`, and record it for the matching explicit start. Do not delete workloads, GVCs, images, or volume sets. Persistent database volumes survive suspension; in-memory caches do not, and retained storage can still incur charges. Verify that every intended workload is suspended and has no running replicas; the command alone does not inventory unlisted services.

**Reproduction warning:** a stopped demo does not wake when its URL is refreshed. An operator must start it before a visitor or PageSpeed can use it:

```sh
for app in gumroad-inertia gumroad-rorp; do
  for workload in mysql dynamodb redis elasticsearch memcached; do
    cpflow ps:start --app "$app" --workload "$workload" --org shakacode-open-source-examples-staging --wait
  done
  for workload in renderer rails sidekiq; do
    cpflow ps:start --app "$app" --workload "$workload" --org shakacode-open-source-examples-staging --wait
  done
done
```

Start any recorded unlisted backing service before the app. Verify readiness, source/image digests, seller flags, database-backed product rendering, and all resource allocations after startup. No deployment, release hook, migration, or reseeding is required. True automatic idle scale-to-zero requires a separately planned serverless migration; do not change these existing standard workloads' type in place.

For a controlled comparison only, temporarily disable Capacity AI on all three app workloads on both hosts:

```sh
for app in gumroad-inertia gumroad-rorp; do
  for workload in rails sidekiq renderer; do
    cpln workload update "$workload" --gvc "$app" --org shakacode-open-source-examples-staging \
      --set spec.defaultOptions.capacityAI=false
  done
done
```

Verify effective equal resources: Rails 1 CPU/2 GiB, Sidekiq and renderer 0.5 CPU/1 GiB each, one ready replica each, plus matching backing services. Wait for allocation telemetry. Freeze code/data/media/flags/resources, then warm each original product URL with `layout=profile&recommended_by=search` three times, alternating hosts. Record the cutoff after all six loads. Current adaptive renderer allocations differ; specs alone do not prove parity.

The predeclared Google protocol remains twelve fresh reports: three mobile and three desktop per host, alternating I1/R1/I2/R2/I3/R3 per form. All JSON fetchTimes must follow warmup and span at most 600 seconds; pace same-host submissions at least 90 seconds. Preserve every attempt, raw JSON/hash, report URL, rounded display and raw metrics/settings/warnings. Any failed, cached, missing or over-time report invalidates the whole batch; allow one complete replacement only for invalidity, then stop blocked. Scores never justify retries. Report medians/ranges; keep diagnostics separate with at least five alternating samples per side.

The selected source also supplies the Control Plane configuration and release script. Image deployment does not reapply templates, and older sources may contain different resource defaults. Set the everyday adaptive policy explicitly after any deployment to an existing app, including older-source deployments, and restore it after every benchmark:

```sh
for app in gumroad-inertia gumroad-rorp; do
  for workload in rails sidekiq renderer; do
    cpln workload update "$workload" --gvc "$app" --org shakacode-open-source-examples-staging \
      --set spec.defaultOptions.capacityAI=true
  done
done
```

Verify all six values are true and each workload is ready. Stop both apps only when the operator has chosen offline operation; otherwise leave them available with adaptive allocation. Preserve the measurement's fixed-allocation evidence separately from the everyday idle settings.

## Configure app infrastructure

These commands prepare infrastructure and secrets. They do not initialize a fresh or reset database. Normal release requires an existing schema, Product `bgfjk` and seller `luisfurushio`; otherwise its pre-write guard aborts. No database bootstrap path is supplied here. Any first-time initialization needs a separately reviewed procedure and explicit operator authorization before writes.

Use cpflow 5.2 from the repository root. Authenticate `cpln` with its saved profile or `CPLN_TOKEN`. Supply credentials scoped to the existing R2 bucket:

```sh
export CPLN_ORG=shakacode-open-source-examples-staging
export S3_ENDPOINT='https://<account-id>.r2.cloudflarestorage.com'
export AWS_ACCESS_KEY_ID='<r2-access-key-id>'
export AWS_SECRET_ACCESS_KEY='<r2-secret-access-key>'
export S3_BUCKET='<surface-r2-bucket>'

bin/prepare-control-plane-benchmark-secrets --org "$CPLN_ORG"
cpflow setup-app --app gumroad-rorp --org "$CPLN_ORG" --skip-post-creation-hook
```

The bootstrap creates `gumroad-rorp-mysql` and `gumroad-rorp-r2` only when absent. It validates existing secrets without rotating them. Do not change MySQL initialization credentials after its persistent volume exists. R2 credential or bucket changes also require explicit operator action. Unset the four R2 exports after bootstrap.

`setup-app` creates the app-owned `gumroad-rorp-secrets` dictionary, policy, and identity. Before deploying, populate that dictionary through Control Plane secret management with `SECRET_KEY_BASE`, `DEVISE_SECRET_KEY`, `STRONGBOX_GENERAL`, `STRONGBOX_GENERAL_PASSWORD`, `OBFUSCATE_IDS_CIPHER_KEY`, `OBFUSCATE_IDS_NUMERIC_CIPHER_KEY`, `RENDERER_PASSWORD`, and `REACT_ON_RAILS_PRO_LICENSE` (which may be empty). Confirm that only the app identity can reveal it. Do not copy another app's secrets or put values in repository files.

Image promotion does not update templates. Review any necessary renderer, secret-reference, environment, storage, cache or routing changes against the final source and live snapshot; do not blindly apply the historical template set or overwrite unrelated settings.

## Build and deploy

Use the verified local command only after the complete deployment integration passes Shaka validation, exact-head review and ready outcome, in an authorized exclusive operation window. It checks clean source/foundation ancestry and canonical Git blobs, builds with that source’s recipe/config, and records archive/tree hashes, runtime provenance and the exact digest.

```sh
set -eu
: "${INTEGRATION_SHA:?Set the full reviewed deployment integration SHA}" "${DEPLOYMENT_RECORD:?Set an absolute manifest path outside this checkout}"
APP=gumroad-inertia # Repeat with a separate record for gumroad-rorp.
ruby bin/deploy-control-plane-benchmark build --app "$APP" \
  --source-sha "$INTEGRATION_SHA" --manifest "$DEPLOYMENT_RECORD" --execute
ruby bin/deploy-control-plane-benchmark deploy --app "$APP" \
  --source-sha "$INTEGRATION_SHA" --manifest "$DEPLOYMENT_RECORD" --execute
```

The historical RORP release globally enabled this feature; expect a boolean conflict until an authorized read proves otherwise. Before build or release, record the actual gates and reconcile global, group, percentage, expression or other-seller conflicts under separate authorization. The release waits for backing services, then runs `scripts/verify_control_plane_product_page.rb` before database preparation, storage probes, seeds or index writes. That read-only check requires the matching benchmark app, existing fixture and expected seller; unavailable schema/data or conflicting gates abort release. A fresh database needs separately authorized bootstrap and reconciliation, not a bypass of this guard. The normal entrypoint never migrates/seeds.

Final seller configuration repeats the same read-only check before changing the actor gate; it never erases a conflict. Verify luisfurushio enabled only on RORP, Inertia off, another seller unaffected and unrelated flags unchanged. The check is not a lock against concurrent flag edits: retain the exclusive operation window and stop competing operations. Keep automatic deployment-base pushes blocked. Release writes after a successful preflight still require authorization and are not undone by image rollback.

With `CONTROL_PLANE_BENCHMARK=true`, Rack::SSL preserves HTTPS redirects, HSTS and secure cookies for all public benchmark hosts, including seller, API and generated instance endpoints. Forwarded HTTPS requests do not redirect again. The local HTTP harness remains exempt, and ordinary environments retain their existing host policy. Local middleware regressions prove these source behaviors; the final deployed proxy scheme, certificate, routing and headers still require verification in the separately authorized operation. Do not warm a host during preparation.

Rails liveness and readiness probes send `X-Forwarded-Proto: https` to `/healthcheck` on the private container port, so Rack::SSL reaches the health handler instead of redirecting. Public HTTP remains subject to the same redirect policy, including `/healthcheck`. Image promotion does not install these probe headers; reconcile the live probe configuration in the authorized operation and verify readiness against the final app.

The command releases the explicit digest, promotes Rails/Sidekiq/renderer and verifies their running images. Promotion failure attempts each workload’s own prior digest. Release writes are not undone by image rollback. The schedule-suspended release runner’s job and configuration synchronization require authorization.

Failed/incomplete manifests deliberately cannot retry. Preserve the record, inspect the registry, all workload images and release data/flags/schema, and complete recovery under operator authorization. After gates and partial writes are reconciled, build a new image with a new manifest; never edit an earlier record to pretend release did not run. Restore all six adaptive settings even on failure.

## Verify routing and storage

Use the actual generated instance endpoint from the deployment API and verify the final source accepts that hostname. Historical source only accepts the narrow `rails-[a-z0-9]+.cpln.app` form while `BRANCH_DEPLOYMENT=true`; current Ohio endpoints use `controlplane.us`, so compatibility is an explicit final-integration gate. Check health, Product and Discover routes, root and seller domains.

For the RSC check, enable and verify `product_page_storefront_enabled` and `product_page_react_on_rails` for the test Product's seller, then request that Product as a full document with no layout parameter. Confirm it renders through RORP; confirm Discover, seller profiles, and Discover-layout Products still render through Inertia. Check `/vite/` and `/public-rsc/` assets, renderer health, and readiness for Rails, Sidekiq, renderer, and the five backing services.

Confirm fixture media uses `public-files.gumroad-rorp.reactonrails.com/benchmarks/gumroad-rorp/` rather than exposing the R2 API endpoint. Verify a deleted probe is no longer publicly available. The final root is `https://gumroad-rorp.reactonrails.com`; seller and benchmark seller subdomains route to the Rails workload. Cookies remain host-only and HTTPS-only.

## Roll back an image

Restore each recorded workload/container pair's own prior digest, then verify readiness and running identity. Never assume the three prior images were identical:

```sh
set -eu
: "${APP:?Set the recorded app}"
: "${CPLN_ORG:?Set the recorded organization}"
: "${WORKLOAD:?Set the recorded workload}"
: "${CONTAINER:?Set its recorded container}"
: "${PREVIOUS_IMAGE:?Set the recorded container’s prior immutable image}"
cpln workload update "$WORKLOAD" --gvc "$APP" --org "$CPLN_ORG" \
  --set "spec.containers.${CONTAINER}.image=$PREVIOUS_IMAGE"
```

An image rollback does not reverse database migrations. Use a forward-compatible fix or a separately reviewed data rollback for schema changes.

## Local checks

```sh
cpflow doctor --app gumroad-rorp
sh -n .controlplane/entrypoint.sh
sh -n .controlplane/release_script.sh
bash -n bin/prepare-control-plane-benchmark-secrets
```

A Docker build, secret and policy checks, R2 API and public delivery, release job, workload readiness, and domain smoke tests require live infrastructure. The bucket is provisioned separately.
