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
describe("shareable discovery state", () => {
  it("round trips all independent filters, Unicode query and scope without losing unrelated URL state", () => {
    const state = {
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
        { query: "", type: "", sport: "", body: "", mode: "all" },
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
});
