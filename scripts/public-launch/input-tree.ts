import { readdirSync, readFileSync, lstatSync } from "node:fs";
import { join, relative } from "node:path";
import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";

export const RELEASE_INPUT_PATHS = [
  "src",
  "public",
  "astro.config.mjs",
  "package.json",
  "package-lock.json",
  "scripts",
  "functions",
  "migrations",
  "wrangler.jsonc",
] as const;
export const RELEASE_BINDING_METADATA_PATH = "src/data/public-launch.v1.json";

/** Same scope for digesting inputs and checking evidence-commit ancestry. */
export function isReleaseInputPath(path: string): boolean {
  return (
    path !== RELEASE_BINDING_METADATA_PATH &&
    RELEASE_INPUT_PATHS.some(
      (input) => path === input || path.startsWith(`${input}/`),
    )
  );
}

/** Bind every rendering/content/asset input, including additions and removals. */
export function inputTreeDigest(root = process.cwd()): string {
  const entries: Array<{ path: string; digest: string }> = [];
  const visit = (path: string) => {
    const stat = lstatSync(join(root, path));
    if (stat.isSymbolicLink())
      throw new Error(`Release input cannot be a symlink: ${path}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(join(root, path)).sort())
        visit(join(path, name));
    } else if (path !== RELEASE_BINDING_METADATA_PATH) {
      entries.push({
        path: relative(root, join(root, path)),
        digest: sha256Hex(readFileSync(join(root, path))),
      });
    }
  };
  for (const path of RELEASE_INPUT_PATHS) visit(path);
  return sha256Hex(
    canonicalJson(entries.sort((a, b) => a.path.localeCompare(b.path, "en"))),
  );
}
