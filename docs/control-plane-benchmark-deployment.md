# Control Plane RORP benchmark deployment

`gumroad-rorp` is the isolated RORP benchmark app in `shakacode-open-source-examples-staging` (`aws-us-east-2`). Its GVC runs Rails, Sidekiq, a private authenticated renderer, MySQL, DynamoDB, Redis, Elasticsearch, and Memcached. The app uses an operator-owned R2 bucket under the `benchmarks/gumroad-rorp/` key prefix; the bucket and its public custom domain must exist before deployment.

The RORP path in this branch serves **full profile-layout Product documents for sellers with `product_page_react_on_rails` enabled**. Discover, seller profiles, and Discover-layout Product pages remain on Inertia. The fixture seeds do not enable the flag, so set and verify it for the seller being compared before claiming the RSC path is live.

## Bootstrap the app

Use cpflow 6.0.1 from the repository root. Authenticate `cpln` with its saved profile or `CPLN_TOKEN`. Before setup, provision the `gumroad-on-demand-metrics` dictionary described below. Supply credentials scoped to the existing R2 bucket:

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

For an existing GVC, complete the one-time migration below before deploying.
Use the guarded deployment wrapper in the next section; it reapplies the runtime
templates only after verifying the existing migration. Do not apply these runtime
templates directly to legacy workloads. R2 provisioning remains a separate bootstrap
operation and is unchanged by the runtime migration.

## Build and deploy

Build from the exact proposed commit and record the currently deployed image digests before promotion:

```sh
cpflow build-image --app gumroad-rorp --org "$CPLN_ORG" --commit "$(git rev-parse HEAD)"

for workload in rails sidekiq renderer; do
  cpln workload get "$workload" --gvc gumroad-rorp --org "$CPLN_ORG" --output json |
    jq -r --arg workload "$workload" '.spec.containers[] | select(.name == $workload) | .image'
done

APP_NAME=gumroad-rorp .controlplane/deploy_on_demand.sh
```

The workloads use the resolved image digest. The guarded release checks the app and surface, waits for backing services, runs `db:prepare`, creates the DynamoDB table if needed, and verifies private R2 write/read/delete plus public delivery and delete-to-404. The configured release command sets `ALLOW_BENCHMARK_SEED=true`, then installs the deterministic native Product, seller-profile, and Discover fixtures and reindexes Elasticsearch. The normal image entrypoint does not migrate or seed.

## Verify routing and storage

Start at the generated `rails-<deployment-id>.cpln.app` host. Check `/healthcheck`, `/`, `/discover`, `/software-development/programming`, `/l/O365IT?layout=discover`, and `/seller`. Then check the final root and seller domains. The generated Rails host is accepted only while `BRANCH_DEPLOYMENT=true` and only for the narrow `rails-[a-z0-9]+.cpln.app` hostname form.

For the RSC check, enable and verify `product_page_storefront_enabled` and `product_page_react_on_rails` for the test Product's seller, then request that Product as a full document with no layout parameter. Confirm it renders through RORP; confirm Discover, seller profiles, and Discover-layout Products still render through Inertia. Check `/vite/` and `/public-rsc/` assets, renderer health, and readiness for Rails, Sidekiq, renderer, and the five backing services while the demo is awake. Zero replicas are expected after an idle period.

Confirm fixture media uses `public-files.gumroad-rorp.reactonrails.com/benchmarks/gumroad-rorp/` rather than exposing the R2 API endpoint. Verify a deleted probe is no longer publicly available. The final root is `https://gumroad-rorp.reactonrails.com`; seller and benchmark seller subdomains route to the Rails workload. Cookies remain host-only and HTTPS-only.

## Roll back an image

Use the previously recorded digest. Update all three app workloads, then verify readiness:

```sh
previous_image='/org/shakacode-open-source-examples-staging/image/gumroad-rorp@sha256:...'
for workload in rails sidekiq renderer; do
  cpln workload update "$workload" --gvc gumroad-rorp --org "$CPLN_ORG" \
    --set "spec.containers.${workload}.image=$previous_image"
done
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

## On-demand runtime

The two demo frontends use serverless workloads with a two-minute idle timeout.
KEDA scales their supporting services from zero when the Rails container starts.
The trigger uses fresh `replica_count` samples: desired scale can remain zero while
an incoming request waits for Rails to become ready. The image-packaged startup script waits for
database sockets, the renderer for Rails and release jobs, and a yellow or green
Elasticsearch cluster before starting Rails.
The request timeout and liveness budget allow that bounded startup to finish.

Redis uses a retained volume so queued jobs survive sleep. Sidekiq's cooldown is
shorter than the databases' cooldowns, and Redis remains available longest to allow
workers to shut down. KEDA operators remain running per GVC; operator capacity and
retained volumes remain billable while the application services sleep.

The staging organization must have a dictionary secret named
`gumroad-on-demand-metrics` with a `bearerToken` field. Use a dedicated service
account whose only grant is `readMetrics` on the organization. Provision and rotate
that credential through Control Plane; never put its value in templates or logs.

Both deployment workflows run `.controlplane/deploy_on_demand.sh`. It applies the
complete runtime configuration while preserving existing workload images,
holds Rails at one replica while release jobs run, and restores scale-to-zero mode
on exit, including a failed release. Run the same script locally with `APP_NAME`
and `CPLN_ORG` set to one of these staging demos. The startup script is packaged
in the application image and follows its pinned digest, so a failed release
cannot change the startup code used by the previous image. Images older than this
feature need the original runtime specifications when rolling back.

### First migration

The deployment wrapper refuses legacy workloads before applying any changes.
The one-time migration must install an image containing the startup helper, then
configure both Rails and Sidekiq to use it. Verify the helper exists in each
selected image before switching runtime arguments.

Workload types are immutable. Migrate the existing standard Rails and Redis
workloads before running these templates against an existing demo. Save their
complete specifications and preserve all existing image references and domains.
For Redis, stop Rails and Sidekiq, verify the queues have drained, take an RDB
backup, and restore it into the retained Redis volume before starting the new
stateful workload. Keep the backup and original specifications outside the
repository. Do not delete a volume set during migration or rollback.

Existing unused MongoDB workloads remain suspended with their volumes retained;
the application has no MongoDB dependency and these templates do not provision it.

Scheduled background work waits until the demo next wakes; these are interactive
benchmark environments rather than continuously running job processors.

After migration, verify a complete idle period with all eight application services
at zero replicas, then request a seeded product through its public custom domain.
Check the first response, rendering, assets, Redis data, and a subsequent warm
request. A homepage check alone does not establish that a seeded product renders.

Run the focused startup and deployment-failure checks with:

```sh
ruby test/scripts/on_demand_startup_test.rb
```

Rails uses fixed CPU and memory while awake. Capacity AI is disabled for serverless Rails because its periodic rollouts create new revisions that start a replica even without visitor traffic.

A separate 25m/32Mi serverless `robots` workload serves `User-agent: *` and `Disallow: /`. Configure the demo domain routes once with `APP_NAME` and `CPLN_ORG` set, then run `ruby .controlplane/prepare_demo_robots.rb` after applying the robots template. Regular deploys preserve those domain routes and refresh the robots workload. Crawlers can retrieve `/robots.txt` without waking Rails or databases; bots that ignore the policy can still wake the demo. The robots workload does not inherit application secrets.

Renderer Capacity AI matches the setting already used by both live demos. The renderer uses a standard workload with KEDA, and both native sleep/wake checks confirmed it reaches zero. Rails Capacity AI stays disabled because serverless revision rollouts can start a replica without a visitor.
