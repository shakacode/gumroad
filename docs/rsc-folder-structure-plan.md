# Public RSC folder structure and naming plan

## Purpose

This is a file-organization and naming plan for the public React Server Component implementation. Its purpose is to move the current RSC application code out of the temporary `product_rsc` directory and into feature-owned folders with explicit server and client boundaries.

Routing and rollout constraints are the baseline for the move, not the purpose of the plan. The move should not reorganize the entire JavaScript application or become a global Inertia migration.

The target is:

- Product application code lives under `components/Product`.
- Discover application code lives under `components/Discover`.
- Shared public-page compatibility code lives under `components/PublicPages`.
- RSC build and registration code lives in an entrypoint-oriented directory.
- Server components use domain names without an `Rsc` suffix.
- Interactive browser boundaries use behavior-oriented names and a `.client.tsx` suffix.
- Existing Inertia pages and specialized product surfaces remain in their current feature folders while they still have consumers.

## Current application state

This plan starts from the application as it exists now:

- Every eligible full HTML product document is rendered through the streamed product RSC root.
- Product rendering no longer depends on `?rsc=1`, `SHAKAPERF_NATIVE_PRODUCT_RSC`, or `SHAKAPERF_NATIVE_PUBLIC_RSC`.
- The product RSC root supports the default composition, `layout=profile`, and `layout=discover`.
- The former standard and profile full-page Inertia product components have already been removed.
- There is no `StandardProductLayout`. A product without an explicit layout uses the default composition. The only explicit product layout values are profile and Discover.
- The Discover product component remains because autocomplete still uses it as an Inertia partial response.
- Embed, overlay, JSON, preview, and custom-HTML product requests retain their specialized behavior.
- The public Discover RSC root is still selected by `NativePublicRscRequestConstraint`, including its query-parameter or environment-flag rollout behavior. The ordinary Inertia Discover page remains active.
- The public Profile RSC root and its compatibility behavior remain active and are not part of the Product and Discover server-rendering work.
- `app/javascript/product_rsc` currently mixes feature roots, an Inertia-compatible client shell, RSC entrypoints, and an asset-fingerprinting test.
- The current Product, Discover, and Profile RSC root modules are client components. Product and Discover will progressively become server-owned roots with focused client islands.

These are current facts. Do not add already-completed product cutover work to the migration sequence, and do not remove the remaining public Discover selectors or Inertia consumers as part of this folder move.

## Target component trees

### Selected public Discover page

```text
DiscoverPage                         Server root
├── PageShell.client                 Thin provider/compatibility boundary
└── DiscoverLayout                  Server composition
    ├── DiscoverHeader              Server-rendered static structure
    │   ├── logo                    Server
    │   ├── authentication links    Server
    │   ├── taxonomy links          Server
    │   ├── Search.client           Client island
    │   ├── Cart.client             Client island
    │   └── MobileMenu.client       Client island
    └── DiscoverResults.client      Interactive filtering and pagination
```

`DiscoverPage` should stop importing the complete legacy `pages/Discover/Index` composition before it is treated as a server root. The existing Inertia Discover page stays in place for ordinary Discover requests.

### Product page

```text
ProductPage                          Server root
├── PageShell.client                 Thin provider/compatibility boundary
├── default composition              No named StandardProductLayout
│   └── ProductInteractions.client
├── profile composition              Preserve current profile behavior
│   └── ProductInteractions.client
└── Discover composition
    └── DiscoverLayout               Shared server layout/header
        └── ProductInteractions.client
            ├── title                Server ReactNode
            ├── seller               Server ReactNode
            ├── ratings              Server ReactNode
            ├── summary              Server ReactNode
            ├── attributes           Server ReactNode
            └── variants, price,
                CTA, checkout,
                reviews, sharing,
                and media state      Client behavior
```

`ProductPage` owns the layout branch. `ProductContent` owns server-rendered title, seller, ratings, summary, and attributes. `ProductInteractions.client` owns purchasing and other browser behavior.

This plan preserves the current profile composition; it does not introduce a profile redesign or a third product layout abstraction.

## Recommended folders

```text
app/javascript/
├── components/
│   ├── PublicPages/
│   │   └── PageShell.client.tsx
│   ├── Discover/
│   │   ├── DiscoverPage.tsx
│   │   ├── DiscoverLayout.tsx
│   │   ├── DiscoverHeader.tsx
│   │   ├── DiscoverResults.client.tsx
│   │   ├── Search.client.tsx
│   │   ├── Cart.client.tsx
│   │   └── MobileMenu.client.tsx
│   ├── Product/
│   │   ├── ProductPage.tsx
│   │   ├── ProductContent.tsx
│   │   ├── ProductInteractions.client.tsx
│   │   └── existing product interaction modules...
│   └── Profile/
│       └── ProfileRscCompatibilityPage.client.tsx
└── entrypoints/
    └── public_rsc/
        ├── client.tsx
        ├── server.tsx
        └── asset_fingerprinting.test.ts
```

The exact entrypoint parent may follow an existing repository convention, but feature ownership is not optional: Product and Discover application code should not remain in a permanent application-level `Rsc` or `product_rsc` feature directory.

An `RSC` name remains appropriate for protocol and build infrastructure, for example:

```text
config/rspack/rsc.config.cjs
entrypoints/public_rsc/client.tsx
entrypoints/public_rsc/server.tsx
ssr-generated/rsc-bundle.js
/rsc_payload
RscImportGraphTest
```

Existing active files remain outside this target tree, including:

```text
app/javascript/pages/Discover/...
app/javascript/pages/Users/Show/...
app/javascript/pages/Products/Discover/Show.tsx
app/javascript/pages/Products/Iframe/Show.tsx
```

They are not destinations for new RSC application code and must not enter the RSC client import graph.

## Current-to-target file map

| Current file                               | Target                                                      | Notes                                                                                                                     |
| ------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `product_rsc/NativeProductRscPage.tsx`     | `components/Product/ProductPage.tsx`                        | Rename when the server root and client interaction boundary are separated.                                                |
| `product_rsc/NativeDiscoverRscPage.tsx`    | `components/Discover/DiscoverPage.tsx`                      | Rename when it no longer imports the complete Inertia Discover page.                                                      |
| `product_rsc/NativeProfileRscPage.tsx`     | `components/Profile/ProfileRscCompatibilityPage.client.tsx` | Behavior-free move only; Profile migration is outside this plan. Keeping the current name temporarily is also acceptable. |
| `product_rsc/NativePageRscShell.tsx`       | `components/PublicPages/PageShell.client.tsx`               | Keep the compatibility boundary thin and explicit.                                                                        |
| `product_rsc/client_entry.tsx`             | `entrypoints/public_rsc/client.tsx`                         | Registration/build infrastructure may retain `rsc` in its path.                                                           |
| `product_rsc/server_entry.tsx`             | `entrypoints/public_rsc/server.tsx`                         | Update server imports and registrations with the feature moves.                                                           |
| `product_rsc/asset_fingerprinting.test.ts` | `entrypoints/public_rsc/asset_fingerprinting.test.ts`       | Keep adjacent to the entrypoints it verifies unless the repository has a stronger test convention.                        |

This map is a destination guide, not a requirement to perform every rename at once. A temporary compatibility filename is preferable to a misleading domain name while a module still wraps a legacy page.

## Naming patterns

### Server roots

Use domain page names:

- `DiscoverPage`
- `ProductPage`

Avoid permanent names such as:

- `NativeDiscoverRscPage`
- `NativeProductRscPage`
- `DiscoverRscPage`
- `ProductServerPage`

Server components are the default inside this tree, so their names do not need `Server` or `Rsc`. An `Rsc` qualifier is tolerable at a temporary compatibility boundary when it prevents ambiguity; remove it when the component becomes the feature-owned server root.

### Server layouts and content

Name components after what they render:

- `DiscoverLayout`
- `DiscoverHeader`
- `ProductContent`
- `ProductTitle`
- `ProductSeller`
- `ProductRatings`
- `ProductSummary`
- `ProductAttributes`

Avoid:

- `DiscoverRscLayout`
- `ServerProductContent`
- `RscProductContent`
- `StandardProductLayout`

The default product composition does not need a layout component merely to give the absence of a layout parameter a name.

### Client boundaries

Use behavior-oriented names with `.client.tsx`:

- `Search.client.tsx`
- `Cart.client.tsx`
- `MobileMenu.client.tsx`
- `DiscoverResults.client.tsx`
- `ProductInteractions.client.tsx`
- `PageShell.client.tsx`

Each boundary begins with:

```tsx
"use client";
```

Only boundary modules need the directive and suffix. Their transitive client-only imports do not all need `.client.tsx`.

Prefer `ProductInteractions.client` to a broad name such as `ProductLayout.client` or `Interactive`. The name should describe the browser behavior it owns, not the page region it wraps.

### Compatibility and legacy names

Use `LegacyProduct` only while an active non-RSC consumer still requires that implementation. A legacy name is useful when it marks a real compatibility boundary; it is not a fallback that the RSC root may import.

Use an explicit compatibility name for the Profile wrapper if it is moved before Profile itself is migrated. Do not rename a client wrapper to `ProfilePage` if that implies a server-owned composition that does not yet exist.

## Server and client composition rules

The server root owns page composition and passes server-rendered content through `children` or named `ReactNode` props. Client components do not import Server Components directly.

For Product, the client contract should require server-owned display slots:

```tsx
type ProductInteractionsProps = {
  title: React.ReactNode;
  seller: React.ReactNode;
  ratings: React.ReactNode;
  summary: React.ReactNode;
  attributes: React.ReactNode;
  // Existing serializable purchasing and interaction props.
};
```

The server root composes those slots:

```tsx
export default function ProductPage({ product, content, ...interactionProps }: ProductPageProps) {
  return (
    <PageShell>
      <ProductInteractions
        {...interactionProps}
        title={<ProductTitle product={product} />}
        seller={<ProductSeller product={product} />}
        ratings={<ProductRatings product={product} />}
        summary={<ProductSummary content={content} />}
        attributes={<ProductAttributes product={product} />}
      />
    </PageShell>
  );
}
```

The actual root may place `ProductInteractions` inside the profile or Discover composition. The example intentionally shows the default composition without inventing `StandardProductLayout`.

Avoid a display fallback inside the RSC tree:

```tsx
serverContent ? serverContent.title : <LegacyProductTitle />;
```

The RSC server-content contract is mandatory. Active Inertia consumers may keep their own display implementation outside this graph.

This composition follows the [donut pattern](https://reactonrails.com/docs/migrating/rsc-component-patterns/): server-owned content can pass through a client boundary as React nodes without making the display implementation part of the browser bundle.

## Inertia compatibility boundary

`PageShell.client` may temporarily provide the narrow Inertia-compatible context required by existing interactive components. Keeping that provider does not make global Inertia removal part of this plan.

The shell should:

- Provide only the page props required by selected client interactions.
- Avoid resolving or importing Inertia page modules.
- Avoid importing legacy Product or Discover display compositions.
- Keep its compatibility object stable for server rendering and hydration.
- Document remaining `usePage` consumers beneath the RSC roots.
- Be measured as part of the RSC client bundle.

Dependencies can be removed gradually when their bundle cost or ownership justifies the work. The folder move must not require an application-wide Inertia rewrite.

## Registration and entrypoints

Continue using manual React on Rails registration. Do not enable auto-bundling as part of this move.

The client entrypoint registers roots by name only:

```tsx
import registerServerComponent from "react-on-rails-pro/registerServerComponent/client";

registerServerComponent("ProductPage");
registerServerComponent("DiscoverPage");
```

The server entrypoint registers actual references:

```tsx
import registerServerComponent from "react-on-rails-pro/registerServerComponent/server";

import DiscoverPage from "../../components/Discover/DiscoverPage";
import ProductPage from "../../components/Product/ProductPage";

registerServerComponent({ DiscoverPage, ProductPage });
```

Profile registration remains present under its current or explicit compatibility name. Rename Rails component references, client registration names, server registration keys, and tests together whenever a root name changes.

## Files and behavior intentionally outside this move

Do not delete or relocate these merely to make the target tree look complete:

- The ordinary Inertia Discover page and its active routes.
- The Discover autocomplete product partial.
- The existing public Profile page and compatibility root.
- Embed, overlay, bundle-preview, custom-HTML, and other specialized product surfaces.
- Dashboards, settings, internal pages, and unrelated JavaScript features.
- Remaining public Discover RSC request flags, query parameters, constraints, or fallback routes.
- Existing Rails mutations, authorization, pricing, eligibility, tax, and variant rules.

The standard and profile full-page Inertia product components are not on this list because they have already been removed. Likewise, the former product-specific RSC opt-in is not future cleanup; the product route already uses RSC for every eligible full document.

## Import-graph and registration tests

Tests should verify that:

- `ProductPage` does not import a legacy product display composition.
- `DiscoverPage` does not import `pages/Discover/Index` after the server root extraction is complete.
- `ProductInteractions.client` receives display content as server-owned React nodes and does not contain a legacy display fallback.
- Server components do not import browser-only modules.
- Client boundaries are explicit.
- Every registered root name is present in Rails, client, and server registration paths.
- The Profile compatibility root remains registered while it is active.
- The RSC browser bundle excludes the legacy Product and Discover display graphs.
- The RSC, SSR server, and browser bundles are still produced correctly after entrypoint moves.

Bundle measurement should record the cost of `PageShell.client` and retained Inertia-compatible dependencies. The goal is to avoid unnecessary Inertia code inside the RSC browser bundle, not to remove Inertia globally.

## Reviewable move sequence

1. Inventory imports beneath each `product_rsc` root and record every remaining legacy page or `usePage` dependency.
2. Split server-owned display content from browser interactions in place. Introduce `ProductContent` and `ProductInteractions.client` without changing product behavior.
3. Extract the static Discover header and layout as `DiscoverHeader` and `DiscoverLayout`, with search, cart, menu, and results as focused client boundaries.
4. Rename and move the product root to `components/Product/ProductPage.tsx`; preserve the default, profile, and Discover branches exactly.
5. Rename and move the Discover root to `components/Discover/DiscoverPage.tsx` once it no longer imports the full Inertia Discover page.
6. Move the shared shell to `components/PublicPages/PageShell.client.tsx`, keeping required Inertia compatibility narrow and measured.
7. Move client and server registration files to `entrypoints/public_rsc`, then update registration names, Rails references, build configuration, and tests together.
8. Either leave the Profile wrapper under its temporary name or move it behavior-free to an explicitly named Profile compatibility module. Do not fold Profile migration into this work.
9. Delete the empty `product_rsc` application directory only after all active roots, entrypoints, and tests have valid destinations.
10. Run import-graph, registration, type, bundle, and behavior checks after each reviewable move.

This sequence does not include routing cutover, product flag removal, or deletion of standard/profile Inertia product pages because those changes are already complete. It also does not include removal of the remaining Discover rollout selector or Inertia fallback.

## Final rule

Organize public RSC application code by feature and behavior, not by rendering technology. Product belongs to Product, Discover belongs to Discover, shared provider compatibility belongs to PublicPages, and only registration/build infrastructure should retain `rsc` in its permanent path or name.
