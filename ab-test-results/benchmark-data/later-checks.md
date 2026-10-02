# Later Product RSC checks

These checks compare two RORP Product implementations. They do not compare the
final stack with Inertia. ShakaPerf ran on isolated local servers. The saved
case directories can be overwritten by a later run, so this branch keeps the
report summaries used below.

| Check                 | UTC run ID                 | Control                             | Experiment                          | Cold phone result                                                                                                         |
| --------------------- | -------------------------- | ----------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Image preload owner   | `2026-09-23T11:17:22.608Z` | Rails image hints at `50bcdb04f870` | React image hints at `6b32136ed4a0` | 22 pairs; LCP estimate −55 ms (95% CI −96 to −10 ms, p=0.014); 2.2 KB more total transfer                                 |
| Product build cleanup | `2026-09-23T14:18:20.077Z` | Before cleanup at `77356d7b9ef5`    | After cleanup at `f9c97982a8f3`     | 24 pairs; Speed Index estimate −258 ms (95% CI −408 to −211 ms); 90.7 KB less total transfer and 118.3 KB less before LCP |

The [preload report](preload-react-vs-rails-report.json) has SHA-256
`e927983b7a063a4306d88ef4787ae190dc6c09002991616b11b481da278138c6`.
The [cleanup report](product-profile-cleanup-report.json) has SHA-256
`4d234ba93dc97519753adb9cec5d300615c7355dec0c972d5bdecd3cc19ce827`.
These hashes match the local source summaries at article preparation.

The preload run favored React on cold phone LCP. Other runs had large stalls,
and Desktop and warm paint changes were unclear. The cleanup run had a
consistent Speed Index and transfer reduction. Its phone LCP estimate was
only −30 ms. Neither run isolates all changes in the final branch, and neither
supports a final Inertia-versus-RORP performance estimate.
