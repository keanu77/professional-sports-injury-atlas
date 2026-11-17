import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { sha256Hex } from "../../src/lib/contracts/canonical";
import {
  publicInventoryDigest,
  type PublicInventoryEntry,
} from "../../src/lib/videos/public-inventory";
import {
  CURRENT_PLAYBACK_REGISTRY,
  loadCurrentPlaybackRegistry,
  readPlaybackEvidenceFile,
} from "../../scripts/public-launch/current-playback";
import { inputTreeDigest } from "../../scripts/public-launch/input-tree";

const now = new Date("2026-11-18T12:00:00Z");
const inventory: PublicInventoryEntry[] = [
  {
    slug: "example",
    path: "/cases/example/",
    provider: "youtube",
    videoUrl: "https://www.youtube.com/watch?v=8TIJGIRP634",
    startSeconds: 0,
    durationSeconds: 60,
    captionRequired: true,
    sourceUrls: [],
    references: [],
  },
];
const roots: string[] = [];
const origin = "https://current.sports-injury-atlas.pages.dev";
const receiptPath = "docs/reviews/current/receipts.json";
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "atlas-current-playback-"));
  roots.push(root);
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const write = (path: string, content: string) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  };
  for (const dir of ["src", "public", "scripts", "functions", "migrations"])
    write(`${dir}/.keep`, "fixture");
  for (const path of [
    "astro.config.mjs",
    "package.json",
    "package-lock.json",
    "wrangler.jsonc",
  ])
    write(path, "{}");
  git("init", "-b", "main");
  git("config", "user.name", "Playback Test");
  git("config", "user.email", "playback-fixture@example.org");
  git("add", "--", ".");
  git("commit", "-m", "Application inputs");
  const sourceCommit = git("rev-parse", "HEAD");
  const receipt = {
    url: inventory[0]!.videoUrl,
    path: inventory[0]!.path,
    origin,
    startSeconds: 0,
    sourceCommit,
    sourceDirty: false,
    deploymentCommit: sourceCommit,
    catalogDigest: publicInventoryDigest(inventory),
    checkedAt: "2026-11-18T01:00:00Z",
    status: "played",
    before: { time: 0, paused: true, readyState: 3 },
    after: { time: 2, paused: false, readyState: 4 },
    captionsEnabled: true,
  };
  write(receiptPath, JSON.stringify([receipt]));
  const registry = {
    schemaVersion: 1,
    status: "ready",
    sourceCommit,
    inputTreeDigest: inputTreeDigest(root),
    catalogDigest: publicInventoryDigest(inventory),
    origin,
    receiptFiles: [
      {
        path: receiptPath,
        sha256: sha256Hex(readFileSync(join(root, receiptPath))),
      },
    ],
  };
  const save = () => write(CURRENT_PLAYBACK_REGISTRY, JSON.stringify(registry));
  save();
  const load = () => loadCurrentPlaybackRegistry(root, { inventory, now });
  return { root, git, write, receipt, registry, save, load, sourceCommit };
}
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

describe("current playback release registry", () => {
  it("accepts receipts committed after the tested application commit without a SHA loop", () => {
    const f = fixture();
    f.git("add", "--", "docs");
    f.git("commit", "-m", "Record browser evidence only");
    expect(f.git("rev-parse", "HEAD")).not.toBe(f.sourceCommit);
    expect(f.load()?.proofsByPath.size).toBe(inventory.length);
    expect(f.load()?.sourceCommit).toBe(f.sourceCommit);
  });
  it("permits binding metadata changes without changing the actual input scope", () => {
    const f = fixture();
    f.write(
      "src/data/public-launch.v1.json",
      '{"testOnly":"binding metadata"}',
    );
    f.git("add", "--", ".");
    f.git("commit", "-m", "Evidence and binding metadata only");
    expect(inputTreeDigest(f.root)).toBe(f.registry.inputTreeDigest);
    expect(f.load()?.proofsByPath.size).toBe(1);
  });
  it("only returns legacy mode for an absent registry; pending is a hard rejection", () => {
    const f = fixture();
    f.write(
      CURRENT_PLAYBACK_REGISTRY,
      JSON.stringify({
        schemaVersion: 1,
        status: "pending",
        sourceCommit: null,
        inputTreeDigest: null,
        catalogDigest: null,
        origin: null,
        receiptFiles: [],
      }),
    );
    expect(f.load).toThrow("registry is pending");
    unlinkSync(join(f.root, CURRENT_PLAYBACK_REGISTRY));
    expect(f.load()).toBeNull();
  });
  it("rejects code changes even if someone refreshes the manifest digest", () => {
    const f = fixture();
    f.write("package-lock.json", '{"changed":true}');
    f.git("add", "--", ".");
    f.git("commit", "-m", "Change application inputs after playback");
    f.registry.inputTreeDigest = inputTreeDigest(f.root);
    f.save();
    expect(f.load).toThrow("inputs differ from playback source commit");
  });
  it.each(["src/new.ts", "scripts/new.ts", "functions/api.ts"])(
    "rejects uncommitted inputs: %s",
    (path) => {
      const f = fixture();
      f.write(path, "export const changed = true;");
      f.registry.inputTreeDigest = inputTreeDigest(f.root);
      f.save();
      expect(f.load).toThrow("inputs differ from playback source commit");
    },
  );
  it("rejects an existing commit from a non-ancestor branch", () => {
    const f = fixture();
    f.git("switch", "-c", "another-preview");
    f.write("docs/another.txt", "another preview");
    f.git("add", "--", "docs");
    f.git("commit", "-m", "Other preview");
    const other = f.git("rev-parse", "HEAD");
    f.git("switch", "main");
    f.write(
      receiptPath,
      JSON.stringify([
        { ...f.receipt, sourceCommit: other, deploymentCommit: other },
      ]),
    );
    f.registry.sourceCommit = other;
    f.registry.receiptFiles[0]!.sha256 = sha256Hex(
      readFileSync(join(f.root, receiptPath)),
    );
    f.save();
    expect(f.load).toThrow("ancestor of HEAD");
  });
  it("requires both exact input and catalog digests", () => {
    const f = fixture();
    f.registry.inputTreeDigest = "a".repeat(64);
    f.save();
    expect(f.load).toThrow("input-tree digest mismatch");
    f.registry.inputTreeDigest = inputTreeDigest(f.root);
    f.registry.catalogDigest = "c".repeat(64);
    f.save();
    expect(f.load).toThrow("catalog digest mismatch");
  });
  it("rejects changed receipts and latest failed attempts, with no legacy fallback", () => {
    const f = fixture();
    f.write(
      receiptPath,
      JSON.stringify([
        f.receipt,
        {
          ...f.receipt,
          status: "unverified",
          error: "Timed out",
          checkedAt: "2026-11-18T02:00:00Z",
        },
      ]),
    );
    expect(f.load).toThrow("receipt digest mismatch");
    f.registry.receiptFiles[0]!.sha256 = sha256Hex(
      readFileSync(join(f.root, receiptPath)),
    );
    f.save();
    expect(f.load).toThrow("latest-attempt-not-played");
  });
  it("fails if even one public page lacks a current receipt", () => {
    const f = fixture();
    const more = [
      ...inventory,
      { ...inventory[0]!, slug: "second", path: "/videos/second/" },
    ];
    f.registry.catalogDigest = publicInventoryDigest(more);
    f.write(
      receiptPath,
      JSON.stringify([
        { ...f.receipt, catalogDigest: f.registry.catalogDigest },
      ]),
    );
    f.registry.receiptFiles[0]!.sha256 = sha256Hex(
      readFileSync(join(f.root, receiptPath)),
    );
    f.save();
    expect(() =>
      loadCurrentPlaybackRegistry(f.root, { inventory: more, now }),
    ).toThrow("/videos/second/");
  });
  it("rejects traversal, duplicate files and symlink files/directories", () => {
    const f = fixture();
    f.registry.receiptFiles[0]!.path = "docs/reviews/../outside.json";
    f.save();
    expect(f.load).toThrow("under docs/reviews");
    f.registry.receiptFiles[0]!.path = receiptPath;
    f.registry.receiptFiles.push({ ...f.registry.receiptFiles[0]! });
    f.save();
    expect(f.load).toThrow("Duplicate playback receipt file");
    f.registry.receiptFiles.pop();
    symlinkSync(
      join(f.root, receiptPath),
      join(f.root, "docs/reviews/linked.json"),
    );
    f.registry.receiptFiles[0]!.path = "docs/reviews/linked.json";
    f.save();
    expect(f.load).toThrow("symlinks");
    symlinkSync(
      join(f.root, "docs/reviews/current"),
      join(f.root, "docs/reviews/linked-dir"),
    );
    f.registry.receiptFiles[0]!.path = "docs/reviews/linked-dir/receipts.json";
    f.save();
    expect(f.load).toThrow("symlinks");
  });
  it("rejects oversized JSON and dangling registry links", () => {
    const f = fixture();
    expect(() => readPlaybackEvidenceFile(f.root, receiptPath, 8)).toThrow(
      "oversized",
    );
    unlinkSync(join(f.root, CURRENT_PLAYBACK_REGISTRY));
    symlinkSync(
      join(f.root, "missing.json"),
      join(f.root, CURRENT_PLAYBACK_REGISTRY),
    );
    expect(f.load).toThrow("symlinks");
  });
});
