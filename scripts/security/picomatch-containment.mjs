/** Local containment for GHSA-fc5q-39xc-vjpf. Does not waive npm audit. */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const parserAnchor = "  const extglobOpen = (type, value) => {\n";
export const containmentGuard = [
  "    // ATLAS: local containment, not an upstream security release.",
  "    if (type === 'plus' || type === 'star') {",
  "      const error = new SyntaxError('Repeated extglobs are disabled by the atlas security policy');",
  "      error.code = 'ATLAS_REPEATED_EXTGLOB_DISABLED';",
  "      throw error;",
  "    }",
  "",
].join("\n");
export const regexAnchor = "  const opts = { ...options };\n";
export const containmentRegexGuard =
  "  // ATLAS: force regex:false to contain the tested regex repetition paths.\n  opts.regex = false;\n";
export const containmentManifest = JSON.parse(
  readFileSync(
    new URL("./picomatch-containment.json", import.meta.url),
    "utf8",
  ),
);
const digest = (value) => createHash("sha256").update(value).digest("hex");

export function containParser(source) {
  const parts = source.split(parserAnchor);
  if (parts.length !== 2)
    throw new Error("Unexpected picomatch parser structure");
  if (source.split(regexAnchor).length !== 3)
    throw new Error("Unexpected picomatch option initialization");
  return (parts[0] + parserAnchor + containmentGuard + parts[1]).replaceAll(
    regexAnchor,
    regexAnchor + containmentRegexGuard,
  );
}

function regularFile(root, path) {
  const full = resolve(root, path);
  const rel = relative(root, full);
  if (rel.startsWith("..") || rel === "")
    throw new Error("Package path outside project");
  let current = root;
  for (const part of rel.split("/")) {
    current = join(current, part);
    if (lstatSync(current).isSymbolicLink())
      throw new Error(`Symbolic package path: ${path}`);
  }
  if (!lstatSync(full).isFile())
    throw new Error(`Expected package file: ${path}`);
  return full;
}

function installedPaths(root) {
  const found = [];
  const visitPackage = (path) => {
    if (lstatSync(path).isSymbolicLink())
      throw new Error(
        "Linked dependencies require a separate containment review",
      );
    if (!lstatSync(path).isDirectory()) return;
    if (
      JSON.parse(
        readFileSync(
          regularFile(root, relative(root, join(path, "package.json"))),
          "utf8",
        ),
      ).name === "picomatch"
    )
      found.push(relative(root, path));
    if (existsSync(join(path, "node_modules")))
      visitModules(join(path, "node_modules"));
  };
  const visitModules = (path) => {
    if (lstatSync(path).isSymbolicLink())
      throw new Error("Linked node_modules is unsupported");
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = join(path, entry.name);
      if (entry.name.startsWith("@")) {
        if (lstatSync(full).isSymbolicLink())
          throw new Error("Linked dependency scope is unsupported");
        for (const child of readdirSync(full)) visitPackage(join(full, child));
      } else visitPackage(full);
    }
  };
  visitModules(join(root, "node_modules"));
  return found.sort();
}

export function containPicomatch(
  projectRoot = process.cwd(),
  { apply = false } = {},
) {
  const root = realpathSync(projectRoot);
  const lock = JSON.parse(
    readFileSync(join(root, "package-lock.json"), "utf8"),
  );
  if (lock.lockfileVersion !== 3 || !lock.packages)
    throw new Error("Expected npm lockfile v3");
  const entries = Object.entries(lock.packages).filter(
    ([path, item]) => path.endsWith("/picomatch") || item.name === "picomatch",
  );
  if (entries.length === 0)
    throw new Error(
      "No locked picomatch; review and retire containment explicitly",
    );
  const expectedPaths = entries.map(([path]) => path).sort();
  if (JSON.stringify(installedPaths(root)) !== JSON.stringify(expectedPaths))
    throw new Error("Installed picomatch copies differ from the lockfile");
  // Validate every copy before any write. Unknown upstream bytes/versions are never patched heuristically.
  const copies = entries.map(([path, item]) => {
    const approved = containmentManifest.versions[item.version];
    if (
      !approved ||
      item.integrity !== approved.integrity ||
      item.resolved !== approved.resolved
    )
      throw new Error(`Unreviewed picomatch package: ${path}`);
    const pkg = JSON.parse(
      readFileSync(regularFile(root, `${path}/package.json`), "utf8"),
    );
    if (pkg.name !== "picomatch" || pkg.version !== item.version)
      throw new Error(`Package identity mismatch: ${path}`);
    const file = regularFile(root, `${path}/lib/parse.js`);
    const source = readFileSync(file, "utf8");
    const hash = digest(source);
    const patched = hash === approved.containedSha256;
    if (!patched && hash !== approved.upstreamSha256)
      throw new Error(`Unexpected parser bytes: ${path}`);
    if (!patched && !apply)
      throw new Error(
        `Missing local picomatch containment: ${path}; run npm run security:containment:apply`,
      );
    const target = patched ? source : containParser(source);
    if (digest(target) !== approved.containedSha256)
      throw new Error(`Containment digest mismatch: ${path}`);
    return {
      path,
      version: item.version,
      file,
      patched,
      target,
      sha256: approved.containedSha256,
    };
  });
  for (const copy of copies) {
    if (copy.patched) continue;
    const temp = join(
      dirname(copy.file),
      `.atlas-containment-${randomUUID()}.tmp`,
    );
    try {
      writeFileSync(temp, copy.target, { flag: "wx", mode: 0o644 });
      renameSync(temp, copy.file);
    } finally {
      if (existsSync(temp)) unlinkSync(temp);
    }
    if (digest(readFileSync(copy.file)) !== copy.sha256)
      throw new Error(`Containment verification failed: ${copy.path}`);
  }
  return {
    schemaVersion: 1,
    advisory: containmentManifest.advisory,
    state: "locally-contained-not-upstream-fixed",
    copies: copies.map(({ path, version, sha256 }) => ({
      path,
      version,
      sha256,
    })),
    auditWaiver: false,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (
    process.argv.length !== 3 ||
    !["--apply", "--check"].includes(process.argv[2])
  )
    throw new Error("Use --apply or --check");
  const output = resolve("artifacts/dependency-security");
  mkdirSync(output, { recursive: true });
  let report;
  try {
    report = containPicomatch(process.cwd(), {
      apply: process.argv[2] === "--apply",
    });
  } catch (error) {
    report = {
      schemaVersion: 1,
      state: "containment-check-failed",
      auditWaiver: false,
    };
    console.error(
      error instanceof Error ? error.message : "Containment failed",
    );
    process.exitCode = 1;
  }
  writeFileSync(
    join(output, "containment.json"),
    JSON.stringify(
      { ...report, checkedAt: new Date().toISOString() },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
}
