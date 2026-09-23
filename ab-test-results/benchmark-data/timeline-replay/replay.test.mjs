import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../..");
const caseId = "product-page-profile-layout-cold-landing-phone-031456e8";
const source = join(repo, "compare-results-sep23", caseId);
const html = await readFile(join(repo, "ab-test-results/product-profile-phone-replay.html"), "utf8");
const manifest = JSON.parse(await readFile(join(here, "replay-manifest.json"), "utf8"));
const embedded = JSON.parse(
  html.match(/<script id="capture-data" type="application\/json">([\s\S]*?)<\/script>/u)?.[1] ?? "null",
);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("replay is the selected September 23 Product run", () => {
  assert.equal(manifest.runId, "2026-09-23T18:01:58.195Z");
  assert.equal(manifest.caseId, caseId);
  assert.equal(manifest.diagnosticStage, "perf-low-noise");
  assert.equal(manifest.originalTimeline.sha256, "65cf11e36cd91dc9864d4eb48e8760f6e44e12493555005c7ecc3d885729d2ec");
  assert.equal(manifest.fcpMs.control, 9461.355);
  assert.equal(manifest.fcpMs.experiment, 1138.019);
  assert.deepEqual(manifest.frameCounts, { control: 17, experiment: 43 });
  assert.equal(manifest.durationMs, 12000);
  assert.equal(manifest.visualDiffPixels, 0);
  assert.deepEqual(embedded.metadata, manifest);
});

test("saved replay data and retained evidence links are intact", async () => {
  for (const item of manifest.sourceHashes) {
    assert.match(item.sha256, /^[a-f0-9]{64}$/u);
  }
  for (const side of ["control", "experiment"]) {
    const reportPath = `artifacts/${side}_lighthouse_report.html`;
    const expected = manifest.sourceHashes.find((item) => item.path === `${caseId}/${reportPath}`);
    assert.ok(expected);
    assert.equal(sha256(await readFile(join(source, reportPath))), expected.sha256);
    assert.equal(embedded.sides[side].frames.length, manifest.frameCounts[side]);
    assert.ok(embedded.sides[side].frames.every((frame) => frame.image.startsWith("data:image/jpeg;base64,")));
    assert.ok(html.includes(embedded.sides[side].reportHref));
    assert.ok(
      embedded.sides[side].url.includes(`luisfurushio.${side === "control" ? "control" : "experim"}.localhost`),
    );
  }
  assert.ok(!html.includes("unchanged original timeline"));
  assert.ok(html.includes("--green:#147a46"));
  assert.ok(html.includes("--green:#77dba5"));
  assert.ok(html.includes("one diagnostic load, not the 20-pair median"));
});

test("the filmstrip and timeline use the selected diagnostic capture", async () => {
  for (const filename of ["product-profile-timeline-preview.svg", "product-profile-loading-timeline.svg"]) {
    const svg = await readFile(join(repo, "ab-test-results/images", filename), "utf8");
    assert.ok(svg.includes(manifest.runId), filename);
    assert.ok(svg.includes(manifest.caseId), filename);
    assert.ok(svg.includes("#147a46"), filename);
    assert.ok(svg.includes("9.46"), filename);
    assert.ok(svg.includes("1.14"), filename);
    assert.ok(!svg.includes("sticky"), filename);
  }
  const preview = await readFile(join(repo, "ab-test-results/images/product-profile-timeline-preview.svg"), "utf8");
  assert.equal((preview.match(/<image /gu) ?? []).length, 8);
  assert.ok(preview.includes("one load, not the median of 20"));
});
