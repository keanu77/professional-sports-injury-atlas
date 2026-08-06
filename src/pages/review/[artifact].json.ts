/**
 * Review-only canonical artifact route. In review mode, when a valid real or
 * synthetic review-set manifest is explicitly supplied, this route serves the
 * exact already-generated canonical bytes at `/review/review-set.json`; it
 * never reparses or reformats them. Public mode emits no path at all.
 */

import { existsSync, readFileSync } from "node:fs";
import type { APIRoute } from "astro";
import { resolveBuildMode } from "../../lib/governance/build-mode";
import {
  parseReviewSetManifestBytes,
  REVIEW_SET_MANIFEST_PATH,
} from "../../lib/governance/review-set";

interface ReviewArtifactProps {
  body: string;
}

export function getStaticPaths(): Array<{
  params: { artifact: string };
  props: ReviewArtifactProps;
}> {
  if (resolveBuildMode(process.env.ATLAS_BUILD_MODE) !== "review") return [];
  const manifestPath =
    process.env.ATLAS_REVIEW_SET_MANIFEST ?? REVIEW_SET_MANIFEST_PATH;
  if (!existsSync(manifestPath)) return [];
  const bytes = readFileSync(manifestPath);
  const parsed = parseReviewSetManifestBytes(bytes);
  if (parsed.manifest === null) {
    throw new Error(
      `supplied review-set manifest ${manifestPath} is invalid: ${parsed.issues
        .map((entry) => entry.message)
        .join("; ")}`,
    );
  }
  return [
    {
      params: { artifact: "review-set" },
      props: { body: bytes.toString("utf8") },
    },
  ];
}

export const GET: APIRoute = ({ props }) => {
  const { body } = props as ReviewArtifactProps;
  return new Response(body, {
    headers: { "Content-Type": "application/json" },
  });
};
