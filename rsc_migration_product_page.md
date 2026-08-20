# Product RSC minimal-change plan

## Target split

`[S]` = Server Component. `[C]` = focused Client Component.

```text
ProductPage [S]
├─ Header [S]
│  ├─ logo, auth links, categories [S]
│  └─ search autocomplete [C]
├─ ProductStateProvider [C; passes server children]
│  ├─ Sticky CTA [C]
│  └─ ProductArticle [S]
│     ├─ analytics [C; renders null]
│     ├─ media gallery [C]
│     ├─ title, seller, ratings, notices [S]
│     ├─ live price and purchase controls [C]
│     ├─ description HTML [S] + collapse/files [C]
│     ├─ receipt [S] + copy/review actions [C]
│     ├─ bundle text [S] + live prices [C]
│     ├─ wishlist/share/refund/reviews/dialogs [C]
│     └─ seller reputation [S]
└─ ProfileSections [S]
   ├─ section frames, posts, rich text [S]
   └─ products, subscribe, wishlist, coffee [C]
```

Client providers may receive server-composed children; they must not import server components.

## Biggest wins for the least code

| Rank | Change                                                                              | Typical scope                                        | Main win                                                        |
| ---: | ----------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
|    1 | Add an exact RSC import-graph test.                                                 | Tests only                                           | Prevents Inertia and client/server leaks.                       |
|    2 | Render title, seller, ratings, summary, and attributes on the server.               | Rails projector + one server component + root wiring | Meaningful raw HTML and FCP.                                    |
|    3 | Make the header shell server-owned; keep autocomplete as its existing client child. | One server shell + one slot                          | Streams the largest visible shared UI without rewriting search. |
|    4 | Move analytics effects into a seven-prop null client island.                        | One client file + one call site                      | Removes effects and browser imports from the article.           |
|    5 | Move notices, seller reputation, posts, and rich text to server leaves.             | Small presentation components                        | More server HTML with little behavior risk.                     |

## Smallest recommended branch

1. **Guard:** exact server/client/import allowlists; no production change.
2. **Static content:** server-render product identity/details.
3. **Header shell:** server-render logo, links, categories, and search form; retain autocomplete client behavior.
4. **Analytics:** extract the existing lifecycle unchanged.

Stop there for a small review. Do not combine it with mutation or navigation work.

## Keep client-side

- selection, recurrence, rental, quantity, discounts, and live pricing;
- carousel/video, CTA/cart/checkout, modals, and browser history;
- autocomplete, wishlist/follow/subscribe/review mutations;
- analytics effects.

## Avoid in the quick branch

- authenticated mutation/CSRF changes;
- checkout or navigation rewrites;
- profile products filtering/pagination;
- replacing the page with one large `"use client"` component;
- claiming bundle savings without inspecting emitted client chunks.

## Minimal proof

```sh
git diff --check
npm run test -- <changed-component-tests>
bin/rails test test/config/react_on_rails_rsc_configuration_test.rb
npm run typecheck
npm run build:product-rsc:test
bin/rspec spec/requests/products/show/product_rsc_initial_response_spec.rb
```

Raw-response coverage must prove meaningful header and product HTML. Hydration coverage must prove zero recoverable errors, one rendering, and no initial follow-up Flight request.
