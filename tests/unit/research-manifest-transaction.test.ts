import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
  parseSourceManifestRegistryBytes,
} from "../../src/lib/contracts/source-manifest-registry";
import { sha256Hex } from "../../src/lib/contracts/canonical";
import { checkCandidateManifest } from "../../scripts/research/check-candidate-manifest";
import { digestCandidateManifestFile } from "../../scripts/research/digest-candidate-manifest";
import {
  MANIFEST_PATH,
  REGISTRY_LOCK_PATH,
  REGISTRY_PATH,
  REGISTRY_TEMP_DIRECTORY,
  ManifestGenerationCrash,
  generateCandidateManifest,
  type ManifestGenerationFaultPoint,
} from "../../scripts/research/generate-candidate-manifest";
import { checkSourceManifestRegistry } from "../../scripts/research/check-source-manifest-registry";

const REPOSITORY_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const VALIDATION_NOW = "2026-08-08T00:00:00Z";
const TRANSACTION_NOW = "2026-08-08T00:01:00Z";
const roots: string[] = [];
let transactionSequence = 0;

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "atlas-manifest-transaction-"));
  roots.push(root);
  cpSync(join(REPOSITORY_ROOT, "research"), join(root, "research"), {
    recursive: true,
  });
  rmSync(join(root, "research/source-manifests"), {
    force: true,
    recursive: true,
  });
  rmSync(join(root, REGISTRY_TEMP_DIRECTORY), {
    force: true,
    recursive: true,
  });
  rmSync(join(root, REGISTRY_LOCK_PATH), { force: true });
  writeFileSync(
    join(root, REGISTRY_PATH),
    EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES,
  );
  return root;
}

function options(
  overrides: Record<string, unknown> = {},
): Parameters<typeof generateCandidateManifest>[1] {
  return {
    randomId: () => (++transactionSequence).toString(16).padStart(32, "0"),
    transactionNow: () => TRANSACTION_NOW,
    validationNow: VALIDATION_NOW,
    ...overrides,
  };
}

function registryBytes(root: string): string {
  return readFileSync(join(root, REGISTRY_PATH), "utf8");
}

function explicitlyClearRetainedLock(root: string): string {
  const path = join(root, REGISTRY_LOCK_PATH);
  const digest = sha256Hex(readFileSync(path));
  expect(digest).toMatch(/^[0-9a-f]{64}$/);
  unlinkSync(path);
  return digest;
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe("candidate-manifest registry transaction", () => {
  it("publishes once and reruns without changing authority bytes", () => {
    const root = fixtureRoot();
    const first = generateCandidateManifest(root, options());
    expect(first.status).toBe("published");
    const manifestBefore = readFileSync(join(root, MANIFEST_PATH));
    const registryBefore = readFileSync(join(root, REGISTRY_PATH));
    const manifestStat = statSync(join(root, MANIFEST_PATH));
    const registryStat = statSync(join(root, REGISTRY_PATH));
    expect(parseSourceManifestRegistryBytes(registryBefore).issues).toEqual([]);
    expect(existsSync(join(root, REGISTRY_LOCK_PATH))).toBe(false);

    const second = generateCandidateManifest(root, options());
    expect(second.status).toBe("already-complete");
    expect(readFileSync(join(root, MANIFEST_PATH))).toEqual(manifestBefore);
    expect(readFileSync(join(root, REGISTRY_PATH))).toEqual(registryBefore);
    expect(statSync(join(root, MANIFEST_PATH)).ino).toBe(manifestStat.ino);
    expect(statSync(join(root, MANIFEST_PATH)).mtimeMs).toBe(
      manifestStat.mtimeMs,
    );
    expect(statSync(join(root, REGISTRY_PATH)).ino).toBe(registryStat.ino);
    expect(statSync(join(root, REGISTRY_PATH)).mtimeMs).toBe(
      registryStat.mtimeMs,
    );
  });

  it("fails before authority reads when another writer owns the lock", () => {
    const root = fixtureRoot();
    mkdirSync(dirname(join(root, REGISTRY_LOCK_PATH)), { recursive: true });
    const retained = '{"owner":"other-writer"}';
    writeFileSync(join(root, REGISTRY_LOCK_PATH), retained);
    let authorityReads = 0;

    expect(() =>
      generateCandidateManifest(
        root,
        options({ onAuthorityRead: () => (authorityReads += 1) }),
      ),
    ).toThrow(/registry transaction lock already exists/u);
    expect(authorityReads).toBe(0);
    expect(readFileSync(join(root, REGISTRY_LOCK_PATH), "utf8")).toBe(retained);
    expect(registryBytes(root)).toBe(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES);
    expect(existsSync(join(root, MANIFEST_PATH))).toBe(false);
  });

  it("allows exactly one writer through a lock barrier", () => {
    const root = fixtureRoot();
    let loserError: unknown;
    let loserReads = 0;

    const winner = generateCandidateManifest(
      root,
      options({
        afterLockAcquired: () => {
          try {
            generateCandidateManifest(
              root,
              options({
                randomId: () => "b".repeat(32),
                onAuthorityRead: () => (loserReads += 1),
              }),
            );
          } catch (error) {
            loserError = error;
          }
        },
      }),
    );

    expect(winner.status).toBe("published");
    expect(loserError).toBeInstanceOf(Error);
    expect(String(loserError)).toMatch(/lock already exists/u);
    expect(loserReads).toBe(0);
  });

  it.each([
    ["before-manifest-publication", false, false, "published"],
    ["after-manifest-publication", true, false, "adopted-orphan"],
    ["after-registry-replacement", true, true, "already-complete"],
  ] as const)(
    "retains the lock at %s and recovers only after explicit inspection",
    (faultAt, manifestPublished, registryPublished, recoveryStatus) => {
      const root = fixtureRoot();
      expect(() =>
        generateCandidateManifest(root, options({ faultAt })),
      ).toThrow(ManifestGenerationCrash);

      expect(existsSync(join(root, REGISTRY_LOCK_PATH))).toBe(true);
      expect(existsSync(join(root, MANIFEST_PATH))).toBe(manifestPublished);
      expect(registryBytes(root) !== EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES).toBe(
        registryPublished,
      );
      expect(() => generateCandidateManifest(root, options())).toThrow(
        /lock already exists/u,
      );

      explicitlyClearRetainedLock(root);
      const recovered = generateCandidateManifest(root, options());
      expect(recovered.status).toBe(recoveryStatus);
      expect(existsSync(join(root, REGISTRY_LOCK_PATH))).toBe(false);
    },
  );

  it("never adopts a partial or mutated final manifest", () => {
    const root = fixtureRoot();
    mkdirSync(dirname(join(root, MANIFEST_PATH)), { recursive: true });
    writeFileSync(join(root, MANIFEST_PATH), '{"partial":true}');

    expect(() => generateCandidateManifest(root, options())).toThrow(
      /orphan manifest bytes do not match/u,
    );
    expect(readFileSync(join(root, MANIFEST_PATH), "utf8")).toBe(
      '{"partial":true}',
    );
    expect(registryBytes(root)).toBe(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES);
    expect(existsSync(join(root, REGISTRY_LOCK_PATH))).toBe(true);
    explicitlyClearRetainedLock(root);
  });

  it("does not adopt an exact orphan after a bound input changes", () => {
    const root = fixtureRoot();
    expect(() =>
      generateCandidateManifest(
        root,
        options({ faultAt: "after-manifest-publication" }),
      ),
    ).toThrow(ManifestGenerationCrash);
    explicitlyClearRetainedLock(root);
    const policyPath = join(root, "research/source-policy/nba.v2.md");
    writeFileSync(policyPath, `${readFileSync(policyPath, "utf8")}\n`);

    expect(() => generateCandidateManifest(root, options())).toThrow();
    expect(registryBytes(root)).toBe(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES);
    expect(existsSync(join(root, MANIFEST_PATH))).toBe(true);
    expect(existsSync(join(root, REGISTRY_LOCK_PATH))).toBe(true);
    explicitlyClearRetainedLock(root);
  });

  it("rechecks all bound inputs after manifest publication", () => {
    const root = fixtureRoot();
    const decisionPath = join(
      root,
      "research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json",
    );

    expect(() =>
      generateCandidateManifest(
        root,
        options({
          onCheckpoint: (point: ManifestGenerationFaultPoint) => {
            if (point === "after-manifest-publication") {
              writeFileSync(
                decisionPath,
                `${readFileSync(decisionPath, "utf8")}\n`,
              );
            }
          },
        }),
      ),
    ).toThrow(/source-review-decision authority bytes changed/u);
    expect(existsSync(join(root, MANIFEST_PATH))).toBe(true);
    expect(registryBytes(root)).toBe(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES);
    expect(existsSync(join(root, REGISTRY_LOCK_PATH))).toBe(true);
    explicitlyClearRetainedLock(root);
  });

  it("uses hard-link no-clobber publication when a target appears in a race", () => {
    const root = fixtureRoot();
    const racingBytes = '{"racingWriter":true}';

    expect(() =>
      generateCandidateManifest(
        root,
        options({
          onCheckpoint: (point: ManifestGenerationFaultPoint) => {
            if (point === "before-manifest-publication") {
              writeFileSync(join(root, MANIFEST_PATH), racingBytes);
            }
          },
        }),
      ),
    ).toThrow();
    expect(readFileSync(join(root, MANIFEST_PATH), "utf8")).toBe(racingBytes);
    expect(registryBytes(root)).toBe(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES);
    expect(existsSync(join(root, REGISTRY_LOCK_PATH))).toBe(true);
    explicitlyClearRetainedLock(root);
  });

  it("fails closed on completed-manifest digest drift without rewriting", () => {
    const root = fixtureRoot();
    generateCandidateManifest(root, options());
    const registryBefore = registryBytes(root);
    writeFileSync(join(root, MANIFEST_PATH), '{"mutated":true}');

    expect(() => generateCandidateManifest(root, options())).toThrow();
    expect(readFileSync(join(root, MANIFEST_PATH), "utf8")).toBe(
      '{"mutated":true}',
    );
    expect(registryBytes(root)).toBe(registryBefore);
    expect(existsSync(join(root, REGISTRY_LOCK_PATH))).toBe(true);
    explicitlyClearRetainedLock(root);
  });

  it("fsyncs prepared files and authority directories in publication order", () => {
    const root = fixtureRoot();
    const durabilityEvents: string[] = [];
    generateCandidateManifest(
      root,
      options({
        onDurabilityEvent: (event: string) => durabilityEvents.push(event),
      }),
    );

    expect(durabilityEvents).toEqual([
      "lock-file",
      "lock-parent-after-create",
      "manifest-temp-file",
      "registry-temp-file",
      "manifest-target-file",
      "manifest-parent-after-publish",
      "registry-target-file",
      "registry-parent-after-rename",
      "temp-parent-after-cleanup",
      "lock-file-before-remove",
      "lock-parent-after-remove",
    ]);
  });

  it.each([
    ["manifest-target-file", true, false],
    ["registry-target-file", true, true],
  ] as const)(
    "fails closed when durability reporting fails after %s fsync",
    (failureEvent, manifestPublished, registryPublished) => {
      const root = fixtureRoot();
      expect(() =>
        generateCandidateManifest(
          root,
          options({
            onDurabilityEvent: (event: string) => {
              if (event === failureEvent)
                throw new Error("durability spy failure");
            },
          }),
        ),
      ).toThrow(/durability spy failure/u);
      expect(existsSync(join(root, MANIFEST_PATH))).toBe(manifestPublished);
      expect(registryBytes(root) !== EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES).toBe(
        registryPublished,
      );
      expect(existsSync(join(root, REGISTRY_LOCK_PATH))).toBe(true);
      explicitlyClearRetainedLock(root);
    },
  );

  it("reports uncertain completion if durability fails after lock removal", () => {
    const root = fixtureRoot();
    expect(() =>
      generateCandidateManifest(
        root,
        options({
          onDurabilityEvent: (event: string) => {
            if (event === "lock-parent-after-remove") {
              throw new Error("post-unlink directory fsync report failure");
            }
          },
        }),
      ),
    ).toThrow(/lock-parent durability is uncertain/u);
    expect(existsSync(join(root, MANIFEST_PATH))).toBe(true);
    expect(registryBytes(root)).not.toBe(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES);
    expect(existsSync(join(root, REGISTRY_LOCK_PATH))).toBe(false);
    expect(generateCandidateManifest(root, options()).status).toBe(
      "already-complete",
    );
  });

  it("rejects an unsafe transaction identity before creating a lock", () => {
    const root = fixtureRoot();
    expect(() =>
      generateCandidateManifest(root, options({ randomId: () => "../escape" })),
    ).toThrow(/transaction ID/u);
    expect(existsSync(join(root, REGISTRY_LOCK_PATH))).toBe(false);
    expect(registryBytes(root)).toBe(EMPTY_SOURCE_MANIFEST_REGISTRY_BYTES);
  });

  it("ignores crash leftovers that do not match the current transaction ID", () => {
    const root = fixtureRoot();
    const tempDir = join(root, REGISTRY_TEMP_DIRECTORY);
    mkdirSync(tempDir, { recursive: true });
    const foreign = join(tempDir, "foreign-writer.tmp");
    writeFileSync(foreign, "not authority");

    expect(generateCandidateManifest(root, options()).status).toBe("published");
    expect(readFileSync(foreign, "utf8")).toBe("not authority");
    expect(readdirSync(tempDir)).toEqual(["foreign-writer.tmp"]);
  });

  it("keeps all checker and digest operations read-only", () => {
    const root = fixtureRoot();
    generateCandidateManifest(root, options());
    const manifestBefore = readFileSync(join(root, MANIFEST_PATH));
    const registryBefore = readFileSync(join(root, REGISTRY_PATH));
    const manifestStat = statSync(join(root, MANIFEST_PATH));
    const registryStat = statSync(join(root, REGISTRY_PATH));

    expect(checkCandidateManifest(root, VALIDATION_NOW).issues).toEqual([]);
    expect(checkSourceManifestRegistry(root).issues).toEqual([]);
    expect(digestCandidateManifestFile(root, VALIDATION_NOW)).toMatch(
      /^[0-9a-f]{64}$/,
    );

    expect(readFileSync(join(root, MANIFEST_PATH))).toEqual(manifestBefore);
    expect(readFileSync(join(root, REGISTRY_PATH))).toEqual(registryBefore);
    expect(statSync(join(root, MANIFEST_PATH)).mtimeMs).toBe(
      manifestStat.mtimeMs,
    );
    expect(statSync(join(root, REGISTRY_PATH)).mtimeMs).toBe(
      registryStat.mtimeMs,
    );
  });
});

describe("manifest crash fault points", () => {
  it.each([
    "before-manifest-publication",
    "after-manifest-publication",
    "after-registry-replacement",
  ] satisfies ManifestGenerationFaultPoint[])("recognizes %s", (faultAt) => {
    expect(faultAt).toBeTypeOf("string");
  });
});
