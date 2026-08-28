# Control Plane Inertia benchmark deployment

This deployment is the production-shaped Inertia control for storefront comparisons. It is intentionally separate from the existing legacy deployment and uses the fixed identity `gumroad-inertia` in `shakacode-open-source-examples-staging`, located in `aws-us-east-2`.

The GVC contains Rails and Sidekiq workloads plus isolated MySQL, MongoDB, Redis, Elasticsearch, and Memcached workloads. MySQL, MongoDB, and Elasticsearch use retained volumes. Elasticsearch runs as a single node with its surface-local index data mounted at `/usr/share/elasticsearch/data`; its volumeset takes a final snapshot and retains snapshots for seven days. Fixture media temporarily uses the existing private Cloudflare R2 bucket `shaka-perf-demo-storage`, isolated under the `benchmarks/gumroad-inertia/` object namespace. Rails proxies media rather than exposing private R2 URLs. Sidekiq consumes only the critical, default, low, and mongo queues; benchmark workers do not install the production cron schedule. While `CONTROL_PLANE_BENCHMARK=true`, client middleware drops every enqueue except Elasticsearch indexing, asset-preview processing, video-poster generation, Active Storage purge, and product-cache invalidation workers. Drop logs contain only the event, resolved job class, and queue—never arguments. There is no renderer workload, RSC transport, or renderer environment in this surface.

The backing-service, Rails, and Sidekiq templates are reusable by the later RORP lane. Inertia-only identity, host, cookie, surface, and release guards remain in `app-inertia.yml`, `controlplane.yml`, and `release_script.sh`; the RORP app must supply its own surface-owned secrets and explicit app/surface guard rather than sharing this app's state.

## One-time bootstrap

Use cpflow 5.2 and run these commands from the repository root. `CPLN_ORG` may override the committed organization, but the app name cannot be overridden.

```sh
export CPLN_ORG=shakacode-open-source-examples-staging
export S3_ENDPOINT='https://<account-id>.r2.cloudflarestorage.com'
export AWS_ACCESS_KEY_ID='<opaque-r2-access-key-id>'
export AWS_SECRET_ACCESS_KEY='<opaque-r2-secret-access-key>'

bin/prepare-control-plane-benchmark-secrets --org "$CPLN_ORG"
cpflow setup-app \
  --app gumroad-inertia \
  --org "$CPLN_ORG" \
  --skip-post-creation-hook
```

Authenticate `cpln` through its saved profile or `CPLN_TOKEN`; the bootstrap verifies org access without requiring the token environment variable specifically.

The `shaka-perf-demo-storage` bucket must exist and remain private before `setup-app`; this deployment never creates or deletes it. The credentials must be authorized for that bucket. Surface isolation is enforced by the Active Storage key namespace, while the app-owned Control Plane secret limits credential reveal to this app identity. Workloads expose the dictionary only through `BENCHMARK_STORAGE_S3_*` variables; the existing `AWS_S3_*` local MinIO configuration is unchanged. Treat all three exported values as opaque secrets and unset them after bootstrap.

Run the backing-service bootstrap before `setup-app`. It creates only `gumroad-inertia-mysql`, `gumroad-inertia-mongo`, and `gumroad-inertia-r2` when absent. R2 values are imported without printing them; the dictionary fixes the bucket to `shaka-perf-demo-storage`, while Rails adds the surface namespace to every key. Existing dictionaries are validated and never rotated. Changing initialization credentials after persistent MySQL or Mongo volumes exist can desynchronize the running service, and R2 credential changes require an explicit operator action.

`cpflow setup-app` owns the standard application-secret lifecycle. It creates `gumroad-inertia-secrets`, `gumroad-inertia-secrets-policy`, `gumroad-inertia-identity`, and the identity's `reveal` binding. After setup and before the first image deployment, populate `gumroad-inertia-secrets` through Control Plane's secret management with operator-supplied values for `SECRET_KEY_BASE`, `DEVISE_SECRET_KEY`, `STRONGBOX_GENERAL`, `STRONGBOX_GENERAL_PASSWORD`, `OBFUSCATE_IDS_CIPHER_KEY`, `OBFUSCATE_IDS_NUMERIC_CIPHER_KEY`, and `REACT_ON_RAILS_PRO_LICENSE`. Do not source these values from another application's dictionary, place them in shell history, or add them to repository files. Confirm the policy targets only the app-owned dictionary and grants only the app identity `reveal` access.

## Reapply declarative configuration

`setup-app` is only for first creation. Existing GVCs do not automatically receive template changes. Reapply every changed template explicitly before deploying a new image:

```sh
cpflow apply-template \
  app-inertia r2 mysql mongo redis elasticsearch memcached rails sidekiq \
  --app gumroad-inertia \
  --org "$CPLN_ORG" \
  --yes
```

Template reapplication does not replace `setup-app`'s standard secret lifecycle. Confirm the app identity still has `reveal` permission on `gumroad-inertia-secrets-policy` before deploying. If an obsolete cross-application license policy exists from an earlier deployment attempt, remove it only after the workload reads the app-owned license and both Rails and Sidekiq have been verified live.

## Build and immutable deployment

Provision/update Control Plane and complete the workload, endpoint, and private R2 checks from the exact proposed branch head before merge. This is a pre-merge gate, not a post-merge deployment step.

cpflow 5.2 builds the configured Dockerfile for `linux/amd64`. Record the exact source revision and let cpflow publish the fixed app image:

```sh
git_revision="$(git rev-parse HEAD)"
cpflow build-image \
  --app gumroad-inertia \
  --org "$CPLN_ORG" \
  --commit "$git_revision"
```

Before promotion, record the currently deployed immutable references:

```sh
cpln workload get rails \
  --gvc gumroad-inertia \
  --org "$CPLN_ORG" \
  --output json |
  jq -r '.spec.containers[] | select(.name == "rails") | .image'

cpln workload get sidekiq \
  --gvc gumroad-inertia \
  --org "$CPLN_ORG" \
  --output json |
  jq -r '.spec.containers[] | select(.name == "sidekiq") | .image'
```

Deploy the latest image with the guarded release phase:

```sh
cpflow deploy-image \
  --app gumroad-inertia \
  --org "$CPLN_ORG" \
  --run-release-phase
```

`use_digest_image_ref: true` makes both application workloads reference the resolved SHA-256 digest rather than a mutable tag. The release waits for all five backing services and checks that the exact app is `gumroad-inertia` and the exact surface is `inertia`. Rails `db:prepare` creates a fresh database from the schema or migrates an existing one without running benchmark seeds. Before fixtures, the release verifies the configured private Active Storage service with a namespaced write/read/delete probe; it never provisions remote storage. The guarded seed phase bootstraps taxonomies, installs the three deterministic fixture sets, and reindexes Elasticsearch. The ordinary image entrypoint only executes the requested process; it never migrates or seeds.

For an image rollback, set the Rails container back to the previously recorded digest reference:

```sh
previous_image='/org/shakacode-open-source-examples-staging/image/gumroad-inertia@sha256:...'
cpln workload update rails \
  --gvc gumroad-inertia \
  --org "$CPLN_ORG" \
  --set "spec.containers.rails.image=$previous_image"

cpln workload update sidekiq \
  --gvc gumroad-inertia \
  --org "$CPLN_ORG" \
  --set "spec.containers.sidekiq.image=$previous_image"
```

Verify readiness after the update. An image rollback does not reverse database migrations; use a forward-compatible fix or a separately reviewed data rollback when schema changes are involved.

## Verification before DNS

Control Plane first exposes a generated host such as `https://rails-<deployment-id>.cpln.app`. Only hosts matching the narrow `rails-[a-z0-9]+.cpln.app` form are accepted, and only while `BRANCH_DEPLOYMENT` is enabled. Check:

- `/`
- `/discover`
- `/software-development/programming`
- `/l/O365IT?layout=discover`
- `/seller` for the seller path on the generated host
- `/healthcheck`

Confirm static `/vite/` assets are served by the Rails image, fixture media is proxied by Rails from private R2 objects under `benchmarks/gumroad-inertia/`, requests settle without server errors, and Rails, Sidekiq, plus all five service workloads report ready.

## Final domains

DNS and Control Plane domains are intentionally not created by this change. After generated-host verification, provision a domain for `gumroad-inertia.reactonrails.com` that targets the `gumroad-inertia/rails` workload and accepts all subdomains. The final verification set is:

- `https://gumroad-inertia.reactonrails.com/` for the About page
- `https://gumroad-inertia.reactonrails.com/discover`
- `https://gumroad-inertia.reactonrails.com/software-development/programming`
- `https://gumroad-inertia.reactonrails.com/l/O365IT?layout=discover`
- `https://seller.gumroad-inertia.reactonrails.com/`

The wildcard certificate/routing requirement is `*.gumroad-inertia.reactonrails.com`; the exact seller hostname must be covered. `SESSION_COOKIE_DOMAIN` is deliberately blank so cookies remain host-only, and `SESSION_COOKIE_SECURE=true` keeps benchmark cookies HTTPS-only.

## Local contract checks

These deployment checks do not require Rails services:

```sh
cpflow doctor --app gumroad-inertia
sh -n .controlplane/entrypoint.sh .controlplane/release_script.sh
bash -n bin/prepare-control-plane-benchmark-secrets
bundle exec rspec -O /dev/null spec/controlplane
```

The fixture specs require the repository's local MySQL, MongoDB, Redis, Memcached, and Elasticsearch services; test storage remains local and does not require R2 credentials. A full Docker image build, secret/policy provisioning, private R2 access verification, release job, workload readiness, generated-host smoke test, and final-domain QA require live Docker, R2, or Control Plane access and belong in the deployment validation run. Provisioning the bucket is deliberately outside that run.
