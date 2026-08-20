Assuming every public Product and Discover route uses the new streamed RSC implementation—and no embeds, profile sections, bundle previews, or internal pages still require the old composition—the legacy compatibility layer should be removed entirely.

## Recommended component tree

### Discover page

```text
DiscoverPage                         Server root
├── PageShell.client                 Client providers; accepts server children
└── DiscoverLayout                  Server layout/header
    ├── logo and authentication     Server
    ├── taxonomy navigation         Server
    ├── Search.client               Client island
    ├── Cart.client                 Client island
    ├── MobileMenu.client           Client island
    └── DiscoverResults.client      Client only where filtering requires it
```

### Product page

```text
ProductPage                          Server root
├── PageShell.client                 Client providers; accepts server children
└── DiscoverLayout                  Server header
    └── ProductInteractions.client  Client purchasing shell
        ├── ProductContent          Server nodes passed as props
        │   ├── title
        │   ├── seller
        │   ├── ratings
        │   ├── summary
        │   └── attributes
        └── price, variants, CTA,
            checkout, reviews and sharing
```

The Server Component root owns the complete composition. Client components receive server-rendered content through `children` or named `ReactNode` props. They never import Server Components directly. This follows the documented [donut pattern](https://reactonrails.com/docs/migrating/rsc-component-patterns/).

## Recommended folders

```text
app/javascript/
├── components/
│   ├── Discover/
│   │   ├── DiscoverPage.tsx
│   │   ├── DiscoverLayout.tsx
│   │   ├── DiscoverResults.client.tsx
│   │   ├── Search.client.tsx
│   │   ├── Cart.client.tsx
│   │   └── MobileMenu.client.tsx
│   │
│   ├── Product/
│   │   ├── ProductPage.tsx
│   │   ├── ProductContent.tsx
│   │   ├── ProductInteractions.client.tsx
│   │   ├── ProductPageLayout.tsx
│   │   ├── ConfigurationSelector.tsx
│   │   ├── PriceTag.tsx
│   │   └── CtaButton.tsx
│   │
│   └── PublicPages/
│       ├── PageShell.client.tsx
│       └── buildPage.ts
│
└── packs/
    ├── client/
    │   ├── DiscoverPage.tsx
    │   └── ProductPage.tsx
    └── server-bundle.tsx
```

There should be no application-level `Rsc/` or `product_rsc/` folder. Application code belongs to its feature.

A centralized `RSC` name remains appropriate only for protocol and build infrastructure:

```text
config/rspack/rsc.config.cjs
ssr-generated/rsc-bundle.js
/rsc_payload
RscImportGraphTest
```

## Naming patterns

### Server roots

Use domain page names:

- `DiscoverPage`
- `ProductPage`

Avoid:

- `NativeDiscoverRscPage`
- `NativeProductRscPage`
- `DiscoverRscPage`
- `ProductServerPage`

Server Components are the default, so their names do not need `Server` or `Rsc`.

### Server layouts and content

Use what they render:

- `DiscoverLayout`
- `ProductContent`
- `ProductPageLayout`
- `SellerAndRatings`
- `ProductAttributes`

Avoid:

- `DiscoverRscLayout`
- `ServerProductContent`
- `RscProductContent`

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

Only boundary modules need the directive and suffix. Their transitive imports do not all need `.client.tsx`.

### Remove temporary names

If there are genuinely no remaining consumers, delete:

- `LegacyProduct.tsx`
- `Interactive.tsx`
- old client-only Discover layout
- RSC proxy modules that only re-export another component
- `Native*` page components
- `product_rsc` application directory

`Interactive.tsx` should not simply be preserved under that vague name. Its remaining interactive behavior should become `ProductInteractions.client.tsx`.

## Product composition

The product client component should require server content rather than contain a fallback:

```tsx
type ProductInteractionsProps = {
  title: React.ReactNode;
  sellerAndRatings: React.ReactNode;
  details: React.ReactNode;
  // Interactive product props...
};
```

Then the server root composes it:

```tsx
export default function ProductPage({ product, content, ...props }: Props) {
  return (
    <PageShell>
      <DiscoverLayout>
        <ProductInteractions
          {...props}
          title={<ProductTitle content={content} />}
          sellerAndRatings={<ProductSellerAndRatings content={content} />}
          details={<ProductDetails content={content} />}
        />
      </DiscoverLayout>
    </PageShell>
  );
}
```

There should be no conditional fallback such as:

```tsx
serverContent ? serverContent.title : <LegacyProductTitle />
```

If every route is migrated, server content is mandatory.

## Header composition

`DiscoverLayout` should own all static header markup. It should not wrap or proxy the old client Discover layout.

Only these behaviors need client islands:

- Autocomplete and search input state
- Cart state
- Mobile-menu open/close state

Logo, taxonomy links, authentication links, breadcrumbs, and structural markup remain server-rendered.

## Registration

Each client pack registers its root by name only:

```tsx
import registerServerComponent from "react-on-rails-pro/registerServerComponent/client";

registerServerComponent("ProductPage");
```

The server bundle registers actual references:

```tsx
import registerServerComponent from "react-on-rails-pro/registerServerComponent/server";

import DiscoverPage from "../components/Discover/DiscoverPage";
import ProductPage from "../components/Product/ProductPage";

registerServerComponent({
  DiscoverPage,
  ProductPage,
});
```

This matches the manual registration pattern in the [RSC migration guide](https://reactonrails.com/docs/migrating/rsc-component-patterns/).

## Rails cleanup

If there is no fallback traffic, routes no longer need to select between RSC and Inertia using `?rsc=1` or environment flags.

Conceptually:

```text
/discover       → streamed DiscoverPage
/l/:id          → streamed ProductPage
```

The temporary request constraints and duplicate fallback routes can be removed after rollout is complete.

Rails continues to:

- Load and authorize data.
- Build serializable props.
- Use `stream_react_component`.
- Render through `stream_view_containing_react_components`.

Do not introduce `RSCRoute`; these are top-level roots rendered by Rails. The [inside-client-components guide](https://reactonrails.com/docs/pro/react-server-components/inside-client-components/) recommends direct `registerServerComponent` registration in this situation.

## Tests to retain

Import-graph tests should verify that:

- `ProductPage` does not import the removed legacy product composition.
- `DiscoverPage` does not import the old client Discover layout.
- Server components do not import browser-only modules.
- Client boundaries are explicit.
- Every registered root is present in both registration paths.
- The RSC, SSR server, and browser bundles are produced correctly.

## Reviewable cleanup sequence

1. Route all Product and Discover traffic through streamed roots.
2. Verify there are no remaining component consumers of the legacy product composition.
3. Remove legacy Product and Discover pages.
4. Make server-content props mandatory.
5. Delete `LegacyProduct.tsx` and fallback branches.
6. Collapse proxy modules into real `.client.tsx` boundaries.
7. Rename roots, layouts, and islands by domain responsibility.
8. Relocate files by feature in a behavior-free commit.
9. Remove temporary RSC flags and route constraints.
10. Retain bundle and import-graph tests.

The final rule is simple: **folders express feature ownership, component names express UI responsibility, and only boundary filenames expose client execution.**
