#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Product-only revision of the original five-page buyer-results chart script.
const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const source = resolve(process.argv[2] ?? join(repo, "compare-results"));
const images = resolve(process.argv[3] ?? join(here, "../images"));
const data = JSON.parse(await readFile(join(here, "latest-results.json"), "utf8"));
assert.equal(data.runId, "2026-09-17T13:21:25.405Z");
assert.equal(data.results.length, 4);
assert.ok(data.results.every((result) => result.sampleCountPerSide === 18));
assert.ok(data.results.every((result) => !result.id.includes("sticky")));
for (const input of data.inputs) {
  const bytes = await readFile(join(source, input.path));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), input.sha256, `Source changed: ${input.path}`);
}

const blue = "#215da8";
const green = "#147a46";
const ink = "#162334";
const muted = "#4d5a66";
const background = "#ffffff";
const xml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const label = (result) => `${result.cache === "Empty cache" ? "Cold" : "Warm"} ${result.viewport}`;
const time = (value) => value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
const format = (key, value) => key === "downloads" ? `${value.toFixed(1)} KB` : key === "downloads-count" ? `${Math.round(value)}` : time(value);
const text = (x, y, value, size = 16, attrs = "") => `<text x="${x}" y="${y}" font-size="${size}" ${attrs.includes("fill=") ? "" : `fill="${ink}"`} ${attrs}>${xml(value)}</text>`;
const svg = (title, description, body, width = 1400, height = 750) => [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description" font-family="ui-sans-serif,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">`,
  `<title id="title">${xml(title)}</title><desc id="description">${xml(description)}</desc>`,
  `<metadata>${xml(JSON.stringify({ runId: data.runId, source: data.source, cases: data.results.map((result) => result.id), samplesPerSide: 18, inputHashes: data.inputs }))}</metadata>`,
  `<rect width="${width}" height="${height}" fill="${background}"/>`,
  body,
  "</svg>",
].join("\n") + "\n";
function legend(y = 132) {
  return `<rect x="48" y="${y - 12}" width="16" height="16" rx="3" fill="${blue}"/>${text(73, y + 1, "Inertia control", 16)}` +
    `<rect x="260" y="${y - 12}" width="16" height="16" rx="3" fill="${green}"/>${text(285, y + 1, "React on Rails Pro / RSC", 16)}`;
}
function chart(metricDefinitions, title, subtitle, filename) {
  const parts = [text(48, 57, title, 29, 'font-weight="700"'), text(48, 91, subtitle, 17), legend()];
  const panelX = [245, 625, 1005];
  metricDefinitions.forEach(({ key, heading }, index) => {
    const x = panelX[index];
    const max = Math.max(...data.results.flatMap((result) => [result.metrics[key].controlMedian, result.metrics[key].experimentMedian])) * 1.32;
    parts.push(text(x, 195, heading, 21, 'font-weight="700"'));
    parts.push(`<line x1="${x}" y1="221" x2="${x}" y2="671" stroke="#b9c2cb"/>`);
    data.results.forEach((result, row) => {
      const top = 235 + row * 109;
      const metric = result.metrics[key];
      for (const [side, offset, color] of [["control", 0, blue], ["experiment", 32, green]]) {
        const value = metric[`${side}Median`];
        const width = 280 * value / max;
        parts.push(`<g data-case="${result.id}" data-metric="${key}" data-side="${side}" data-median="${value}">`);
        parts.push(`<rect x="${x}" y="${top + offset}" width="${width.toFixed(2)}" height="24" rx="4" fill="${color}"/>`);
        parts.push(text(x + width + 8, top + offset + 18, format(key, value), 15));
        parts.push("</g>");
      }
    });
  });
  data.results.forEach((result, row) => {
    const top = 235 + row * 109;
    parts.push(text(48, top + 31, label(result), 18, 'font-weight="600"'));
    parts.push(text(48, top + 53, result.cache.toLowerCase(), 14, `fill="${muted}"`));
    if (row < 3) parts.push(`<line x1="48" y1="${top + 82}" x2="1350" y2="${top + 82}" stroke="#e1e6ea"/>`);
  });
  parts.push(text(48, 713, "ShakaPerf · September 17, 2026 · median of 18 measurements per side · lower is better", 15, `fill="${muted}"`));
  return [filename, svg(title, `${subtitle}. Four profile-layout product landing cases only; sticky add-to-cart excluded. Each colored bar is the median of 18 measurements, not the paired performance estimate.`, parts.join("\n"))];
}

function distributionByCache() {
  const title = "First paint times: cold and warm ranges";
  const parts = [text(48, 57, title, 29, 'font-weight="700"'), text(48, 91, "Profile-layout Product landings · 18 measurements per side", 17), legend()];
  const startX = 340, endX = 1250;
  const sections = [
    { cache: "Empty cache", title: "Cold visits · seconds", max: 18000, ticks: [0, 4000, 8000, 12000, 16000, 18000], headingY: 190, gridTop: 218, gridBottom: 445, rows: [250, 355], tick: (value) => (value / 1000) + "s" },
    { cache: "Prepopulated cache", title: "Warm visits · milliseconds", max: 1000, ticks: [0, 250, 500, 750, 1000], headingY: 525, gridTop: 552, gridBottom: 778, rows: [585, 690], tick: (value) => value + "ms" },
  ];
  for (const section of sections) {
    const matching = data.results.filter((result) => result.cache === section.cache);
    assert.equal(matching.length, 2);
    assert.ok(matching.every((result) => Math.max(...result.metrics.FCP.samples.control, ...result.metrics.FCP.samples.experiment) <= section.max));
    const scale = (value) => startX + (endX - startX) * value / section.max;
    parts.push(text(48, section.headingY, section.title, 21, 'font-weight="700"'));
    for (const tick of section.ticks) {
      const x = scale(tick);
      parts.push('<line x1="' + x + '" y1="' + section.gridTop + '" x2="' + x + '" y2="' + section.gridBottom + '" stroke="#e1e6ea"/>');
      parts.push(text(x, section.gridTop - 12, section.tick(tick), 13, 'text-anchor="middle"'));
    }
    for (const [index, result] of matching.entries()) {
      const top = section.rows[index];
      parts.push(text(48, top + 21, result.viewport, 18, 'font-weight="600"'));
      for (const [side, offset, color] of [["control", 0, blue], ["experiment", 34, green]]) {
        const values = result.metrics.FCP.samples[side];
        const low = Math.min(...values), high = Math.max(...values), median = result.metrics.FCP[side + "Median"];
        const y = top + offset;
        parts.push('<line x1="' + scale(low) + '" y1="' + y + '" x2="' + scale(high) + '" y2="' + y + '" stroke="' + color + '" stroke-width="6" stroke-linecap="round"/>');
        parts.push('<circle cx="' + scale(median) + '" cy="' + y + '" r="9" fill="' + color + '" stroke="white" stroke-width="2"/>');
        parts.push(text(endX + 16, y + 5, time(median), 14));
      }
    }
  }
  parts.push(text(48, 817, "Line = minimum to maximum; circle = median. Different cold and warm scales; neither shows paired intervals.", 15, 'fill="' + muted + '"'));
  return ["product-fcp-distributions.svg", svg(title, "Cold visits use a 0–18-second scale. Warm visits use a 0–1000-millisecond scale. Each line shows the range of 18 raw first-contentful-paint measurements; each circle shows the median.", parts.join("\n"), 1400, 850)];
}

const outputs = [
  chart([{ key: "FCP", heading: "First contentful paint" }, { key: "LCP", heading: "Largest contentful paint" }, { key: "speed-index", heading: "Speed Index" }], "Product page loading times: Inertia vs Server Components", "Desktop and Mobile · empty and prepopulated cache · lower is better", "product-page-paint.svg"),
  chart([{ key: "TTFB", heading: "Browser-observed TTFB" }, { key: "downloads", heading: "Total transferred data" }, { key: "downloads-count", heading: "Network requests" }], "The cost of earlier paint: response time and downloads", "Same four cases and run · TTFB does not measure renderer CPU or server resource use", "product-page-tradeoffs.svg"),
  distributionByCache(),
];
await mkdir(images, { recursive: true });
for (const [filename, content] of outputs) {
  await writeFile(join(images, filename), content);
  console.log(`Regenerated ${join(images, filename)}`);
}
