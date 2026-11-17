import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { canonicalJson } from "../src/lib/contracts/canonical";
import {
  healthExitCode,
  monitorPublicVideos,
} from "../src/lib/video/health-monitor";
import { publicInventoryDigest } from "../src/lib/videos/public-inventory";
import { loadPublicVideoInventory } from "./lib/public-video-inventory";
import {
  updateHealthLedger,
  type HealthLedger,
} from "../src/lib/video/health-ledger";

const inventory = loadPublicVideoInventory();
const catalogDigest = publicInventoryDigest(inventory);
const inventoryOnly = process.argv.includes("--inventory");
const inventoryOutput = resolve("artifacts/public-video-inventory.v1.json");
mkdirSync(dirname(inventoryOutput), { recursive: true });
writeFileSync(
  inventoryOutput,
  `${canonicalJson({ schemaVersion: 1, catalogDigest, entries: inventory })}\n`,
);
if (inventoryOnly) {
  console.log(
    JSON.stringify({
      videos: inventory.length,
      sourceUrls: new Set(inventory.flatMap((entry) => entry.sourceUrls)).size,
      catalogDigest,
      output: inventoryOutput,
    }),
  );
  process.exit(0);
}
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const sourceDirty =
  execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()
    .length > 0;
const targetOrigin =
  process.env.ATLAS_HEALTH_ORIGIN ?? "https://injury.sportsmedicine.tw";
if (
  ![
    "https://injury.sportsmedicine.tw",
    "https://sports-injury-atlas.pages.dev",
  ].includes(targetOrigin)
)
  throw new Error("Health target must be an owned public origin");
let deploymentCommit: string | null = null;
try {
  const response = await fetch(`${targetOrigin}/version.json`, {
    signal: AbortSignal.timeout(8000),
    redirect: "error",
  });
  if (response.ok) {
    const body = await response.text();
    if (body.length <= 2048) {
      const value: unknown = JSON.parse(body);
      if (
        value &&
        typeof value === "object" &&
        "commit" in value &&
        typeof value.commit === "string" &&
        /^[a-f0-9]{40}$/.test(value.commit)
      )
        deploymentCommit = value.commit;
    }
  }
} catch {
  // Unknown deployment is retained, never substituted with the checkout SHA.
}

const output = resolve(
  process.argv[2] ?? "artifacts/public-video-health.v2.json",
);
const artifact = await monitorPublicVideos(inventory, {
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? null,
  provenance: {
    sourceCommit,
    sourceDirty,
    catalogDigest,
    targetOrigin,
    deploymentCommit,
  },
});
const ledgerOutput = resolve(
  dirname(output),
  "public-video-health-ledger.v1.json",
);
const previousArg = process.argv.indexOf("--previous-ledger");
const previousPath =
  previousArg === -1 ? ledgerOutput : process.argv[previousArg + 1];
if (previousArg !== -1 && !previousPath)
  throw new Error("Missing previous ledger path");
let previous: HealthLedger | undefined;
if (previousPath && existsSync(previousPath))
  previous = JSON.parse(readFileSync(previousPath, "utf8")) as HealthLedger;
const ledger = updateHealthLedger(artifact, previous);
mkdirSync(dirname(ledgerOutput), { recursive: true });
writeFileSync(ledgerOutput, `${canonicalJson(ledger)}\n`, "utf8");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${canonicalJson(artifact)}\n`, "utf8");
console.log(
  JSON.stringify({
    event: "public-video-health",
    checkedAt: artifact.checkedAt,
    overallStatus: artifact.overallStatus,
    playbackVerification: artifact.playbackVerification,
    ...artifact.summary,
    output,
    provenance: artifact.provenance,
    ledger: {
      output: ledgerOutput,
      continuity: ledger.continuity,
      changes: ledger.changes.length,
    },
  }),
);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      `## Public source/video health: ${artifact.overallStatus}`,
      "",
      `- Sources: ${artifact.summary.sourceUrls}; unavailable: ${artifact.summary.unavailableSources}; indeterminate: ${artifact.summary.indeterminateSources}.`,
      `- Source reasons: ${JSON.stringify(artifact.summary.sourceReasons)}.`,
      `- Metadata unavailable/indeterminate: ${artifact.summary.unavailableMetadata}/${artifact.summary.indeterminateMetadata}.`,
      `- Public oEmbed markup present: ${artifact.summary.embedMarkupPresent}/${artifact.summary.videos}.`,
      `- API embed checks completed/skipped/indeterminate: ${artifact.summary.embedChecksCompleted}/${artifact.summary.embedChecksSkipped}/${artifact.summary.embedChecksIndeterminate}.`,
      `- Checkout/deployment: ${sourceCommit}/${deploymentCommit ?? "unknown"}; ${artifact.provenance.deploymentMatch}; dirty: ${sourceDirty}.`,
      `- Catalog: ${catalogDigest}; ledger continuity: ${ledger.continuity}; changed records: ${ledger.changes.length}.`,
      `- Open ledger records: ${ledger.entries.filter((entry) => entry.active && entry.status !== "available").length}; unassigned: ${ledger.entries.filter((entry) => entry.active && entry.status !== "available" && entry.owner === null).length}.`,
      "- Playback was not tested. Metadata, iframe markup and API flags do not prove playback in a viewer's browser or region.",
      "- Exit codes: 0 = complete checks; 1 = confirmed failure; 2 = incomplete verification (including missing API authorization).",
      "",
    ].join("\n"),
  );
}
process.exitCode = healthExitCode(artifact);
