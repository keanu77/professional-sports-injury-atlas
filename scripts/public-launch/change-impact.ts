/** Describe changed inputs; never substitute this report for approval. */
import { execFileSync } from "node:child_process";
import {
  lstatSync,
  readdirSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { canonicalJson, sha256Hex } from "../../src/lib/contracts/canonical";
import {
  inputTreeDigest,
  RELEASE_INPUT_PATHS,
  isReleaseInputPath,
} from "./input-tree";

export function inputImpact(path: string): string {
  if (/^(package(?:-lock)?\.json)$/.test(path)) return "dependencies";
  if (/^(functions\/|migrations\/|wrangler\.jsonc)/.test(path))
    return "service-security";
  if (/^src\/(content\/|data\/(patient-|taxonomy\/|video-learning))/.test(path))
    return "clinical-content";
  if (/^src\/data\/videos\/event-/.test(path)) return "attributed-reports";
  if (
    /^src\/(assets\/|data\/(videos\/|video-content-types|player-photo))/.test(
      path,
    )
  )
    return "media-sources";
  if (/^(scripts\/|src\/lib\/governance\/)/.test(path))
    return "verification-tooling";
  return "interface-and-other-inputs";
}

export function changeImpact(root: string, base: string) {
  if (!/^[a-f0-9]{7,40}$/.test(base))
    throw new Error("Use an explicit base commit SHA");
  const git = (args: string[]) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" });
  const changed = new Set(
    [
      ...git(["diff", "--name-only", "-z", base, "--"]).split("\0"),
      ...git(["ls-files", "--others", "--exclude-standard", "-z"]).split("\0"),
    ].filter((path) => path && isReleaseInputPath(path)),
  );
  const groups: Record<string, Array<{ path: string; digest: string }>> = {};
  function visit(path: string) {
    const stat = lstatSync(join(root, path));
    if (stat.isSymbolicLink())
      throw new Error("Release input cannot be a symlink");
    if (stat.isDirectory())
      for (const name of readdirSync(join(root, path)).sort())
        visit(join(path, name));
    else if (isReleaseInputPath(path))
      (groups[inputImpact(path)] ??= []).push({
        path,
        digest: sha256Hex(readFileSync(join(root, path))),
      });
  }
  RELEASE_INPUT_PATHS.forEach(visit);
  return {
    schemaVersion: 1,
    baseCommit: git(["rev-parse", base]).trim(),
    sourceCommit: git(["rev-parse", "HEAD"]).trim(),
    sourceDirty: git(["status", "--porcelain"]).trim().length > 0,
    inputTreeDigest: inputTreeDigest(root),
    approvalGranted: false,
    changedInputs: [...changed]
      .sort()
      .map((path) => ({ path, category: inputImpact(path) })),
    groups: Object.fromEntries(
      Object.entries(groups)
        .sort()
        .map(([key, files]) => [
          key,
          {
            digest: sha256Hex(
              canonicalJson(
                files.sort((a, b) => a.path.localeCompare(b.path, "en")),
              ),
            ),
            fileCount: files.length,
            changedCount: [...changed].filter(
              (path) => inputImpact(path) === key,
            ).length,
          },
        ]),
    ),
    requiredChecks: [
      "current type/unit/browser checks",
      "review affected claims and sources",
      "refresh affected media evidence",
      "unchanged full release gates and exact input binding",
    ],
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const report = changeImpact(
    process.cwd(),
    process.argv[2] ??
      execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  );
  const directory = "output/site-quality-validation";
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, "change-impact.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      changedInputs: report.changedInputs.length,
      groups: report.groups,
      approvalGranted: false,
    }),
  );
}
