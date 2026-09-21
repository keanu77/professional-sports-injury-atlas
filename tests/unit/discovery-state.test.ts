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
});
