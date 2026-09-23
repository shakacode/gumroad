# Control Plane RORP benchmark deployment

`gumroad-rorp` is the isolated RORP benchmark app in `shakacode-open-source-examples-staging` (`aws-us-east-2`). Its GVC runs Rails, Sidekiq, a private authenticated renderer, MySQL, DynamoDB, Redis, Elasticsearch, and Memcached. The app uses an operator-owned R2 bucket under the `benchmarks/gumroad-rorp/` key prefix; the bucket and its public custom domain must exist before deployment.

The RORP path in this branch serves **full profile-layout Product documents for sellers with `product_page_react_on_rails` enabled**. Discover, seller profiles, and Discover-layout Product pages remain on Inertia. The fixture seeds do not enable the flag, so set and verify it for the seller being compared before claiming the RSC path is live.

## Bootstrap the app

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

For an existing GVC, reapply changed templates before deploying; `setup-app` does not update them:

```sh
cpflow apply-template \
  app-rorp r2 mysql dynamodb redis elasticsearch memcached rails sidekiq renderer \
  --app gumroad-rorp --org "$CPLN_ORG" --yes
```

## Build and deploy

Build from the exact proposed commit and record the currently deployed image digests before promotion:

```sh
cpflow build-image --app gumroad-rorp --org "$CPLN_ORG" --commit "$(git rev-parse HEAD)"

for workload in rails sidekiq renderer; do
  cpln workload get "$workload" --gvc gumroad-rorp --org "$CPLN_ORG" --output json |
    jq -r --arg workload "$workload" '.spec.containers[] | select(.name == $workload) | .image'
done

cpflow deploy-image --app gumroad-rorp --org "$CPLN_ORG" --run-release-phase
```

The workloads use the resolved image digest. The guarded release checks the app and surface, waits for backing services, runs `db:prepare`, creates the DynamoDB table if needed, and verifies private R2 write/read/delete plus public delivery and delete-to-404. The configured release command sets `ALLOW_BENCHMARK_SEED=true`, then installs the deterministic native Product, seller-profile, and Discover fixtures and reindexes Elasticsearch. The normal image entrypoint does not migrate or seed.

## Verify routing and storage

Start at the generated `rails-<deployment-id>.cpln.app` host. Check `/healthcheck`, `/`, `/discover`, `/software-development/programming`, `/l/O365IT?layout=discover`, and `/seller`. Then check the final root and seller domains. The generated Rails host is accepted only while `BRANCH_DEPLOYMENT=true` and only for the narrow `rails-[a-z0-9]+.cpln.app` hostname form.

For the RSC check, enable and verify `product_page_react_on_rails` for the test Product's seller, then request that Product as a full `layout=profile` document. Confirm it renders through RORP; confirm Discover, seller profiles, and Discover-layout Products still render through Inertia. Check `/vite/` and `/public-rsc/` assets, renderer health, and readiness for Rails, Sidekiq, renderer, and the five backing services.

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
