# Product RSC local development

The product RSC page is an opt-in parity path for the existing Discover product page. The ordinary Discover URL remains the rollback path throughout this migration.

## Start local services and seed existing data

Start the backing services once:

```shell
docker compose -f docker/docker-compose-local.yml up -d
```

Install JavaScript dependencies with the repository's current peer-dependency compatibility mode, then create, migrate, and seed the existing development database:

```shell
npm install
bin/rails db:create db:migrate db:seed
```

The development seeds create the published `demo` product. Confirm the permalink from the database instead of copying product data into a fixture:

```shell
bin/rails runner 'puts Link.find_by!(unique_permalink: "demo").unique_permalink'
```

Start the complete local process set, including the existing Rails, Vite, Sidekiq, and AnyCable processes plus the product-RSC watcher and Node renderer:

```shell
bin/dev
```

For a parallel lane, `bin/dev-lane 1` assigns Rails to port 3001 and the renderer to port 3801. It exports both `RENDERER_PORT` and `REACT_RENDERER_URL`, so no extra renderer configuration is needed.

## Verify the seeded product

With `demo` as the permalink, compare these two URLs in the same browser:

- Ordinary Discover page: `http://localhost:3000/l/demo?layout=discover`
- Discover-layout product RSC: `http://localhost:3000/l/demo?layout=discover`

The RSC URL must show the same product title, seller, price, content and purchase CTA as the ordinary page. Confirm navigation and a client interaction after hydration. All eligible full product documents use the RSC renderer without a query-parameter opt-in.

## Docker web runtime

The web image installs npm dependencies and creates the production product-RSC bundles while it builds. At runtime `docker/web/server.sh` starts the Node renderer alongside Rails. Production-like environments must provide a renderer password, for example:

```shell
RENDERER_PASSWORD=replace-with-a-secret RAILS_ENV=production docker/web/server.sh
```

The Docker runtime owns a local renderer. It defaults to port 3800 and sets Rails' internal `REACT_RENDERER_URL` to `http://127.0.0.1:3800`; set `RENDERER_PORT` to move that paired local port.
