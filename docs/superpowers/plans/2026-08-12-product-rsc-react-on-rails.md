# Product RSC React on Rails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in React Server Components rendering path for Gumroad's existing seeded Discover product page through React on Rails Pro, without changing product content, business logic, presenter data, existing routes, or the default Inertia rendering path.

**Architecture:** Preserve `LinksController#show`, `ProductPresenter#discover_product_props`, Rails-owned metadata, custom HTML short-circuiting, and the current Vite/Inertia application. Add the stable React 19 / React on Rails Pro 17 RSC runtime as a product-only, explicitly selected renderer with its own browser/server/RSC bundles and Node renderer. The RSC wrapper renders the existing `DiscoverLayout` and `Product/Layout` from the same props and supplies the Inertia/provider context those existing components require; normal product requests remain unchanged as rollback and parity control.

**Tech Stack:** Rails 7.1, React 19.2.7, Inertia, Vite, React on Rails Pro 17.0.0, react-on-rails-rsc 19.2.1, webpack 5, Node renderer, Minitest/RSpec, seeded development data.

## Global Constraints

- Do not add, remove, rewrite, or substitute Gumroad product content, marketing copy, seed content, page sections, or visual design.
- Do not move pricing, discounts, checkout decisions, authorization, analytics policy, custom-domain behavior, metadata, or other business logic out of Rails.
- Reuse the existing `ProductPresenter#discover_product_props` result as the product contract; do not create a parallel fixture/presenter/data model.
- Keep ordinary product requests on their existing Inertia path; only `layout=discover&rsc=1` opts into RSC during this migration.
- Keep custom HTML, JSON, profile, default, iframe, overlay, partial Inertia requests, redirects, and mutation endpoints on their current behavior.
- Keep Vite as the existing application/widget pipeline; the React on Rails bundles are product-RSC-specific and must not replace or duplicate existing page content.
- Use stable versions from the audited demo: React/React DOM/react-server-dom-webpack `19.2.7`, React on Rails Pro gem/npm/node renderer `17.0.0`, and react-on-rails-rsc `19.2.1`.
- Do not copy ShakaPerf, benchmark twins, synthetic fixtures/assets, comparison pages, performance/marketing docs, or Control Plane multi-surface code from the demo repository.
- Preserve the rendering order: compute Rails rendering context before releasing Active Record connections, release connections before the long-lived stream, and always clean them up after streaming.
- Local/Docker-only support may be added as needed, but it must not weaken production credential requirements or alter Gumroad application behavior.

---

### Task 1: Add the isolated React on Rails RSC runtime

**Files:**
- Modify: `Gemfile`
- Modify: `Gemfile.lock`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `config/initializers/react_on_rails.rb`
- Create: `config/initializers/react_on_rails_pro.rb`
- Create: `config/webpack/product_rsc.config.cjs`
- Create: `config/webpack/activestorage_server.js`
- Create: `config/webpack/loaders/productRscTransformerLoader.js`
- Create: `client/node-renderer.cjs`
- Test: `test/config/react_on_rails_rsc_configuration_test.rb`

**Interfaces:**
- Consumes: current Vite aliases (`$app`, `$assets`, `$vendor`), TypeScript/typia transformation requirements, and Rails environment conventions.
- Produces: `public/product-rsc/product_rsc.js`, `ssr-generated/server-bundle.js`, `ssr-generated/rsc-bundle.js`, a configured React on Rails Pro Node renderer at `REACT_RENDERER_URL`, and package scripts `build:product-rsc`, `build:product-rsc:test`, and `watch:product-rsc`.

- [ ] **Step 1: Add a failing configuration test**

```ruby
test "configures the product RSC renderer and stable bundle names" do
  assert_equal "server-bundle.js", ReactOnRails.configuration.server_bundle_js_file
  assert ReactOnRails.configuration.enforce_private_server_bundles
  assert ReactOnRailsPro.configuration.enable_rsc_support
  assert_equal "rsc-bundle.js", ReactOnRailsPro.configuration.rsc_bundle_js_file
end
```

- [ ] **Step 2: Run the test and confirm the runtime constants/configuration are absent**

Run: `bin/rails test test/config/react_on_rails_rsc_configuration_test.rb`

- [ ] **Step 3: Add the stable Ruby and npm dependencies without replacing Vite**

Add `react_on_rails_pro = 17.0.0` and its Shakapacker dependency to Ruby, and pin the audited React/RSC packages and webpack build dependencies in npm. Keep the existing Vite scripts and add only the three product-RSC scripts.

- [ ] **Step 4: Configure React on Rails and its Node renderer**

Use private server bundles, explicit bundle loading, RSC support, a development/test-only default renderer password, and required `RENDERER_PASSWORD` outside those environments. The Node renderer must use the same password policy and port `3800` by default.

- [ ] **Step 5: Build three product-only webpack targets**

The client target writes the browser bundle, the server target writes `server-bundle.js`, and the react-server-condition target writes `rsc-bundle.js`. Resolve the existing aliases, transform typia/TypeScript consistently, register only the product RSC client-reference directory, and use a server-safe Active Storage alias. Add the `File` polyfill only if Node/build execution proves it necessary.

- [ ] **Step 6: Install dependencies and build all three targets**

Run: `bundle install`, `npm install`, `npm run build:product-rsc:test`

Expected: all three bundles build without changing Vite output or application content.

- [ ] **Step 7: Run the configuration test and focused static checks**

Run: `bin/rails test test/config/react_on_rails_rsc_configuration_test.rb`

Run: `npm run typecheck`

- [ ] **Step 8: Commit**

```bash
git add Gemfile Gemfile.lock package.json package-lock.json config/initializers/react_on_rails.rb config/initializers/react_on_rails_pro.rb config/webpack client/node-renderer.cjs test/config/react_on_rails_rsc_configuration_test.rb
git commit -m "Add product RSC runtime"
```

---

### Task 2: Stream the existing Discover product page through RSC

**Files:**
- Modify: `app/controllers/links_controller.rb`
- Create: `app/controllers/concerns/live_active_record_connection_cleanup.rb`
- Create: `app/controllers/concerns/live_streaming_response_headers.rb`
- Create: `app/javascript/product_rsc/server_entry.tsx`
- Create: `app/javascript/product_rsc/client_entry.tsx`
- Create: `app/javascript/product_rsc/NativeProductRscPage.tsx`
- Create: `app/views/links/rsc_show.html.erb`
- Modify: `test/controllers/links_controller_test.rb`

**Interfaces:**
- Consumes: Task 1 bundle/runtime names and the unmodified `ProductPresenter#discover_product_props` result.
- Produces: an HTML stream for `layout=discover&rsc=1` rooted at `native-product-rsc-root`; all other `LinksController#show` responses retain their existing renderer and props.

- [ ] **Step 1: Add failing controller coverage for the exact opt-in boundary**

Cover an ordinary Discover request (still Inertia), the RSC request (RSC template/layout/headers), partial Inertia autocomplete (still partial Inertia), and the RSC props contract (existing product/taxonomy/global URL, no CSP nonce). Assert no presenter/content substitute is introduced.

- [ ] **Step 2: Run the focused controller tests and confirm the RSC case fails**

Run: `bin/rails test test/controllers/links_controller_test.rb`

- [ ] **Step 3: Add streaming lifecycle concerns**

Implement response headers that prevent proxy/Rack buffering and an around-action cleanup that releases all Active Record pools on exit. Keep comments limited to the non-obvious buffering and connection-order constraints.

- [ ] **Step 4: Add the narrow controller render dispatch**

Build `discover_product_props` exactly once, return the RSC renderer only for `params[:rsc] == "1"`, `layout=discover`, HTML, and non-partial requests, precompute `RenderingExtension.custom_context(view_context)`, remove `csp_nonce`, append `href`, release DB connections, then stream `links/rsc_show` with the existing `inertia` layout and stream observability.

- [ ] **Step 5: Add the RSC wrapper using existing Gumroad components**

The wrapper must create the minimal Inertia `Page` context and render the same existing composition as `Products/Discover/Show`: `AppWrapper`, logged-in/current-seller providers, `Alert`, `DiscoverLayout`, and `Product/Layout cart hasHero`. It must not contain product copy, fixture values, or duplicated business logic.

- [ ] **Step 6: Register the component and add the stream template**

Register `NativeProductRscPage` in the server entry, initialize the browser entry through React on Rails Pro, include the Task 1 browser bundle explicitly, and call `stream_react_component` with automatic bundle loading and trace/replay disabled.

- [ ] **Step 7: Build and run focused tests**

Run: `npm run build:product-rsc:test`

Run: `bin/rails test test/controllers/links_controller_test.rb`

Run: `npm run typecheck`

- [ ] **Step 8: Commit**

```bash
git add app/controllers/links_controller.rb app/controllers/concerns/live_active_record_connection_cleanup.rb app/controllers/concerns/live_streaming_response_headers.rb app/javascript/product_rsc app/views/links/rsc_show.html.erb test/controllers/links_controller_test.rb
git commit -m "Stream existing product page through RSC"
```

---

### Task 3: Make the product RSC path runnable and verifiable locally

**Files:**
- Modify: `Procfile.dev`
- Modify: `bin/dev-lane`
- Modify: `docker/web/Dockerfile`
- Modify: `docker/web/server.sh`
- Modify: `.gitignore`
- Create: `docs/product-rsc-local-development.md`
- Modify: relevant request/system spec under `spec/requests/products/show/`

**Interfaces:**
- Consumes: Task 1 build/renderer scripts and Task 2 opt-in URL.
- Produces: local processes for the product-RSC bundle watcher and Node renderer, production/test build hooks, reproducible seeded-product verification instructions, and browser parity evidence.

- [ ] **Step 1: Add a failing request/system smoke example**

Use an existing product factory/seed-compatible product and assert the RSC URL renders the real product name, price, and CTA while the normal URL still renders the same existing content. Do not add a new product fixture or copy.

- [ ] **Step 2: Run the smoke example and confirm the local RSC runtime is required**

Run the exact spec example selected in Step 1.

- [ ] **Step 3: Add local processes without displacing Rails/Vite/AnyCable/Sidekiq**

Add a product-RSC webpack watcher and Node renderer to `Procfile.dev`; pass lane-specific renderer ports/URLs through `bin/dev-lane`. Keep the existing Vite process unchanged.

- [ ] **Step 4: Add Docker build/runtime support**

Ensure npm dependencies and the product-RSC production bundles are built in the web image/runtime path and the renderer can be launched with a required non-development password. Do not add benchmark databases, fake product seeds, twin servers, or deployment surfaces.

- [ ] **Step 5: Document seeded verification**

Document how to run existing services/seeds, identify an existing seeded product permalink, start the app/runtime, and compare the ordinary Discover URL with `layout=discover&rsc=1`. State the opt-in/rollback boundary explicitly.

- [ ] **Step 6: Run focused automated verification**

Run: `npm run build:product-rsc:test`

Run: `bin/rails test test/config/react_on_rails_rsc_configuration_test.rb test/controllers/links_controller_test.rb`

Run: the focused request/system spec from Step 1.

Run: `npm run typecheck`

- [ ] **Step 7: Verify in the in-app browser**

Start required local services, seed existing data, open both the ordinary and RSC Discover product URLs, and verify visible title, seller, price, cover/content sections, CTA, navigation, responsive desktop/mobile layout, light/dark behavior, no console errors attributable to the migration, and successful client interaction/hydration. Save visual evidence under `qa-media/` only if needed for handoff/PR review.

- [ ] **Step 8: Commit**

```bash
git add Procfile.dev bin/dev-lane docker/web/Dockerfile docker/web/server.sh .gitignore docs/product-rsc-local-development.md spec/requests/products/show
git commit -m "Run product RSC locally"
```

---

### Task 4: Whole-branch regression review and final verification

**Files:**
- Modify: only files required to address review findings.

**Interfaces:**
- Consumes: Tasks 1-3 and their test evidence.
- Produces: a reviewed branch whose RSC renderer is opt-in, content-neutral, locally runnable, and verified against the unchanged product page.

- [ ] **Step 1: Review the whole diff against the global constraints**

Reject copied demo content, presenter duplication, global Inertia interception, default-route cutover, production credential fallbacks, and unrelated dependency/content churn.

- [ ] **Step 2: Run the final focused suite**

Run all commands from Task 3 Step 6 plus lint checks on modified Ruby/TypeScript files.

- [ ] **Step 3: Repeat browser parity after review fixes**

Verify the seeded control and RSC URLs again in the in-app browser and record any environment limitations precisely.

- [ ] **Step 4: Commit the single final review-fix wave if needed**

```bash
git add <reviewed-files>
git commit -m "Address product RSC review findings"
```
