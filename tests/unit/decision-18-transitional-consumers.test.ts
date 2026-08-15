import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string): string =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("Decision 18 transitional follow-up consumers", () => {
  it.each([
    "src/pages/cases/[slug].astro",
    "scripts/check-content.ts",
    "scripts/verify-decision-17-follow-up-dom.ts",
    "scripts/verify-decision-17-c-digests.ts",
  ])("uses the fail-closed transitional corpus in %s", (path) => {
    const source = read(path);
    expect(source).toContain("loadDecision18TransitionalFollowUpCorpus");
    expect(source).not.toMatch(/\bloadFollowUpCorpus\b/u);
  });
});
