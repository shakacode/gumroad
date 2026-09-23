#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Product-only revision of the earlier article's replay builder. The replay
// is a diagnostic load, never a replacement for the 18-pair performance result.
const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../..");
const source = resolve(process.argv[2] ?? join(repo, "compare-results"));
const output = resolve(process.argv[3] ?? join(repo, "ab-test-results/product-profile-phone-replay.html"));
const caseId = "product-page-profile-layout-cold-landing-phone-031456e8";
const caseDir = join(source, caseId);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sourceHashes = [];
async function input(name) {
  const bytes = await readFile(join(caseDir, name));
  sourceHashes.push({ path: `${caseId}/${name}`, sha256: sha256(bytes) });
  return bytes.toString("utf8");
}
function lighthouseJson(html) {
  const marker = "window.__LIGHTHOUSE_JSON__ = ";
  const start = html.indexOf(marker);
  const end = html.indexOf("</script>", start);
  assert.ok(start >= 0 && end > start);
  return JSON.parse(html.slice(start + marker.length, end).trim().replace(/;$/, ""));
}
const perf = JSON.parse(await input("perf.json"));
const lowNoise = JSON.parse(await input("perf-low-noise.json"));
const visual = JSON.parse(await input("visreg.json"));
const original = await input("artifacts/timeline_comparison.html");
assert.equal(perf.kind, "ok");
assert.equal(lowNoise.kind, "ok");
assert.equal(perf.runId, "2026-09-17T13:21:25.405Z");
assert.equal(lowNoise.runId, perf.runId);
assert.equal(visual.measurement.find((entry) => entry.selector === "article")?.diffPixels, 0);
assert.ok(original.includes("Timeline Comparison: Control vs Experiment"));
const lighthouseStarts = [...lowNoise.logs.matchAll(/Lighthouse start at (\S+)/g)].map((match) => match[1]);
assert.equal(lighthouseStarts.length, 2);

const sides = {};
let throttling;
for (const side of ["control", "experiment"]) {
  const report = lighthouseJson(await input(`artifacts/${side}_lighthouse_report.html`));
  const raw = JSON.parse(await input(`artifacts/${side}_performance_profile.json`));
  const events = raw.traceEvents ?? raw;
  const expectedHost = side === "control" ? "control.localhost:3100" : "experim.localhost:3200";
  assert.equal(new URL(report.finalDisplayedUrl).host, `luisfurushio.${expectedHost}`);
  assert.equal(new URL(report.finalDisplayedUrl).pathname, "/l/bgfjk");
  assert.equal(new URL(report.finalDisplayedUrl).searchParams.get("layout"), "profile");
  assert.ok(lighthouseStarts.some((start) => {
    const offset = Date.parse(report.fetchTime) - Date.parse(start);
    return offset >= 0 && offset < 5000;
  }), `${side}: report is not from low-noise capture`);
  assert.match(report.environment.networkUserAgent, /Mobile/);
  assert.match(report.configSettings.emulatedUserAgent, /Mobile/);
  assert.equal(report.configSettings.screenEmulation.width, 375);
  const navigation = events.find((event) => event.name === "navigationStart" && event.args?.data?.isOutermostMainFrame && event.args.data.documentLoaderURL === report.finalDisplayedUrl);
  assert.ok(navigation, `${side}: missing target navigation`);
  const traceFcp = events.find((event) => event.name === "firstContentfulPaint" && event.pid === navigation.pid && event.tid === navigation.tid && event.ts >= navigation.ts);
  const fcpMs = report.audits["first-contentful-paint"].numericValue;
  assert.ok(traceFcp && Math.abs((traceFcp.ts - navigation.ts) / 1000 - fcpMs) < 1, `${side}: trace/Lighthouse origin mismatch`);
  const frames = events.filter((event) => event.name === "Screenshot").map((event) => ({
    timeMs: Math.max(0, (event.ts - navigation.ts) / 1000),
    image: `data:image/jpeg;base64,${event.args.snapshot}`,
  })).sort((left, right) => left.timeMs - right.timeMs);
  assert.ok(frames.length > 2, `${side}: missing screenshot sequence`);
  const profile = { method: report.configSettings.throttlingMethod, ...report.configSettings.throttling };
  if (throttling) assert.deepEqual(profile, throttling, "Both sides must use the same throttling");
  throttling = profile;
  sides[side] = {
    url: report.finalDisplayedUrl,
    fetchTime: report.fetchTime,
    fcpMs,
    lcpMs: report.audits["largest-contentful-paint"].numericValue,
    frames,
    reportHref: `../compare-results/${caseId}/artifacts/${side}_lighthouse_report.html`,
  };
}
const durationMs = Math.ceil(Math.max(...Object.values(sides).flatMap((side) => side.frames.map((frame) => frame.timeMs))) / 1000) * 1000;
const metadata = {
  runId: perf.runId,
  caseId,
  scenario: "Product page · profile layout · Mobile · empty cache",
  diagnosticStage: "perf-low-noise",
  note: "One diagnostic load, not an 18-sample median.",
  durationMs,
  throttling,
  fcpMs: { control: sides.control.fcpMs, experiment: sides.experiment.fcpMs },
  frameCounts: { control: sides.control.frames.length, experiment: sides.experiment.frames.length },
  originalTimeline: { href: `../compare-results/${caseId}/artifacts/timeline_comparison.html`, sha256: sha256(original) },
  visualDiffPixels: 0,
  sourceHashes,
};
const data = JSON.stringify({ metadata, sides }).replaceAll("<", "\\u003c");
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Profile-layout Product page: one diagnostic replay</title>
<style>
:root{color-scheme:light dark;--page:#fff;--ink:#162334;--muted:#4d5a66;--card:#f4f7f9;--blue:#215da8;--green:#147a46}
@media(prefers-color-scheme:dark){:root{--page:#101820;--ink:#f3f7f9;--muted:#b9c8d2;--card:#1d2b35;--blue:#80b9ff;--green:#77dba5}}
*{box-sizing:border-box}body{margin:0;background:var(--page);color:var(--ink);font:16px/1.5 system-ui,-apple-system,sans-serif}main{max-width:1060px;margin:auto;padding:24px}h1{line-height:1.15;margin:0 0 10px}p{margin:8px 0;color:var(--muted)}.takeaway{font-size:1.15rem;color:var(--ink)}.control{color:var(--blue)}.experiment{color:var(--green)}.controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:25px 0;padding:14px;background:var(--card);border-radius:12px}button{border:1px solid var(--muted);border-radius:8px;padding:8px 14px;color:var(--ink);background:var(--page);cursor:pointer}button:focus-visible,input:focus-visible{outline:3px solid var(--green);outline-offset:2px}input[type=range]{flex:1;min-width:230px}.screens{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.screen{min-width:0;padding:14px;background:var(--card);border-radius:12px}.screen h2{margin:0 0 12px;font-size:1rem}.screen img{display:block;width:100%;aspect-ratio:375/667;object-fit:contain;object-position:top;background:white;border:1px solid #bcc7cf}.links{margin-top:22px}.links a{color:var(--blue)}@media(max-width:720px){.screens{grid-template-columns:1fr}main{padding:14px}}
</style></head><body><main>
<h1>One Product page, two loading paths</h1>
<p>Profile layout · Mobile · empty cache · one diagnostic load, not the 18-pair median.</p>
<p class="takeaway">First paint in this capture: <strong class="control">${(sides.control.fcpMs / 1000).toFixed(2)} s with Inertia</strong>; <strong class="experiment">${(sides.experiment.fcpMs / 1000).toFixed(2)} s with React on Rails Pro</strong>.</p>
<div class="controls"><button id="play" type="button">Play</button><button id="back" type="button">−0.5 s</button><button id="forward" type="button">+0.5 s</button><input id="timeline" type="range" min="0" max="${durationMs}" step="50" value="0" aria-label="Elapsed time since navigation"><output id="clock" for="timeline">0.00 s</output></div>
<div class="screens"><section class="screen"><h2 class="control">Inertia control</h2><img id="control" alt="Inertia Product page at the selected replay time"></section><section class="screen"><h2 class="experiment">React on Rails Pro / RSC</h2><img id="experiment" alt="React Server Components Product page at the selected replay time"></section></div>
<p class="links">Evidence: <a href="${sides.control.reportHref}">control Lighthouse report</a> · <a href="${sides.experiment.reportHref}">experiment Lighthouse report</a> · <a href="${metadata.originalTimeline.href}">unchanged original timeline</a> · <a href="../compare-results/${caseId}/visreg.json">visual comparison</a>. Both captures use the same throttle profile and target-navigation time origin.</p>
<script id="capture-data" type="application/json">${data}</script>
<script>
const capture=JSON.parse(document.getElementById('capture-data').textContent);
const slider=document.getElementById('timeline'),clock=document.getElementById('clock'),play=document.getElementById('play');
let playing=false,lastFrame=0,previous=0;
function frameAt(frames,time){let frame=frames[0];for(const next of frames){if(next.timeMs>time)break;frame=next}return frame}
function show(time){const value=Math.max(0,Math.min(capture.metadata.durationMs,time));slider.value=String(value);clock.value=(value/1000).toFixed(2)+' s';for(const side of ['control','experiment'])document.getElementById(side).src=frameAt(capture.sides[side].frames,value).image}
function tick(now){if(!playing)return;if(previous)show(Number(slider.value)+now-previous);previous=now;if(Number(slider.value)>=capture.metadata.durationMs){playing=false;play.textContent='Play';return}lastFrame=requestAnimationFrame(tick)}
play.addEventListener('click',()=>{playing=!playing;play.textContent=playing?'Pause':'Play';previous=0;if(playing){if(Number(slider.value)>=capture.metadata.durationMs)show(0);lastFrame=requestAnimationFrame(tick)}else cancelAnimationFrame(lastFrame)});
slider.addEventListener('input',()=>show(Number(slider.value)));
document.getElementById('back').addEventListener('click',()=>show(Number(slider.value)-500));
document.getElementById('forward').addEventListener('click',()=>show(Number(slider.value)+500));
show(0);
</script></main></body></html>\n`;
await writeFile(output, html);
const imageDir = resolve(here, "../../images");
await mkdir(imageDir, { recursive: true });
const escapeXml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
function imageDocument(title, description, body, height) {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 ' + height + '" role="img" aria-labelledby="title description" font-family="Arial,Helvetica,sans-serif">',
    '<title id="title">' + escapeXml(title) + '</title>',
    '<desc id="description">' + escapeXml(description) + '</desc>',
    '<metadata>' + escapeXml(JSON.stringify({ runId: metadata.runId, caseId, diagnosticStage: metadata.diagnosticStage, sourceHashes })) + '</metadata>',
    '<rect width="1400" height="' + height + '" fill="#ffffff"/>',
    body,
    '</svg>',
  ].join("\n") + "\n";
}
function frameAt(frames, timeMs) {
  let frame = frames[0];
  for (const next of frames) {
    if (next.timeMs > timeMs) break;
    frame = next;
  }
  return frame;
}
const preview = [
  '<text x="44" y="55" fill="#162334" font-size="30" font-weight="700">Watch the Product page appear</text>',
  '<text x="44" y="88" fill="#4d5a66" font-size="18">Profile layout · Mobile · empty cache · one diagnostic load</text>',
];
for (const [index, timeMs] of [0, 2000, 6000, 10000].entries()) {
  const column = 44 + index * 338;
  preview.push('<text x="' + column + '" y="136" fill="#162334" font-size="21" font-weight="700">' + (timeMs / 1000) + ' seconds</text>');
  for (const [side, offset, color, label] of [
    ["control", 0, "#215da8", "Inertia"],
    ["experiment", 154, "#147a46", "React on Rails Pro"],
  ]) {
    const x = column + offset;
    const frame = frameAt(sides[side].frames, timeMs);
    preview.push('<rect x="' + x + '" y="161" width="139" height="247" fill="#f4f7f9" stroke="' + color + '" stroke-width="2"/>');
    preview.push('<image href="' + frame.image + '" x="' + x + '" y="162" width="138" height="245" preserveAspectRatio="xMidYMin meet"/>');
    preview.push('<text x="' + x + '" y="437" fill="' + color + '" font-size="17" font-weight="700">' + label + '</text>');
  }
}
preview.push('<text x="44" y="493" fill="#162334" font-size="19" font-weight="700">First paint in this capture: Inertia ' + (sides.control.fcpMs / 1000).toFixed(2) + ' s · React on Rails Pro ' + (sides.experiment.fcpMs / 1000).toFixed(2) + ' s</text>');
preview.push('<text x="44" y="526" fill="#4d5a66" font-size="16">The filmstrip is one load, not the median of 18 measurements per side.</text>');
const previewSvg = imageDocument(
  "Four moments from a Product page loading comparison",
  "At 0, 2, 6, and 10 seconds after navigation, the same Mobile diagnostic capture shows Inertia and React on Rails Pro side by side. This is not an aggregate result.",
  preview.join("\n"),
  560,
);
await writeFile(join(imageDir, "product-profile-timeline-preview.svg"), previewSvg);

const axisStart = 288;
const axisEnd = 1300;
const axisX = (milliseconds) => axisStart + milliseconds / 12000 * (axisEnd - axisStart);
const timeline = [
  '<text x="44" y="55" fill="#162334" font-size="30" font-weight="700">Product page paint timeline: one Mobile load</text>',
  '<text x="44" y="88" fill="#4d5a66" font-size="18">Profile layout · empty cache · seconds since target navigation</text>',
];
for (let seconds = 0; seconds <= 12; seconds += 2) {
  const x = axisX(seconds * 1000);
  timeline.push('<line x1="' + x + '" y1="151" x2="' + x + '" y2="378" stroke="#dfe6eb"/>');
  timeline.push('<text x="' + x + '" y="139" text-anchor="middle" fill="#4d5a66" font-size="16">' + seconds + ' s</text>');
}
for (const [side, y, color, label] of [
  ["control", 234, "#215da8", "Inertia control"],
  ["experiment", 334, "#147a46", "React on Rails Pro"],
]) {
  const fcp = sides[side].fcpMs;
  const lcp = sides[side].lcpMs;
  const fcpX = axisX(fcp);
  const lcpX = axisX(lcp);
  const anchor = fcp > 8000 ? "end" : "start";
  const labelX = fcpX + (fcp > 8000 ? -12 : 12);
  timeline.push('<text x="44" y="' + (y + 5) + '" fill="' + color + '" font-size="19" font-weight="700">' + label + '</text>');
  timeline.push('<rect x="' + axisStart + '" y="' + (y - 12) + '" width="' + (fcpX - axisStart) + '" height="24" rx="5" fill="' + color + '" opacity="0.22"/>');
  timeline.push('<line x1="' + fcpX + '" y1="' + (y - 35) + '" x2="' + fcpX + '" y2="' + (y + 24) + '" stroke="' + color + '" stroke-width="3"/>');
  timeline.push('<circle cx="' + lcpX + '" cy="' + (y + 24) + '" r="6" fill="' + color + '"/>');
  timeline.push('<text x="' + labelX + '" y="' + (y - 20) + '" text-anchor="' + anchor + '" fill="' + color + '" font-size="18" font-weight="700">FCP ' + (fcp / 1000).toFixed(2) + ' s</text>');
  timeline.push('<text x="' + labelX + '" y="' + (y + 49) + '" text-anchor="' + anchor + '" fill="#4d5a66" font-size="16">LCP ' + (lcp / 1000).toFixed(2) + ' s</text>');
}
timeline.push('<text x="44" y="431" fill="#4d5a66" font-size="16">Bars end at first paint; dots mark largest paint. One diagnostic load, not 18-run medians or paired intervals.</text>');
const timelineSvg = imageDocument(
  "First and largest paint in one Product page loading comparison",
  "In a single cold Mobile diagnostic load, Inertia first painted at " + (sides.control.fcpMs / 1000).toFixed(2) + " seconds and React on Rails Pro at " + (sides.experiment.fcpMs / 1000).toFixed(2) + " seconds.",
  timeline.join("\n"),
  470,
);
await writeFile(join(imageDir, "product-profile-loading-timeline.svg"), timelineSvg);
await writeFile(join(here, "replay-manifest.json"), JSON.stringify(metadata, null, 2) + "\n");
assert.equal(sha256(await readFile(join(caseDir, "artifacts/timeline_comparison.html"))), metadata.originalTimeline.sha256, "Original timeline changed during generation");
console.log(`Regenerated ${output}: ${metadata.frameCounts.control}/${metadata.frameCounts.experiment} frames, ${durationMs} ms`);
