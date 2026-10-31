#!/bin/sh
set -eu

case "${CPLN_GVC:-${BRANCH:-}}" in
  gumroad-rorp) EXPECTED_APP="gumroad-rorp"; EXPECTED_SURFACE="rorp" ;;
  gumroad-inertia) EXPECTED_APP="gumroad-inertia"; EXPECTED_SURFACE="inertia" ;;
  *) echo "Refusing release outside the benchmark apps" >&2; exit 1 ;;
esac

log() {
  echo "[$(date +%Y-%m-%d:%H:%M:%S)]: $1"
}

error_exit() {
  log "$1" >&2
  exit 1
}

app_name="${CPLN_GVC:-${BRANCH:-}}"
[ "$app_name" = "$EXPECTED_APP" ] || error_exit "Refusing release for app ${app_name:-<unset>}; expected ${EXPECTED_APP}"
[ "${GUMROAD_RENDERING_SURFACE:-}" = "$EXPECTED_SURFACE" ] || error_exit "Refusing release for surface ${GUMROAD_RENDERING_SURFACE:-<unset>}; expected ${EXPECTED_SURFACE}"

# Rails must stay awake while release jobs run: its replica metric wakes dependencies.
# Use deploy_on_demand.sh rather than invoking the release phase directly.
if [ "${SKIP_CONTROL_PLANE_SERVICE_WAIT:-}" != true ]; then
  ruby .controlplane/on_demand_startup.rb true || error_exit "Demo dependencies did not become ready"
fi

[ -x ./bin/rails ] || error_exit "./bin/rails does not exist or is not executable"

log "Preparing the benchmark database"
./bin/rails db:prepare || error_exit "Database preparation failed"

log "Preparing the benchmark DynamoDB table"
./bin/rails runner 'begin; EmailEngagementDynamoStore.create_table!; rescue Aws::DynamoDB::Errors::ResourceInUseException; end' || error_exit "DynamoDB preparation failed"

log "Verifying benchmark R2 API access and public delivery"
./bin/rails runner scripts/verify_control_plane_benchmark_storage.rb || error_exit "Benchmark R2 storage verification failed"

if [ "${ALLOW_BENCHMARK_SEED:-}" = "true" ]; then
  log "Installing deterministic benchmark fixtures"
  ./bin/rails runner 'Taxonomy::Seeder.new.perform' || error_exit "Taxonomy bootstrap failed"
  ./bin/rails runner scripts/seed_native_product_page.rb || error_exit "Native product seed failed"
  ./bin/rails runner scripts/seed_shakaperf_seller_profile.rb || error_exit "Seller profile seed failed"
  ./bin/rails runner scripts/seed_shakaperf_discover.rb || error_exit "Discover seed failed"
  ./bin/rails runner 'DevTools.delete_all_indices_and_reindex_all' || error_exit "Benchmark reindex failed"
else
  log "Skipping benchmark seeds; set ALLOW_BENCHMARK_SEED=true on an explicitly guarded release"
fi

log "Applying and verifying the product-page rendering flag"
./bin/rails runner scripts/configure_control_plane_product_page.rb || error_exit "Product-page flag configuration failed"

log "Release completed for ${EXPECTED_APP}/${EXPECTED_SURFACE}"
