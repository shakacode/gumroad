#!/bin/bash

set -e

cd $APP_DIR

if [[ "${RAILS_ENV:-development}" != "development" && "${RAILS_ENV:-development}" != "test" && -z "${RENDERER_PASSWORD:-}" ]]; then
  echo "RENDERER_PASSWORD must be set outside development and test." >&2
  exit 1
fi

export RENDERER_PORT="${RENDERER_PORT:-3800}"
export REACT_RENDERER_URL="http://127.0.0.1:${RENDERER_PORT}"

consul_put() {
  curl \
    --silent \
    --request PUT \
    --data $2 \
    http://localhost:8500/v1/kv/$1 > /dev/null
}

# Set default value for port
export PORT=3000

# For preview apps, use the Nomad-allocated port and register the app's address in consul for routing
if [[ $BRANCH_DEPLOYMENT == "true" ]]; then
  if [[ ! -z "$NOMAD_HOST_PORT_puma" ]]; then
    export PORT=$NOMAD_HOST_PORT_puma
    consul_put $CUSTOM_DOMAIN $NOMAD_ADDR_puma
  fi
fi

# Production/staging images already ran this in compile_assets.sh (docker commit).
# Re-running on every boot holds :3000 closed while nginx is already in ALB rotation.
if [[ ! -f app/javascript/utils/routes.js || ! -f public/pages-tailwind.css ]]; then
  echo "npm run setup"
  npm run setup
else
  echo "npm run setup skipped (outputs already in image)"
fi

echo "node client/node-renderer.cjs"
node client/node-renderer.cjs &
renderer_pid=$!

renderer_is_healthy() {
  node -e '
    const client = require("node:http2").connect(`http://127.0.0.1:${process.env.RENDERER_PORT}`);
    const request = client.request({ ":path": "/health" });
    const fail = () => { client.close(); process.exit(1); };
    client.on("error", fail);
    request.on("error", fail);
    request.on("response", (headers) => {
      client.close();
      process.exit(headers[":status"] === 200 ? 0 : 1);
    });
    request.end();
    setTimeout(fail, 1000).unref();
  '
}

for _ in {1..20}; do
  renderer_is_healthy && break
  if ! kill -0 "$renderer_pid" 2>/dev/null; then
    wait "$renderer_pid"
  fi
  sleep 0.25
done

if ! renderer_is_healthy; then
  echo "Public RSC renderer did not become healthy." >&2
  kill "$renderer_pid" 2>/dev/null || true
  wait "$renderer_pid" 2>/dev/null || true
  exit 1
fi

bundle exec rails server -p "$PORT" &
rails_pid=$!

stop_processes() {
  kill "$renderer_pid" "$rails_pid" 2>/dev/null || true
  wait "$renderer_pid" "$rails_pid" 2>/dev/null || true
}

trap stop_processes EXIT INT TERM

wait -n "$renderer_pid" "$rails_pid"
