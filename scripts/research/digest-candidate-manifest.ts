/** Print exactly the validated canonical authoring-manifest SHA-256. */

import { pathToFileURL } from "node:url";

import { checkCandidateManifest } from "./check-candidate-manifest";

export function digestCandidateManifestFile(
  root: string = process.cwd(),
): string {
  const result = checkCandidateManifest(root);
  if (
    result.issues.length > 0 ||
    result.manifest === null ||
    result.digest === null
  ) {
    throw new Error(
      result.issues
        .map((entry) => `[${entry.code}] ${entry.path} ${entry.message}`)
        .join("\n") || "canonical candidate manifest is unavailable",
    );
  }
  return result.digest;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    console.log(digestCandidateManifestFile());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
