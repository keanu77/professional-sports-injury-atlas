import { readdirSync, readFileSync, lstatSync } from "node:fs";
import { join, relative } from "node:path";
import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";

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
    } else if (path !== "src/data/public-launch.v1.json") {
      entries.push({
        path: relative(root, join(root, path)),
        digest: sha256Hex(readFileSync(join(root, path))),
      });
    }
  };
  for (const path of [
    "src",
    "public",
    "astro.config.mjs",
    "package.json",
    "package-lock.json",
    "scripts",
    "functions",
    "migrations",
    "wrangler.jsonc",
  ])
    visit(path);
  return sha256Hex(
    canonicalJson(entries.sort((a, b) => a.path.localeCompare(b.path, "en"))),
  );
}
