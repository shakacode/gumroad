# Public RSC local development

## Start the runtime

```shell
docker compose -f docker/docker-compose-local.yml up -d
npm install
bin/rails db:create db:migrate db:seed
```

`bin/dev` starts the app processes, public-RSC watcher, and renderer. The watcher exports Rails JavaScript and
regenerates packs before building. `bin/dev-lane 1` uses Rails port 3001 and renderer port 3801 and exports both
renderer variables.

## Build verification

```shell
npm run build:public-rsc
```

Use `npm run build:public-rsc:test` for test or `NODE_ENV=production` for production. Zero-root generation still emits
the bootstrap and both bundles.

Docker exports Rails JavaScript, generates packs, and waits for the renderer. Production requires
`RENDERER_PASSWORD`; development and test use `devPassword`.
