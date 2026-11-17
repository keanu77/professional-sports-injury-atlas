import { describe, expect, it } from "vitest";
import {
  readDiscoveryState,
  writeDiscoveryState,
} from "../../src/lib/videos/discovery-state";

const options = {
  types: new Set(["injury-moment", "expert-analysis"]),
  sports: new Set(["basketball"]),
  bodies: new Set(["ankle"]),
};
const temporal = {
  period: "" as const,
  from: "",
  to: "",
  sort: "editorial" as const,
};
describe("shareable discovery state", () => {
  it("round trips all independent filters, Unicode query and scope without losing unrelated URL state", () => {
    const state = {
      ...temporal,
      query: "大谷 / Drew Brees",
      type: "injury-moment",
      sport: "basketball",
      body: "ankle",
      mode: "popular" as const,
    };
    const url = writeDiscoveryState(
      new URL("https://example.test/?ref=teaching#videos-heading"),
      state,
    );
    expect(readDiscoveryState(url, options)).toEqual(state);
    expect(url.searchParams.get("ref")).toBe("teaching");
    expect(url.hash).toBe("#videos-heading");
  });
  it("rejects unknown filters and bounds input without injecting it into markup", () => {
    const url = new URL(
      "https://example.test/?type=bad&sport=bad&body=bad&mode=bad&q=" +
        "x".repeat(200),
    );
    expect(readDiscoveryState(url, options)).toEqual({
      ...temporal,
      query: "x".repeat(120),
      type: "",
      sport: "",
      body: "",
      mode: "all",
    });
  });
  it("keeps category routes within their admitted set and removes inapplicable state", () => {
    const url = new URL(
      "https://example.test/video-types/injury-moment/?type=expert-analysis&mode=popular&sport=basketball",
    );
    const state = readDiscoveryState(url, {
      ...options,
      fixedType: "injury-moment",
    });
    expect(state.type).toBe("injury-moment");
    expect(state.mode).toBe("all");
    const normalized = writeDiscoveryState(url, state, "injury-moment");
    expect(normalized.search).toBe("?sport=basketball");
  });
  it.each([
    {
      path: "/sports/basketball/",
      scope: { fixedSport: "basketball" },
      removed: "sport",
      retained: "body",
    },
    {
      path: "/body-parts/ankle/",
      scope: { fixedBody: "ankle" },
      removed: "body",
      retained: "sport",
    },
    {
      path: "/situations/landing/",
      scope: { fixedSituation: "landing" },
      removed: "situation",
      retained: "sport",
    },
  ])(
    "keeps $path fixed while retaining independent filters and normalizing history",
    ({ path, scope, removed, retained }) => {
      const url = new URL(
        `${path}?q=跳躍&type=expert-analysis&sport=basketball&body=ankle&mode=popular&ref=lesson#videos-heading`,
        "https://example.test",
      );
      const state = readDiscoveryState(url, { ...options, ...scope });
      if (scope.fixedSituation) url.searchParams.set("situation", "collision");
      expect(state.mode).toBe("all");
      if (scope.fixedSport) expect(state.sport).toBe(scope.fixedSport);
      if (scope.fixedBody) expect(state.body).toBe(scope.fixedBody);
      const normalized = writeDiscoveryState(url, state, scope);
      expect(normalized.pathname).toBe(path);
      expect(normalized.searchParams.has(removed)).toBe(false);
      expect(normalized.searchParams.get(retained)).toBe(
        url.searchParams.get(retained),
      );
      expect(normalized.searchParams.get("ref")).toBe("lesson");
      expect(normalized.hash).toBe("#videos-heading");
      expect(readDiscoveryState(normalized, { ...options, ...scope })).toEqual(
        state,
      );
      const cleared = writeDiscoveryState(
        normalized,
        { ...temporal, query: "", type: "", sport: "", body: "", mode: "all" },
        scope,
      );
      expect(cleared.pathname).toBe(path);
      expect(cleared.search).toBe("?ref=lesson");
    },
  );
  it("ignores a conflicting fixed dimension from shared URLs", () => {
    const state = readDiscoveryState(
      new URL("https://example.test/body-parts/knee/?body=ankle"),
      { ...options, fixedBody: "knee" },
    );
    expect(state.body).toBe("knee");
  });
  it("round trips inclusive date ranges and sorting on category pages", () => {
    const url = new URL(
      "https://example.test/sports/basketball/?period=custom&from=2024-11-18&to=2026-11-18&sort=updated-newest&ref=lesson#videos-heading",
    );
    const state = readDiscoveryState(url, {
      ...options,
      fixedSport: "basketball",
    });
    expect(state).toMatchObject({
      period: "custom",
      from: "2024-11-18",
      to: "2026-11-18",
      sort: "updated-newest",
    });
    expect(
      writeDiscoveryState(url, state, { fixedSport: "basketball" }).href,
    ).toBe(url.href);
  });
  it("rejects malformed dates, clears unrelated dates and normalizes popularity order", () => {
    expect(
      readDiscoveryState(
        new URL(
          "https://example.test/?period=custom&from=2026-02-30&to=2026-11-18&sort=bad",
        ),
        options,
      ),
    ).toMatchObject({
      period: "custom",
      from: "",
      to: "2026-11-18",
      sort: "editorial",
    });
    const url = new URL(
      "https://example.test/?period=recent-2y&from=2020-01-01&mode=popular&sort=event-newest",
    );
    const state = readDiscoveryState(url, options);
    expect(state).toMatchObject({
      period: "recent-2y",
      from: "",
      to: "",
      sort: "editorial",
    });
    expect(writeDiscoveryState(url, state).search).toBe(
      "?period=recent-2y&mode=popular",
    );
    expect(
      readDiscoveryState(
        new URL("https://example.test/?period=bad&from=2020-01-01"),
        options,
      ),
    ).toMatchObject(temporal);
  });
});
