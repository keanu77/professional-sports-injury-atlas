import {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  launchApprovalSchema,
  launchApproval,
  launchCaseAllowed,
} from "../../src/lib/patient/public-launch";
import { selectPublicCases } from "../../src/lib/cases/selectors";
import { caseSchema } from "../../src/lib/contracts/case";
import { inputTreeDigest } from "../../scripts/public-launch/input-tree";

const record = caseSchema.parse(
  JSON.parse(
    readFileSync(
      "src/content/cases/anfernee-simons-ankle-sprain-2023.json",
      "utf8",
    ),
  ),
);
afterEach(() => vi.unstubAllEnvs());
describe("Decision 21 public scope", () => {
  it("requires explicit scope and rejects unapproved or empty release decisions", () => {
    expect(launchApprovalSchema.safeParse(launchApproval).success).toBe(true);
    expect(
      launchApprovalSchema.safeParse({ ...launchApproval, status: "pending" })
        .success,
    ).toBe(false);
    expect(
      launchApprovalSchema.safeParse({ ...launchApproval, cases: [] }).success,
    ).toBe(false);
  });
  it("preserves the historical rights gate unless the successor protocol is selected", () => {
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "");
    expect(selectPublicCases([record])).toEqual([]);
    vi.stubEnv("ATLAS_PUBLIC_LAUNCH", "decision-21");
    expect(selectPublicCases([record])).toEqual([record]);
    const unapproved = structuredClone(record);
    unapproved.status = "medical-review";
    expect(selectPublicCases([unapproved])).toEqual([]);
  });
  it("invalidates a changed source, medical statement, caption state or unlisted case", () => {
    expect(launchCaseAllowed(record)).toBe(true);
    for (const change of [
      (r: typeof record) => {
        r.video.canonicalUrl = "https://www.youtube.com/watch?v=other";
      },
      (r: typeof record) => {
        r.general.confirmedUpdate = "Changed diagnosis";
      },
      (r: typeof record) => {
        r.video.captionStatus = "unavailable";
      },
      (r: typeof record) => {
        r.id = "UNREVIEWED";
      },
    ]) {
      const changed = structuredClone(record);
      change(changed);
      expect(launchCaseAllowed(changed)).toBe(false);
    }
  });
  it("binds newly added and modified rendering inputs while excluding its own manifest", () => {
    const root = mkdtempSync(join(tmpdir(), "atlas-launch-tree-"));
    try {
      for (const p of ["src/data", "public", "scripts/public-launch"])
        mkdirSync(join(root, p), { recursive: true });
      for (const p of [
        "astro.config.mjs",
        "package.json",
        "package-lock.json",
        "src/data/public-launch.v1.json",
      ])
        writeFileSync(join(root, p), "{}");
      const initial = inputTreeDigest(root);
      writeFileSync(
        join(root, "src/data/public-launch.v1.json"),
        "manifest updated",
      );
      expect(inputTreeDigest(root)).toBe(initial);
      writeFileSync(join(root, "src/new.astro"), "unreviewed");
      expect(inputTreeDigest(root)).not.toBe(initial);
      rmSync(join(root, "src/new.astro"));
      writeFileSync(join(root, "astro.config.mjs"), "changed renderer");
      expect(inputTreeDigest(root)).not.toBe(initial);
    } finally {
      rmSync(root, { recursive: true });
    }
  });
});
