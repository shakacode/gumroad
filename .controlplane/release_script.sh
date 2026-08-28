#!/bin/sh
set -eu

EXPECTED_APP="gumroad-inertia"
EXPECTED_SURFACE="inertia"

log() {
  echo "[$(date +%Y-%m-%d:%H:%M:%S)]: $1"
}

error_exit() {
  log "$1" >&2
  exit 1
}

wait_for_tcp() {
  host="$1"
  port="$2"
  name="$3"

  if [ "${SKIP_CONTROL_PLANE_SERVICE_WAIT:-}" = "true" ]; then
    log "Skipping wait for ${name}"
    return
  fi

  log "Waiting for ${name} at ${host}:${port}"
  attempt=1
  while [ "$attempt" -le 90 ]; do
    if ruby -rsocket -e "TCPSocket.new('${host}', ${port}).close"; then
      return
    fi
    attempt=$((attempt + 1))
    sleep 2
  done

  error_exit "Timed out waiting for ${name}"
}

app_name="${CPLN_GVC:-${BRANCH:-}}"
[ "$app_name" = "$EXPECTED_APP" ] || error_exit "Refusing release for app ${app_name:-<unset>}; expected ${EXPECTED_APP}"
[ "${GUMROAD_RENDERING_SURFACE:-}" = "$EXPECTED_SURFACE" ] || error_exit "Refusing release for surface ${GUMROAD_RENDERING_SURFACE:-<unset>}; expected ${EXPECTED_SURFACE}"

wait_for_tcp "${DATABASE_HOST}" "${DATABASE_PORT:-3306}" mysql
wait_for_tcp "mongo.${app_name}.cpln.local" 27017 mongo
wait_for_tcp "redis.${app_name}.cpln.local" 6379 redis
wait_for_tcp "memcached.${app_name}.cpln.local" 11211 memcached
wait_for_tcp "elasticsearch.${app_name}.cpln.local" 9200 elasticsearch

[ -x ./bin/rails ] || error_exit "./bin/rails does not exist or is not executable"

log "Preparing the benchmark database"
./bin/rails db:prepare || error_exit "Database preparation failed"

log "Verifying private benchmark R2 storage"
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

log "Release completed for ${EXPECTED_APP}/${EXPECTED_SURFACE}"
