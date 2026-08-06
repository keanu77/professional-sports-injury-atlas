/**
 * Minimal case-index manifest endpoint. The client fetches it once, only
 * after the first filter interaction, to learn which 100-entry injury shards
 * exist. It contains counts only — never case fields.
 */

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { INJURIES } from "../../data/taxonomy/injuries";
import { buildCaseIndexManifest } from "../../lib/cases/pagination";
import { resolveBuildMode } from "../../lib/governance/build-mode";

export const GET: APIRoute = async () => {
  const mode = resolveBuildMode(process.env.ATLAS_BUILD_MODE);
  const caseRecords = (await getCollection("cases")).map((entry) => entry.data);
  const manifest = buildCaseIndexManifest(
    mode,
    caseRecords,
    INJURIES.map((injury) => injury.code),
  );
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/json" },
  });
};
