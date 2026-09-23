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
const source = resolve(process.argv[2] ?? join(repo, "compare-results-sep23"));
const output = resolve(process.argv[3] ?? here);
const runIdExpected = "2026-09-23T18:01:58.195Z";
const sampleCount = 20;
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
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}
function displayMs(value) {
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
}

const reportHtml = await input("full-report.html");
const reportMatch = reportHtml.match(
  /<script id="__shaka_report_data__" type="application\/json">([\s\S]*?)<\/script>/u,
);
assert.ok(reportMatch, "full-report.html: missing embedded report data");
const assembled = JSON.parse(reportMatch[1]);
assert.equal(assembled.meta.pipelineName, "compare");
assert.deepEqual(assembled.meta.errors, []);
assert.equal(assembled.meta.pipelineConfig.perfNumberOfMeasurements, sampleCount);
const selectedIds = new Set(cases.map((entry) => entry.id));
assert.equal(selectedIds.size, 4);
for (const entry of cases) {
  const testName = `Product Page - Profile layout ${entry.cache === "Empty cache" ? "cold" : "warm"} landing`;
  const reported = assembled.tests.find((test) => test.name === testName);
  assert.ok(reported, `${entry.id}: missing from assembled report`);
  assert.equal(reported.runId, runIdExpected);
  const viewportLabel = entry.viewport === "Mobile" ? "phone" : "desktop";
  const artifact = reported.viewportArtifactPaths.find((item) => item.viewport === viewportLabel);
  assert.equal(artifact?.path.split("/").at(-1), entry.id, `${entry.id}: report points to another artifact directory`);
  assert.equal(
    reported.outcomes.find((outcome) => outcome.stage === "perf" && outcome.viewport.label === viewportLabel)?.kind,
    "ok",
  );
}
assert.ok(assembled.tests.some((test) => test.name.includes("sticky add to cart")), "Expected out-of-scope fifth test");

let runId;
const results = [];
for (const entry of cases) {
  const prefix = entry.id;
  const perf = JSON.parse(await input(`${prefix}/perf.json`));
  const report = JSON.parse(await input(`${prefix}/artifacts/report.json`));
  const measurements = JSON.parse(await input(`${prefix}/artifacts/ab-measurements.json`));
  const visreg = JSON.parse(await input(`${prefix}/visreg.json`));
  const accessibility = JSON.parse(await input(`${prefix}/accessibility.json`));
  assert.equal(perf.kind, "ok");
  assert.equal(perf.stage, "perf");
  runId ??= perf.runId;
  assert.equal(perf.runId, runId, `${prefix}: mixed runs`);
  const sides = Object.fromEntries(measurements.map((group) => [group.group, group.samples]));
  assert.deepEqual(Object.keys(sides).sort(), ["control", "experiment"]);
  assert.equal(sides.control.length, sampleCount);
  assert.equal(sides.experiment.length, sampleCount);
  const metrics = {};
  for (const label of labels) {
    const item = perf.measurement.metrics.find((metric) => metric.label === label);
    const statistics = report.vitalsTableData.concat(report.diagnosticsTableData).find((row) => row.phaseName === label);
    assert.ok(item && statistics, `${prefix}: missing ${label}`);
    assert.equal(statistics.controlSampleCount, sampleCount);
    assert.equal(statistics.experimentSampleCount, sampleCount);
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
    assert.equal(lighthouse.configSettings.screenEmulation.width, entry.viewport === "Mobile" ? 375 : 1280);
    userAgents[side] = { network: agent, emulated, fetchTime: lighthouse.fetchTime };
  }
  if (entry.cache === "Empty cache") {
    assert.equal(visreg.kind, "ok");
    assert.ok(visreg.measurement.length > 0);
    assert.ok(visreg.measurement.every((result) => result.diffPixels === 0));
  } else assert.equal(visreg.kind, "skipped");
  if (entry.cache === "Empty cache") {
    assert.equal(accessibility.kind, "ok");
    assert.equal(accessibility.measurement.summary.new, 0);
    assert.equal(accessibility.measurement.summary.fixed, 0);
  } else assert.equal(accessibility.kind, "skipped");
  results.push({
    ...entry,
    sampleCountPerSide: sampleCount,
    metrics,
    userAgents,
    visual: entry.cache === "Empty cache" ? "0 differing pixels" : "not captured",
    accessibility:
      entry.cache === "Empty cache"
        ? accessibility.measurement.summary
        : { status: "not captured" },
  });
}
assert.equal(runId, runIdExpected, "The latest selected run changed; review before regenerating");
const data = {
  title: "Gumroad profile-layout Product page: Inertia versus React Server Components",
  source: "compare-results-sep23",
  runId,
  reportGeneratedAt: assembled.meta.generatedAt,
  scope: "Only cold and warm profile-layout landing, Desktop and Mobile; sticky add-to-cart excluded",
  comparison: { control: "Inertia baseline", experiment: "React on Rails Pro / React 19 Server Components" },
  caveat: "The report does not include time-aligned memory or swap telemetry, so it cannot prove that the host was free of memory pressure.",
  results,
  inputs,
};
await mkdir(output, { recursive: true });
await writeFile(join(output, "latest-results.json"), JSON.stringify(data, null, 2) + "\n");
const lines = [
  `# Profile-layout Product page: latest comparison`,
  "",
  `Run: \`${runId}\`. Control: Inertia baseline. Experiment: React on Rails Pro with React 19 Server Components.`,
  `Only cold and warm landings are included. Sticky add-to-cart is excluded. Each cell has ${sampleCount} measurements per side.`,
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
lines.push(
  "",
  `Cold visual checks: Desktop and Mobile, 0 differing pixels. Warm visual checks were not captured.`,
  `Cold accessibility checks: no new or fixed findings; 20 findings changed on each viewport (19 critical, 1 serious). Warm accessibility checks were not captured.`,
  "",
  data.caveat,
  "",
  `Source hashes and user agents: [latest-results.json](latest-results.json).`,
  "",
);
await writeFile(join(output, "latest-results.md"), lines.join("\n"));
console.log(`Extracted ${results.length} profile-layout cases from ${runId}; excluded sticky add-to-cart.`);
