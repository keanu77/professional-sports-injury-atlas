import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  ACTUAL_RETURN_RETROSPECTIVE_COPY,
  FOLLOW_UP_BLOCK_ATTRIBUTION,
  FOLLOW_UP_EMPTY_COPY,
  FOLLOW_UP_SOURCE_TIER_LABELS,
  pendingFollowUpForBuildMode,
} from "../../src/lib/cases/follow-up-presentation";
import type { CaseFollowUp } from "../../src/lib/contracts/case-follow-up";

const read = (path: string): string =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("Decision 17 follow-up presentation", () => {
  it("freezes the required attribution, empty state, retrospective copy, and visible tier tokens", () => {
    expect(FOLLOW_UP_BLOCK_ATTRIBUTION).toBe(
      "以下內容是第三方報導的整理，不是本站醫師的診斷、評估或建議。",
    );
    expect(FOLLOW_UP_EMPTY_COPY).toBe(
      "查無符合本政策且可逐條引用的紀錄；未據此推定未曾發生。",
    );
    expect(ACTUAL_RETURN_RETROSPECTIVE_COPY).toContain("已發生的參賽事實");
    for (const token of [
      "team-or-league-official",
      "mainstream-media-report",
      "unverified-report",
    ] as const) {
      expect(FOLLOW_UP_SOURCE_TIER_LABELS[token]).toContain(token);
    }
    expect(FOLLOW_UP_SOURCE_TIER_LABELS["unverified-report"]).toContain(
      "不可視為已確認",
    );
  });

  it("returns pending drafts only for review builds", () => {
    const fixture = { caseId: "CASE-FIC-2014-901" } as CaseFollowUp;
    expect(pendingFollowUpForBuildMode("review", fixture)).toBe(fixture);
    expect(pendingFollowUpForBuildMode("public", fixture)).toBeNull();
  });

  it("keeps the renderer server-only with separate approved and pending DOM markers", () => {
    const component = read("src/components/cases/FollowUpReports.astro");
    expect(component).toContain('data-follow-up-lineage="approved-core"');
    expect(component).toContain("data-follow-up-pending");
    expect(component).toContain('data-review-status="pending-owner-signoff"');
    expect(component).toContain("data-follow-up-empty");
    expect(component).toContain("data-actual-return-disclaimer");
    expect(component).toContain('context="follow-up"');
    expect(component).toContain(
      "pendingFollowUpForBuildMode(buildMode, followUp)",
    );
    expect(component).not.toMatch(/client:|<script\b/iu);
  });

  it("uses the central citation sink and keeps the fictional unverified NBA target out of attributes in the fixture source", () => {
    const fixtureRoute = read("src/pages/review/fixtures/[fixture].astro");
    const citation = read(
      "src/components/citations/ExternalSourceCitation.astro",
    );
    expect(fixtureRoute).toContain('sourceTier: "unverified-report"');
    expect(fixtureRoute).toContain(
      "https://www.nba.com/news/fictional-unverified-treatment-901",
    );
    expect(citation).toContain(
      'context: "follow-up" | "source-list" | "video"',
    );
    expect(citation).toContain("externalUrlPresentationFor(url)");
    expect(citation).toContain('<span class="citation-url" data-citation-url>');
  });
});
