# Profile product RORP benchmark evidence

This directory records the isolated evaluations used to assemble
`ramez/rorp/product-page`. Every runnable comparison uses the existing
`Product Page - Profile layout` scenarios, with the seller-scoped
`product_page_react_on_rails` feature enabled in both isolated Redis databases.

## Source inventory

The product implementation was reconstructed from the logical commits on
`ramez/cpln/rorp-baseline`:

| Commit | Change | Treatment |
| --- | --- | --- |
| `a8001d0f42` | React 19 and RSC dependencies | Required runtime group |
| `4694dcdda6` | RSC assets and Control Plane runtime | Required runtime group |
| `7b7c97ae4c` | Streaming core | Required runtime group; streaming preservation evaluated separately |
| `d332f334d8` | Product data contract | Required product group |
| `12762257af` | Description and review boundaries | Required product group |
| `d720f07731` | Product state and pricing boundaries | Required product group |
| `ea049c8a54` | Purchase-control boundaries | Required product group |
| `d4a99b8a81` | Product media and dialog boundaries | Required product group |
| `36180fa7f0` | Product visual shell | Required product group |
| `a7030201c2` | Product RSC composition | Required product group |
| `f2e414a690` | Shared RSC loading plumbing | Required runtime group |
| `70cd1df2c1` | Profile rich-text primitives | Required by the profile-layout shell |
| `0989a8d1c4` | Profile section composition | Required by the profile-layout shell |
| `89fd3c318d` | Profile shell | Required by the profile-layout product page |
| `9cfb0ca153` | Seller-profile cutover | Excluded |
| `ced9cee663` through `235d9bf8e4` | Discover implementation | Excluded |
| `6e9b058fde` | Combined Product/Discover cutover | Reimplemented as a product-only, feature-gated cutover |
| `d901c205f7` | Deferred call calendar | Evaluated separately |
| `c3ccc2090d` | Prior benchmark artifacts | Excluded |

The required product and runtime commits are the smallest inseparable group:
removing an individual boundary removes behavior or prevents the RORP page from
rendering, so an adjacent-commit performance comparison would not compare two
equivalent RORP pages. Their performance is evaluated as a group in the final
Inertia-versus-RORP comparison.

Additional product-affecting React work inspected outside that logical stack:

| Commit | Change | Treatment |
| --- | --- | --- |
| `1e1d39ed6` | Async generated RSC packs | Evaluated separately |
| `d31e3c777` | Flight-driven client chunks | Bundled RSC dependency behavior; grouped with the required runtime |
| `43becdbfc` | Deferred call calendar | Evaluated separately |
| `f00c0ae68` | Split RSC client chunks | Bundled RSC dependency behavior; grouped with the required runtime |
| `829d9b641` | Preserve streaming responses | Evaluated separately |
| `a43862ea7` | React-owned product image preloads | Evaluated separately |
| `bec0ca892` / `0ad14a83a` | Prioritize active covers and its revert | Evaluated as a dropped candidate |
| `80e3a9301` | Complete React 19 migration | Required compatibility group; unrelated application-wide edits excluded |

## Common commands

```bash
bin/refresh-shakaperf-twins
shaka-perf compare --filter "Product Page - Profile layout"
```

The filter also selects the existing sticky-add-to-cart scenario because its
name shares the prefix. No scenario readiness check, geometry stabilization,
viewport, or checkout interception was changed.
