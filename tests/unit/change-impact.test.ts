import { expect, it } from "vitest";
import { inputImpact } from "../../scripts/public-launch/change-impact";
import { isReleaseInputPath } from "../../scripts/public-launch/input-tree";

it("distinguishes maintenance scope without granting or narrowing release approval", () => {
  expect(inputImpact("package-lock.json")).toBe("dependencies");
  expect(inputImpact("src/content/cases/case.json")).toBe("clinical-content");
  expect(inputImpact("src/data/videos/event-catalog-200.v1.json")).toBe(
    "attributed-reports",
  );
  expect(inputImpact("functions/api/contributions.ts")).toBe(
    "service-security",
  );
  expect(inputImpact("src/data/videos/catalog-200.v1.json")).toBe(
    "media-sources",
  );
  expect(isReleaseInputPath("src/data/videos/new-case.json")).toBe(true);
  expect(isReleaseInputPath("docs/reviews/receipt.json")).toBe(false);
  expect(isReleaseInputPath("src/data/public-launch.v1.json")).toBe(false);
});
