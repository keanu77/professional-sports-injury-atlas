import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string): string =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const disclosure = read("src/components/cases/ReviewDigestDisclosure.astro");
const caseRoute = read("src/pages/cases/[slug].astro");
const followUpReports = read("src/components/cases/FollowUpReports.astro");

describe("Decision 17 review digest disclosure", () => {
  it("uses one native details/summary disclosure that is closed by default and server-only", () => {
    const detailsTags = disclosure.match(/<details\b[^>]*>/gu) ?? [];
    expect(detailsTags).toHaveLength(1);
    expect(detailsTags[0]).not.toMatch(/(?:^|\s)open(?:\s|=|>)/u);

    const detailsStart = disclosure.indexOf(detailsTags[0]!);
    const summaryStart = disclosure.indexOf("<summary", detailsStart);
    const summaryEnd = disclosure.indexOf("</summary>", summaryStart);
    const detailsEnd = disclosure.indexOf("</details>", summaryEnd);
    expect(summaryStart).toBeGreaterThan(detailsStart);
    expect(summaryEnd).toBeGreaterThan(summaryStart);
    expect(detailsEnd).toBeGreaterThan(summaryEnd);
    expect(disclosure).toContain("data-review-digests");
    expect(disclosure).toContain("data-record-id");
    expect(disclosure).not.toMatch(/<script\b|client:[a-z-]+/iu);
  });

  it("keeps all three digest values in unique labelled readonly inputs", () => {
    const bindings = [
      {
        idVariable: "contentDigestId",
        idSuffix: "case-content-digest",
        valueVariable: "contentDigest",
      },
      {
        idVariable: "renderedSetDigestId",
        idSuffix: "rendered-set-digest",
        valueVariable: "renderedSetDigest",
      },
      {
        idVariable: "followUpDigestId",
        idSuffix: "follow-up-draft-digest",
        valueVariable: "followUpDigest",
      },
    ] as const;
    const inputTags = disclosure.match(/<input\b[\s\S]*?\/>/gu) ?? [];

    expect(inputTags).toHaveLength(bindings.length);
    expect(new Set(bindings.map((binding) => binding.idSuffix)).size).toBe(
      bindings.length,
    );

    for (const [index, binding] of bindings.entries()) {
      expect(disclosure).toContain(
        `const ${binding.idVariable} = \`\${scopeId}-${binding.idSuffix}\`;`,
      );
      expect(inputTags[index]).toContain(`id={${binding.idVariable}}`);
      expect(inputTags[index]).toContain(`value={${binding.valueVariable}}`);
      expect(inputTags[index]).toMatch(/\breadonly\b/u);
      expect(
        disclosure.match(
          new RegExp(`\\bfor=\\{${binding.idVariable}\\}`, "gu"),
        ) ?? [],
      ).toHaveLength(1);
      expect(
        disclosure.match(
          new RegExp(`\\bid=\\{${binding.idVariable}\\}`, "gu"),
        ) ?? [],
      ).toHaveLength(1);
    }
  });

  it("preserves both real-route digest computations and passes the pending follow-up digest", () => {
    expect(caseRoute).toContain(
      "const contentDigest = computeCaseContentDigest(record);",
    );
    expect(caseRoute).toContain(
      "const renderedSetDigest = computeRenderedSetDigest(permitted);",
    );

    const invocation = caseRoute.match(
      /<ReviewDigestDisclosure\b[\s\S]*?\/>/u,
    )?.[0];
    expect(invocation).toBeDefined();
    expect(invocation).toContain("contentDigest={contentDigest}");
    expect(invocation).toContain("renderedSetDigest={renderedSetDigest}");
    expect(invocation).toContain("followUpDigest={followUpEntry?.draftDigest}");
  });

  it("removes digest presentation from FollowUpReports", () => {
    expect(followUpReports).not.toMatch(
      /\bdraftDigest\b|data-follow-up-draft-digest|後續消息草稿 digest|\.draft-digest/u,
    );

    const routeInvocation = caseRoute.match(
      /<FollowUpReports\b[\s\S]*?\/>/u,
    )?.[0];
    expect(routeInvocation).toBeDefined();
    expect(routeInvocation).not.toMatch(/draftDigest|followUpDigest/u);
  });
});
