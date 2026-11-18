import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  containPicomatch,
  containmentGuard,
  containmentRegexGuard,
  containmentManifest,
} from "../../scripts/security/picomatch-containment.mjs";

const paths = [
  "node_modules/picomatch",
  "node_modules/anymatch/node_modules/picomatch",
];
const versions = ["4.0.7", "2.3.2"];
function fixture(run: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), "atlas-picomatch-"));
  try {
    const packages: Record<string, unknown> = {};
    for (const [index, path] of paths.entries()) {
      const version = versions[index]!;
      const record = containmentManifest.versions[version];
      packages[path] = {
        version,
        resolved: record.resolved,
        integrity: record.integrity,
      };
      const parser = join(root, path, "lib/parse.js");
      mkdirSync(dirname(parser), { recursive: true });
      writeFileSync(
        join(root, path, "package.json"),
        JSON.stringify({ name: "picomatch", version }),
      );
      writeFileSync(
        parser,
        readFileSync(join(path, "lib/parse.js"), "utf8")
          .replace(containmentGuard, "")
          .split(containmentRegexGuard)
          .join(""),
      );
    }
    writeFileSync(
      join(root, "node_modules/anymatch/package.json"),
      JSON.stringify({ name: "anymatch" }),
    );
    writeFileSync(
      join(root, "package-lock.json"),
      JSON.stringify({ lockfileVersion: 3, packages }),
    );
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("verified local picomatch containment", () => {
  it("invalidates a stale successful receipt when verification fails", () =>
    fixture((root) => {
      const output = join(
        root,
        "artifacts/dependency-security/containment.json",
      );
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(
        output,
        JSON.stringify({ state: "locally-contained-not-upstream-fixed" }),
      );
      const result = spawnSync(
        process.execPath,
        [resolve("scripts/security/picomatch-containment.mjs"), "--check"],
        { cwd: root, encoding: "utf8" },
      );
      expect(result.status).toBe(1);
      expect(JSON.parse(readFileSync(output, "utf8"))).toMatchObject({
        state: "containment-check-failed",
        auditWaiver: false,
      });
    }));
  it("applies to both locked copies, is idempotent, and never grants an audit waiver", () =>
    fixture((root) => {
      expect(() => containPicomatch(root)).toThrow(/Missing local/);
      const applied = containPicomatch(root, { apply: true });
      expect(applied.copies).toHaveLength(2);
      expect(applied.auditWaiver).toBe(false);
      const bytes = paths.map((path) =>
        readFileSync(join(root, path, "lib/parse.js"), "utf8"),
      );
      expect(containPicomatch(root)).toEqual(applied);
      expect(containPicomatch(root, { apply: true })).toEqual(applied);
      expect(
        paths.map((path) =>
          readFileSync(join(root, path, "lib/parse.js"), "utf8"),
        ),
      ).toEqual(bytes);
    }));
  it("rejects unknown bytes before modifying any copy", () =>
    fixture((root) => {
      const untouched = join(root, paths[0]!, "lib/parse.js");
      const before = readFileSync(untouched, "utf8");
      writeFileSync(join(root, paths[1]!, "lib/parse.js"), "unreviewed source");
      expect(() => containPicomatch(root, { apply: true })).toThrow(
        /Unexpected parser bytes/,
      );
      expect(readFileSync(untouched, "utf8")).toBe(before);
    }));
  it.each(["version", "integrity", "resolved"])(
    "rejects an unreviewed lock %s",
    (field) =>
      fixture((root) => {
        const file = join(root, "package-lock.json");
        const lock = JSON.parse(readFileSync(file, "utf8"));
        lock.packages[paths[0]!][field] = "changed";
        writeFileSync(file, JSON.stringify(lock));
        expect(() => containPicomatch(root, { apply: true })).toThrow(
          /Unreviewed/,
        );
      }),
  );
  it("rejects a missing nested copy and an unexpected installed copy", () =>
    fixture((root) => {
      rmSync(join(root, paths[1]!), { recursive: true });
      expect(() => containPicomatch(root, { apply: true })).toThrow(
        /differ from the lockfile/,
      );
      const extra = join(root, "node_modules/untracked");
      mkdirSync(extra);
      writeFileSync(
        join(extra, "package.json"),
        JSON.stringify({ name: "picomatch", version: "4.0.7" }),
      );
      expect(() => containPicomatch(root, { apply: true })).toThrow(
        /differ from the lockfile/,
      );
    }));
  it("rejects symbolic package files without touching their targets", () =>
    fixture((root) => {
      const file = join(root, paths[0]!, "lib/parse.js");
      const original = readFileSync(file, "utf8");
      const target = join(root, "target.js");
      writeFileSync(target, original);
      rmSync(file);
      symlinkSync(target, file);
      expect(() => containPicomatch(root, { apply: true })).toThrow(
        /Symbolic package path/,
      );
      expect(readFileSync(target, "utf8")).toBe(original);
    }));
  it("requires install and execution checks without weakening the upstream release gate", () => {
    const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));
    expect(scripts.postinstall).toBe(
      "node scripts/security/picomatch-containment.mjs --apply",
    );
    for (const name of [
      "pretest:unit",
      "precheck",
      "prebuild:review",
      "prebuild:public-preview",
      "prerelease:public",
      "prerelease:legacy",
    ])
      expect(scripts[name]).toBe("npm run security:containment:check");
    expect(
      scripts["release:public"].startsWith("npm run security:check && "),
    ).toBe(true);
  });
});

describe("isolated parser regressions with a hard timeout", () => {
  for (const [index, path] of paths.entries()) {
    it(`contains ${versions[index]} through all glob-to-regex entry points and option variants`, () => {
      const script = `
        const assert = require('node:assert/strict');
        const pm = require(process.argv[1]);
        const patterns = ['+(*a)', '*(*a)', '+(*)b', '*(*)b', 'a/+(*a)b', '!(*(*a))', '@(+(*a)|safe)', '+(a|aa)', '+(*(a))', '+(a)', '*(a)'];
        const options = [{}, {fastpaths:false}, {maxExtglobRecursion:false}, {capture:true}, {bash:true}, {windows:true}, {regex:false}];
        let rejected = 0;
        for (const pattern of patterns) for (const opts of options) {
          for (const call of [() => pm.isMatch('a'.repeat(1000)+'!',pattern,opts), () => pm.makeRe(pattern,opts), () => pm.parse(pattern,opts), () => pm([pattern],opts)]) {
            assert.throws(call, error => error.code === 'ATLAS_REPEATED_EXTGLOB_DISABLED'); rejected++;
          }
        }
        for (const opts of [{noext:true}, {noextglob:true}]) {
          pm.isMatch('a'.repeat(1000)+'!', '+(*a)', opts);
        }
        for (const pattern of ['(a+)+', '@(a+)+']) for (const opts of [{}, {regex:true}, {fastpaths:false,regex:true}]) {
          assert.equal(pm.isMatch('a'.repeat(1000)+'!', pattern, opts), false);
        }
        for (const [file,pattern,expected] of [
          ['src/content/case.json','**/*.json',true],
          ['src/page.ts','**/*.{ts,tsx}',true],
          ['src/page.js','**/*.{ts,tsx}',false],
          ['src/lib/page.ts','@(src|tests)/**/*.ts',true],
          ['src/page.ts','**/!(*.d).ts',true],
          ['src/page.d.ts','**/!(*.d).ts',false]
        ]) assert.equal(pm.isMatch(file,pattern),expected);
        console.log(JSON.stringify({rejected,ordinaryPatterns:6,noextOptions:2}));
      `;
      const result = spawnSync(
        process.execPath,
        ["-e", script, resolve(path)],
        { encoding: "utf8", timeout: 2000, maxBuffer: 4096 },
      );
      expect(result.error, result.stderr).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({
        rejected: 308,
        ordinaryPatterns: 6,
        noextOptions: 2,
      });
    });
  }
});
