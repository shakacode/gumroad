# Selective product RSC rendering

Product pages can use React on Rails Pro streaming and React Server Components while the rest of the application stays on Vite and Inertia. This is an opt-in rendering path, not a measured performance improvement. It requires the shared React 19 prerequisite in [PR #122](https://github.com/shakacode/gumroad/pull/122).

`Feature.active?(:product_page_react_on_rails, product.user)` selects the product's seller. The route supports full HTML `/l/:id` documents using the profile layout, including a seller's default storefront layout. Incoming Inertia visits receive a document redirect. JSON, partial visits, embeds, overlays, custom-domain root routes, and other application pages keep their existing paths. Disabling the seller flag returns subsequent document requests to Inertia without rebuilding assets.

The public app exposes no `/rsc_payload` endpoint. The initial document embeds its Flight payload; ordinary product links load the next document. Arbitrary component names or caller-supplied product props cannot enter a public renderer endpoint. Server actions are not part of this integration.

## Local build and runtime

Install the locked Ruby and npm dependencies using the repository setup command. Build the ordinary Vite assets as usual, then build the additional product assets:

```sh
RAILS_ENV=development npm run build:public-rsc
```

For local development, give Rails and the Node renderer the same nonempty `RENDERER_PASSWORD` through your untracked environment. Set `REACT_RENDERER_URL` on Rails and `RENDERER_PORT` on Node to matching isolated ports. `bin/dev-lane` exports matching per-lane port values. Start the normal application and these two additional processes in that environment:

```sh
npm run watch:public-rsc
node client/node-renderer.cjs
```

No renderer process is added to the default `Procfile.dev`. Asset generation and flag-off Inertia can boot without renderer credentials. A flagged document returns a generic, non-cacheable 503 when the renderer is unconfigured or its connection fails before streaming starts. Renderer failures after the first byte cannot become a replacement HTTP error response. Application rendering errors remain errors; they are not silently converted to Inertia.

The Node process requires the locked renderer dependencies, a writable bundle-cache directory, and a private authenticated connection from Rails. The existing production web image removes `node_modules`; it cannot also run the Node renderer. Package that service separately using the same lockfile. This contribution does not provision a service or change deployment settings.

## Asset boundaries

Vite remains responsible for the existing application scripts and shared styles. Rspack builds three additional targets in order: public client, private SSR, and private RSC. `assets:precompile` includes this build before the widget task changes domain environment variables.

- `public/public-rsc`: browser chunks, public imported assets, and local build manifests.
- `ssr-generated`: private SSR/RSC bundles and server manifest. Never publish this directory as static assets.
- Production/staging browser paths use `/assets/public-rsc/` on the configured Shakapacker/Rails asset host. The same host is compiled into Flight hints and lazy chunks. Set `SHAKAPACKER_ASSET_HOST` at build time when overriding the application's asset host.
- Public asset upload excludes source maps and manifests. Main, preview, and test cache keys include the new build inputs and preserve both public assets and private renderer bundles.

Builds require no renderer credentials. The React, React DOM, and Flight package versions must remain matched. The installed RSC loader is `react-on-rails-rsc/WebpackLoader`, which also runs under Rspack; the similarly named Rspack loader in the pinned release is not a substitute.

## Verification and cost

```sh
RAILS_ENV=test npm run build:public-rsc
bundle exec rails test test/lib/product_rsc_document_request_constraint_test.rb test/presenters/product_rsc_content_props_test.rb
.agents/bin/test spec/requests/products/show/product_rsc_boundary_spec.rb spec/requests/products/show/product_rsc_spec.rb spec/requests/products/show/product_renderer_coexistence_spec.rb spec/requests/inertia_asset_isolation_spec.rb
```

The RSC system-test helper reserves an isolated local renderer port and generates an ephemeral password. It restores configuration and stops its child process after each example. The boundary test uses a reserved, non-listening socket to prove a real connection-refused response.

The integration adds a second compiler, three product build targets, a separately operated Node renderer, a private bundle cache, build-cache entries, and client/server component boundaries that must stay aligned with the Inertia product behavior. Inertia also receives the shared React 19 dependency changes and product component extraction; it is not identical to untouched upstream. Compare both flag states on the same integration commit and record these costs alongside any later performance results.
