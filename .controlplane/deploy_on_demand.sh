#!/bin/sh
set -eu

case "${APP_NAME:-}" in
  gumroad-rorp) app_template=app-rorp ;;
  gumroad-inertia) app_template=app-inertia ;;
  *) echo "Refusing deployment outside the demo apps" >&2; exit 1 ;;
esac
[ "${CPLN_ORG:-}" = "shakacode-open-source-examples-staging" ] || exit 1

ruby .controlplane/check_on_demand_migration.rb
ruby .controlplane/prepare_renderer_secret.rb
cpflow apply-template "$app_template" mysql dynamodb redis elasticsearch memcached renderer sidekiq rails \
  -a "$APP_NAME" --org "$CPLN_ORG" --preserve-existing-runtime --yes

# Release jobs need databases even when no browser is visiting the demo.
restore_on_demand() {
  result=$?
  trap - EXIT
  cpln workload update rails --org "$CPLN_ORG" --gvc "$APP_NAME" \
    --set spec.defaultOptions.autoscaling.minScale=0 -o names || { echo "Failed to restore on-demand mode" >&2; exit 1; }
  exit "$result"
}
trap restore_on_demand EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
cpln workload update rails --org "$CPLN_ORG" --gvc "$APP_NAME" \
  --set spec.defaultOptions.autoscaling.minScale=1 -o names
cpflow deploy-image -a "$APP_NAME" --org "$CPLN_ORG" --run-release-phase --verbose
