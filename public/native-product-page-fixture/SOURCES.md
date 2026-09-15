# Native product-page fixture sources

These files are stable snapshots of the WebP representations delivered by the
public Gumroad storefronts. They were captured on 2026-08-31 with
`Accept: image/webp`, then verified as HTTP 200, `Content-Type: image/webp`,
valid WebP bytes, and the dimensions below. Cloudflare reported
`cf-polished: ok` for every response; these direct asset URLs do not emit a
`Cf-Resized` header.

The committed files keep local and ShakaPerf runs deterministic. Seeds upload
them through Active Storage; they never fetch these URLs at runtime.

## Office 365 for IT Pros

| Local file | Public product page | Public image URL | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | ---: | ---: | --- |
| `microsoft-365.webp` | `https://o365itpros.gumroad.com/l/O365IT` | `https://public-files.gumroad.com/pk6anh25k666db2y79ejlo89x5a1` | 1000×1414 | 127254 | `7d0743bc3379eebddcf08858f08af8303bfff68290c03825ed2a0e008ec0d4f8` |
| `microsoft-365-thumbnail.webp` | `https://o365itpros.gumroad.com/l/O365IT` | `https://public-files.gumroad.com/qm9p3ozhoam1gs9oj3uqylspbnb1` | 600×600 | 48216 | `3cc2cb097f64d1708cc1d7c4f549963b6d9037e044b217612f088531b6ddec48` |
| `powershell.webp` | `https://o365itpros.gumroad.com/l/M365PS` | `https://public-files.gumroad.com/rycp26t6eh6odvqcj0t5cvmsgwh6` | 1005×1421 | 72914 | `1a468293fa55307887d91ffdb79e60b0a896b72ab901192258f1c1b6a0334014` |
| `powershell-thumbnail.webp` | `https://o365itpros.gumroad.com/l/M365PS` | `https://public-files.gumroad.com/p4hityghs8xm27lf5b4at0bzrilg` | 600×600 | 29678 | `86c77ec52356f1ca982cb45f7e58aa7c2aff4cc1664615b3b3f4ae7eb18baef6` |
| `purview.webp` | `https://o365itpros.gumroad.com/l/M365Purview` | `https://public-files.gumroad.com/ixmwqzcs6t0tfphdpkywz6kcxiuw` | 1005×1421 | 135656 | `1a8a9c8f523778e9b4417843a31bcbec64d9abb00be724fe199b84b1e2d89c8d` |
| `purview-thumbnail.webp` | `https://o365itpros.gumroad.com/l/M365Purview` | `https://public-files.gumroad.com/wxr1fcto11mt8q8mbnr4lml6bym5` | 600×600 | 55828 | `b334d6d9fec1c74b06cd3c6d1f7c765924f161581d58f072247e185329f662b5` |
| `power-platform.webp` | `https://o365itpros.gumroad.com/l/PowerPlatform` | `https://public-files.gumroad.com/5n2p7k54ijjnf1yqsoyuyjg2skep` | 1005×1421 | 90126 | `03e17ccaca0d58803a9c8339c633c9cd59e92d347c831b80387f312bba7597d6` |
| `power-platform-thumbnail.webp` | `https://o365itpros.gumroad.com/l/PowerPlatform` | `https://public-files.gumroad.com/sz28bdqlra7lqnuyh2kigcjexr1b` | 600×600 | 38762 | `dd34f4790224f651de84b08d4e869afde690ae9c12270edb0539cfba6c70ab81` |

`M365Core` was unavailable at capture time, so its synthetic benchmark product
reuses the Microsoft 365 cover and thumbnail.

## Graphic Guide to Residential Design

All files below came from `https://luisfurushio.gumroad.com/l/bgfjk`.

| Local file | Public image URL | Dimensions | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `residential-guide-thumbnail.webp` | `https://public-files.gumroad.com/bm295hatkim3zvxbrmr3tdsa2k5a` | 600×600 | 30062 | `f0c0e1d995090e31a40a72676e194e2de2b656bb9d0f55ab6c9f195bcbf0f37a` |
| `luis-furushio-profile.webp` | `https://public-files.gumroad.com/yqyhfprzp6fiwzc3tbweriuyabba` | 400×400 | 18122 | `b2f42b911f5d994e022dab455f2c893dd0478765d00981f86986546af22aaf92` |
| `residential-guide-preview-1.webp` | `https://public-files.gumroad.com/m27ruvci51g88mg30ks5ick3gqt8` | 1005×770 | 61518 | `f080166df7ef4cfafd00c95b6f99a642f805af212d8429bf9bd2316c2623f6c8` |
| `residential-guide-preview-2.webp` | `https://public-files.gumroad.com/jzverpm8c8adfjh8mfx58w48bbkv` | 1005×770 | 103408 | `062c016176b326dfb97ddc159c0b7c8f2c8fdac7b23171cbe9722c35e3763591` |
| `residential-guide-preview-3.webp` | `https://public-files.gumroad.com/38qv8foofqp67wfazgk6cz8dv3pj` | 1005×770 | 94502 | `9049959ceee560c4178f7921f65512832b307ccd53841d8b49ebe6971172dd37` |
| `residential-guide-preview-4.webp` | `https://public-files.gumroad.com/xpeuqaupw7vj2n5nj23l1sfte8cd` | 1005×770 | 110620 | `230ce725294f51cc31c374e0b9c048f60475841fe08e9c9d18f5b3eb31161760` |
| `residential-guide-preview-5.webp` | `https://public-files.gumroad.com/0j36tvyma858v4gi4jy5zzueccv4` | 1005×770 | 68260 | `156fd9baa481b2931d716dbb58f12c615a90a3c452be093e3380d16a5217e145` |
| `residential-guide-detail-1.webp` | `https://public-files.gumroad.com/yj9sdvggratyipaalu9t4x3aejwd` | 1042×492 | 77216 | `2673b35a2169db9163173411bc83f2bacf93af64c661b1715a7374b8047a65fa` |
| `residential-guide-detail-2.webp` | `https://public-files.gumroad.com/d0vvn15xvd77vqnr9rmrzblyxylj` | 1042×567 | 72460 | `bd61594961be40206d242dbc247723beb223be897f3b57459b024a5043e0e325` |
| `residential-guide-detail-3.webp` | `https://public-files.gumroad.com/6z3a435wal9cy86qex91t5wjpef0` | 2083×930 | 122002 | `1f9f22a078b601c614ad34e06cf89497e296309018867691a2e3944809018744` |
| `residential-guide-detail-4.webp` | `https://public-files.gumroad.com/645x2vyx2tasj05i57w6gdlgyuna` | 4167×1881 | 249018 | `ab5db3328a7db97301e0db6b200593603b037848f1b3090110deda65f03c2102` |
| `residential-guide-detail-5.webp` | `https://public-files.gumroad.com/ahuxu69vfcjnlxnprcwzcfsdo34l` | 1042×708 | 79026 | `fe946fa35071e3bae9b5d20cda3892d27c20490e1c39544fa475078fde92b190` |
| `residential-guide-detail-6.webp` | `https://public-files.gumroad.com/aq8uxtg1lagsh5o9zvrnaqznhc2i` | 1042×483 | 56154 | `9e97df415874e60ac14c3c8d603ab35c6f192ca4af2b46e7be3f878d99890d49` |

Seller and product metadata mirrors the public pages. Fixture emails, buyer
identities, purchases, and written review messages are synthetic and use
reserved `example.com` addresses.
