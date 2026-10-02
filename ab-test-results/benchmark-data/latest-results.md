# Profile-layout Product page: latest comparison

Run: `2026-09-23T18:01:58.195Z`. Control: Inertia baseline. Experiment: React on Rails Pro with React 19 Server Components.
Only cold and warm landings are included. Sticky add-to-cart is excluded. Each cell has 20 measurements per side.

| Navigation | Viewport | Metric | Inertia median | RORP median | Paired estimate (95% CI) | Paired percent (95% CI) |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Empty cache | Desktop | FCP | 9.53 s | 1.16 s | -8372ms (-8401ms to -8343ms) | -87.8% (-88.2% to -87.5%) |
| Empty cache | Desktop | LCP | 9.53 s | 2.05 s | -7489ms (-7522ms to -7448ms) | -78.6% (-78.9% to -78.2%) |
| Empty cache | Desktop | Speed Index | 9.55 s | 1.67 s | -7896ms (-7928ms to -7861ms) | -82.7% (-83.0% to -82.3%) |
| Empty cache | Mobile | FCP | 9.54 s | 1.16 s | -8381ms (-8404ms to -8351ms) | -87.8% (-88.1% to -87.5%) |
| Empty cache | Mobile | LCP | 9.54 s | 2.07 s | -7489ms (-7522ms to -7464ms) | -78.5% (-78.8% to -78.2%) |
| Empty cache | Mobile | Speed Index | 9.61 s | 2.67 s | -6948ms (-6970ms to -6923ms) | -72.3% (-72.5% to -72.1%) |
| Prepopulated cache | Desktop | FCP | 715 ms | 334 ms | -376ms (-384ms to -366ms) | -52.6% (-53.7% to -51.1%) |
| Prepopulated cache | Desktop | LCP | 715 ms | 334 ms | -376ms (-384ms to -366ms) | -52.6% (-53.7% to -51.1%) |
| Prepopulated cache | Desktop | Speed Index | 717 ms | 342 ms | -371ms (-379ms to -360ms) | -51.7% (-52.9% to -50.2%) |
| Prepopulated cache | Mobile | FCP | 708 ms | 326 ms | -380ms (-390ms to -372ms) | -53.7% (-55.0% to -52.5%) |
| Prepopulated cache | Mobile | LCP | 708 ms | 326 ms | -380ms (-387ms to -372ms) | -53.6% (-54.6% to -52.5%) |
| Prepopulated cache | Mobile | Speed Index | 752 ms | 421 ms | -325ms (-334ms to -316ms) | -43.2% (-44.4% to -42.0%) |

## Trade-offs

| Navigation | Viewport | Metric | Inertia median | RORP median | Paired estimate (95% CI) |
| --- | --- | --- | ---: | ---: | ---: |
| Empty cache | Desktop | Total Blocking Time | 11 ms | 119 ms | 109ms (107ms to 111ms) |
| Empty cache | Desktop | Browser-observed TTFB | 131 ms | 156 ms | 28ms (20ms to 32ms) |
| Empty cache | Desktop | Transferred data | 2597.9 KB | 2722.8 KB | 124.5KB (124.4KB to 124.9KB) |
| Empty cache | Desktop | Network requests | 143 | 96 | -47 (-47 to -47) |
| Empty cache | Mobile | Total Blocking Time | 12 ms | 121 ms | 110ms (106ms to 115ms) |
| Empty cache | Mobile | Browser-observed TTFB | 129 ms | 162 ms | 25ms (19ms to 35ms) |
| Empty cache | Mobile | Transferred data | 2597.9 KB | 2722.0 KB | 124.4KB (124KB to 124.5KB) |
| Empty cache | Mobile | Network requests | 143 | 96 | -47 (-47 to -47) |
| Prepopulated cache | Desktop | Total Blocking Time | 0 ms | 50 ms | 46ms (41ms to 51ms) |
| Prepopulated cache | Desktop | Browser-observed TTFB | 117 ms | 139 ms | 20ms (17ms to 24ms) |
| Prepopulated cache | Desktop | Transferred data | 196.4 KB | 36.4 KB | -160KB (-160KB to -160KB) |
| Prepopulated cache | Desktop | Network requests | 142 | 95 | -47 (-47 to -47) |
| Prepopulated cache | Mobile | Total Blocking Time | 0 ms | 42 ms | 41ms (36ms to 46ms) |
| Prepopulated cache | Mobile | Browser-observed TTFB | 101 ms | 125 ms | 23ms (18ms to 46ms) |
| Prepopulated cache | Mobile | Transferred data | 196.4 KB | 36.5 KB | -160KB (-160KB to -160KB) |
| Prepopulated cache | Mobile | Network requests | 142 | 95 | -47 (-47 to -47) |

Cold visual checks: Desktop and Mobile, 0 differing pixels. Warm visual checks were not captured.
Cold accessibility checks: no new or fixed findings; 20 findings changed on each viewport (19 critical, 1 serious). Warm accessibility checks were not captured.

The report does not include time-aligned memory or swap telemetry, so it cannot prove that the host was free of memory pressure.

Source hashes and user agents: [latest-results.json](latest-results.json).
