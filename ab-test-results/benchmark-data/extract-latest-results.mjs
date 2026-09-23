#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Product-only successor to the all-pages article extractor. Keep this list explicit:
// the same ShakaPerf run also includes sticky add-to-cart, which is out of scope.
const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const source = resolve(process.argv[2] ?? join(repo, "compare-results"));
const output = resolve(process.argv[3] ?? here);
const cases = [
  { id: "product-page-profile-layout-cold-landing-desktop-6fad3788", cache: "Empty cache", viewport: "Desktop" },
  { id: "product-page-profile-layout-cold-landing-phone-031456e8", cache: "Empty cache", viewport: "Mobile" },
  { id: "product-page-profile-layout-warm-landing-desktop-266c1124", cache: "Prepopulated cache", viewport: "Desktop" },
  { id: "product-page-profile-layout-warm-landing-phone-87ad03a9", cache: "Prepopulated cache", viewport: "Mobile" },
];
const labels = ["FCP", "LCP", "speed-index", "TTFB", "downloads", "downloads-count", "CLS"];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const inputs = [];
async function input(path) {
  const bytes = await readFile(join(source, path));
  inputs.push({ path, sha256: hash(bytes) });
  return bytes.toString("utf8");
}
function lighthouseJson(html, path) {
  const marker = "window.__LIGHTHOUSE_JSON__ = ";
  const start = html.indexOf(marker);
  assert.ok(start >= 0, `${path}: no Lighthouse JSON`);
  const end = html.indexOf("</script>", start);
  assert.ok(end > start, `${path}: incomplete Lighthouse JSON`);
  return JSON.parse(html.slice(start + marker.length, end).trim().replace(/;$/, ""));
}
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return (sorted[8] + sorted[9]) / 2;
}
function displayMs(value) {
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
}

const assembled = JSON.parse(await input("report.json"));
assert.equal(assembled.meta.pipelineName, "compare");
assert.deepEqual(assembled.meta.errors, []);
const selectedIds = new Set(cases.map((entry) => entry.id));
assert.equal(selectedIds.size, 4);
for (const entry of cases) {
  const reported = assembled.tests.find((test) => test.id === entry.id);
  assert.ok(reported, `${entry.id}: missing from assembled report`);
  assert.equal(reported.name, `Product Page - Profile layout ${entry.cache === "Empty cache" ? "cold" : "warm"} landing`);
  assert.equal(reported.viewport.label, entry.viewport === "Mobile" ? "phone" : "desktop");
  assert.equal(reported.outcomes.find((outcome) => outcome.stage === "perf")?.kind, "ok");
}
assert.ok(assembled.tests.some((test) => test.name.includes("sticky add to cart")), "Expected out-of-scope fifth test");

let runId;
const results = [];
for (const entry of cases) {
  const prefix = entry.id;
  const reported = assembled.tests.find((test) => test.id === prefix);
  const perf = JSON.parse(await input(`${prefix}/perf.json`));
  const report = JSON.parse(await input(`${prefix}/artifacts/report.json`));
  const measurements = JSON.parse(await input(`${prefix}/artifacts/ab-measurements.json`));
  const visreg = JSON.parse(await input(`${prefix}/visreg.json`));
  assert.equal(perf.kind, "ok");
  assert.equal(perf.stage, "perf");
  runId ??= perf.runId;
  assert.equal(perf.runId, runId, `${prefix}: mixed runs`);
  const sides = Object.fromEntries(measurements.map((group) => [group.group, group.samples]));
  assert.deepEqual(Object.keys(sides).sort(), ["control", "experiment"]);
  assert.equal(sides.control.length, 18);
  assert.equal(sides.experiment.length, 18);
  const metrics = {};
  for (const label of labels) {
    const item = perf.measurement.metrics.find((metric) => metric.label === label);
    const statistics = report.vitalsTableData.concat(report.diagnosticsTableData).find((row) => row.phaseName === label);
    assert.ok(item && statistics, `${prefix}: missing ${label}`);
    assert.equal(statistics.controlSampleCount, 18);
    assert.equal(statistics.experimentSampleCount, 18);
    const samples = {};
    for (const side of ["control", "experiment"]) {
      samples[side] = sides[side].map((sample) => {
        const phase = sample.phases.find((part) => part.phase === label);
        assert.ok(phase, `${prefix}: missing ${side} ${label} sample`);
        return ["FCP", "LCP", "speed-index", "TTFB"].includes(label) ? phase.duration / 1000 : phase.duration;
      });
      assert.ok(samples[side].every(Number.isFinite));
      assert.ok(Math.abs(median(samples[side]) - item[`${side}Value`]) <= (label === "CLS" ? 0.11 : 1), `${prefix}: ${label} median mismatch`);
    }
    metrics[label] = {
      controlMedian: item.controlValue,
      experimentMedian: item.experimentValue,
      pairedDelta: statistics.estimatorDelta,
      pairedConfidenceInterval: statistics.confidenceInterval,
      pairedPercent: item.deltaPercent,
      percentConfidenceInterval: [statistics.asPercent.percentMin, statistics.asPercent.percentMax],
      pValue: item.pValue,
      samples,
    };
  }
  const userAgents = {};
  for (const side of ["control", "experiment"]) {
    const path = `${prefix}/artifacts/${side}_lighthouse_report.html`;
    const lighthouse = lighthouseJson(await input(path), path);
    const agent = lighthouse.environment.networkUserAgent;
    const emulated = lighthouse.configSettings.emulatedUserAgent;
    const mobile = /Mobile|Android|iPhone/.test(agent);
    assert.equal(mobile, entry.viewport === "Mobile", `${prefix}: wrong network UA for ${side}`);
    assert.equal(/Mobile|Android|iPhone/.test(emulated), mobile, `${prefix}: wrong emulated UA for ${side}`);
    assert.equal(lighthouse.configSettings.screenEmulation.width, reported.viewport.width);
    userAgents[side] = { network: agent, emulated, fetchTime: lighthouse.fetchTime };
  }
  if (entry.cache === "Empty cache") {
    assert.equal(visreg.kind, "ok");
    assert.ok(visreg.measurement.length > 0);
    assert.ok(visreg.measurement.every((result) => result.diffPixels === 0));
  } else assert.equal(visreg.kind, "skipped");
  results.push({ ...entry, sampleCountPerSide: 18, metrics, userAgents, visual: entry.cache === "Empty cache" ? "0 differing pixels" : "not captured" });
}
assert.equal(runId, "2026-09-17T13:21:25.405Z", "The latest selected run changed; review before regenerating");
const data = {
  title: "Gumroad profile-layout Product page: Inertia versus React Server Components",
  source: "compare-results",
  runId,
  reportGeneratedAt: assembled.meta.generatedAt,
  scope: "Only cold and warm profile-layout landing, Desktop and Mobile; sticky add-to-cart excluded",
  comparison: { control: "Inertia baseline", experiment: "React on Rails Pro / React 19 Server Components" },
  caveat: "No time-aligned memory/swap guard record was saved for this run; the estimates are not certified swap-free.",
  results,
  inputs,
};
await mkdir(output, { recursive: true });
await writeFile(join(output, "latest-results.json"), JSON.stringify(data, null, 2) + "\n");
const lines = [
  `# Profile-layout Product page: latest comparison`,
  "",
  `Run: \`${runId}\`. Control: Inertia baseline. Experiment: React on Rails Pro with React 19 Server Components.`,
  `Only cold and warm landings are included. Sticky add-to-cart is excluded. Each cell has 18 measurements per side.`,
  "",
  "| Navigation | Viewport | Metric | Inertia median | RORP median | Paired estimate (95% CI) | Paired percent (95% CI) |",
  "| --- | --- | --- | ---: | ---: | ---: | ---: |",
];
for (const result of results) {
  for (const label of ["FCP", "LCP", "speed-index"]) {
    const metric = result.metrics[label];
    lines.push(`| ${result.cache} | ${result.viewport} | ${label === "speed-index" ? "Speed Index" : label} | ${displayMs(metric.controlMedian)} | ${displayMs(metric.experimentMedian)} | ${metric.pairedDelta} (${metric.pairedConfidenceInterval.join(" to ")}) | ${metric.pairedPercent.toFixed(1)}% (${metric.percentConfidenceInterval.map((value) => `${value.toFixed(1)}%`).join(" to ")}) |`);
  }
}
lines.push("", `Cold visual checks: Desktop and Mobile, 0 differing pixels. Warm visual checks were not captured.`, "", data.caveat, "", `Source hashes and user agents: [latest-results.json](latest-results.json).`, "");
await writeFile(join(output, "latest-results.md"), lines.join("\n"));
console.log(`Extracted ${results.length} profile-layout cases from ${runId}; excluded sticky add-to-cart.`);
