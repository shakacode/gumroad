#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const article = resolve(here, "../..");
const addToCart = process.argv.includes("--add-to-cart");
const inertiaSsr = process.argv.includes("--inertia-ssr");
assert.ok(!(addToCart && inertiaSsr), "Select one replay scenario");
const basename = `product-profile-phone${addToCart ? "-add-to-cart" : ""}-replay`;
const title = inertiaSsr
  ? "Product page loading: Inertia SSR vs React Server Components"
  : addToCart
    ? "Add to cart: Inertia vs React Server Components"
    : "Product page loading: Inertia vs React Server Components";
let capture;
if (inertiaSsr) {
  const saved = join(here, "inertia-ssr-capture.json");
  const sourceReplay = process.argv[process.argv.indexOf("--inertia-ssr") + 1];
  if (sourceReplay) {
    const html = await readFile(resolve(sourceReplay), "utf8");
    const embedded = html.match(/<script id="capture-data" type="application\/json">([^<]+)<\/script>/u);
    assert.ok(embedded, "Historical replay must contain recorded frames");
    const original = JSON.parse(embedded[1]);
    assert.equal(original.source, "compare-results-ssrv2-parity-slow-throttle-20260904");
    capture = {
      metadata: {
        durationMs: original.durationMs,
        scenario: original.scenario,
        source: original.source,
        caseId: original.caseId,
        throttling: original.throttling,
        sourceReplaySha256: createHash("sha256").update(html).digest("hex"),
        sources: original.sources,
      },
      sides: Object.fromEntries(
        Object.entries(original.sides).map(([side, data]) => [
          side,
          {
            fcpMs: data.fcpMs,
            lcpMs: data.lcpMs,
            frames: data.frames,
          },
        ]),
      ),
    };
    await writeFile(saved, `${JSON.stringify(capture)}\n`);
  } else {
    capture = JSON.parse(await readFile(saved, "utf8"));
  }
} else {
  const html = await readFile(join(article, `${basename}.html`), "utf8");
  const embedded = html.match(/<script id="capture-data" type="application\/json">([^<]+)<\/script>/u);
  assert.ok(embedded, "Replay must contain recorded frames");
  capture = JSON.parse(embedded[1]);
}
const { metadata, sides } = capture;
const inertiaLabel = inertiaSsr ? "Inertia SSR" : "Inertia";
const output = join(
  article,
  inertiaSsr ? "images/historical/inertia-ssr-product-phone-replay.gif" : `images/${basename}.gif`,
);
const temporary = await mkdtemp(join(tmpdir(), "gumroad-replay-gif-"));
const speed = 3;
const intervalMs = 200;
const height = inertiaSsr ? 760 : 810;
function run(command, args, input) {
  const result = spawnSync(command, args, { input, maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr?.toString() || `${command} failed`);
  return result.stdout;
}
function frameAt(frames, time) {
  let selected = frames[0];
  for (const frame of frames) {
    if (frame.timeMs > time) break;
    selected = frame;
  }
  return selected.image;
}

try {
  const animation = [];
  for (let time = 0, index = 0; time <= metadata.durationMs; time += intervalMs, index++) {
    const frame = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" font-family="Arial,Helvetica,sans-serif">
      <rect width="800" height="${height}" fill="#101820"/>
      <text x="24" y="34" font-size="20" fill="#f3f7f9" font-weight="700">${title}</text>
      <text x="24" y="62" font-size="16" fill="#b9c8d2">${inertiaSsr ? "Discover layout · historical mobile sample" : addToCart ? "Product → add to cart → checkout" : "Mobile – First Visit Sample"} · 3× playback</text>
      <text x="776" y="62" text-anchor="end" font-size="16" fill="#f3f7f9">${(time / 1000).toFixed(2)} s</text>
      ${
        inertiaSsr
          ? ""
          : addToCart
            ? `<text x="24" y="90" font-size="17" fill="#f3f7f9">Add-to-cart interaction confirmed at:</text>
      <text x="24" y="116" font-size="17" fill="#f3f7f9"><tspan font-weight="700" fill="#80b9ff">${(sides.control.addToCartClickMs / 1000).toFixed(2)} s with Inertia</tspan>; <tspan font-weight="700" fill="#77dba5">${(sides.experiment.addToCartClickMs / 1000).toFixed(2)} s with React on Rails Pro</tspan>.</text>`
            : `<text x="24" y="90" font-size="17" fill="#f3f7f9">FCP (First Contentful Paint) in this sample:</text>
      <text x="24" y="116" font-size="17" fill="#f3f7f9"><tspan font-weight="700" fill="#80b9ff">${(sides.control.fcpMs / 1000).toFixed(2)} s with ${inertiaLabel}</tspan>; <tspan font-weight="700" fill="#77dba5">${(sides.experiment.fcpMs / 1000).toFixed(2)} s with React on Rails Pro</tspan>.</text>`
      }
      <g transform="translate(0,${inertiaSsr ? 0 : 50})">
      <rect x="16" y="82" width="376" height="648" rx="16" fill="#1d2b35"/>
      <rect x="408" y="82" width="376" height="648" rx="16" fill="#1d2b35"/>
      <text x="32" y="116" font-size="20" fill="#80b9ff" font-weight="700">${inertiaLabel}</text>
      <text x="424" y="116" font-size="20" fill="#77dba5" font-weight="700">React on Rails Pro / RSC</text>
      <image href="${frameAt(sides.control.frames, time)}" x="32" y="136" width="344" height="578" preserveAspectRatio="xMidYMid meet"/>
      <image href="${frameAt(sides.experiment.frames, time)}" x="424" y="136" width="344" height="578" preserveAspectRatio="xMidYMid meet"/>
      ${
        addToCart
          ? ""
          : `<text x="24" y="752" font-size="13" fill="#b9c8d2">${inertiaSsr ? "September 4 SSR capture · elapsed time since navigation · one recorded load" : "September 23 capture · elapsed time since navigation · one throttled sample run, not a benchmark median"}</text>`
      }
      </g>
    </svg>`;
    const path = join(temporary, `${String(index).padStart(3, "0")}.png`);
    await writeFile(path, run("rsvg-convert", [], frame));
    // Distribute centisecond rounding so the complete load still plays at 3×.
    const delay =
      time === metadata.durationMs
        ? 150
        : Math.round(((index + 1) * intervalMs) / speed / 10) - Math.round((index * intervalMs) / speed / 10);
    animation.push("-delay", String(delay), path);
  }
  run("magick", [...animation, "+dither", "-colors", "256", "-loop", "0", "-layers", "Optimize", output]);
  process.stdout.write(`Generated ${output} at ${speed}× playback\n`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
