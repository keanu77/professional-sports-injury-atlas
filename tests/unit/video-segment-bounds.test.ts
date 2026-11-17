import { describe, expect, it } from "vitest";
import {
  validateSegmentDuration,
  videoContentTypesSchema,
  videoContentTypes,
} from "../../src/lib/videos/content-types";

describe("source-bound teaching segment ranges", () => {
  const segment = {
    startSeconds: 10,
    endSeconds: 20,
    typeIds: ["injury-moment" as const],
    note: "觀察提示",
  };
  it("allows a complete range but rejects out-of-media offsets", () => {
    expect(() => validateSegmentDuration([segment], 20)).not.toThrow();
    expect(() => validateSegmentDuration([segment], 19)).toThrow();
    expect(() =>
      validateSegmentDuration(
        [{ ...segment, startSeconds: 20, endSeconds: undefined }],
        20,
      ),
    ).toThrow();
    expect(() => validateSegmentDuration([], Number.NaN)).toThrow();
  });
  it("rejects reversed and unordered editorial ranges without inferring missing ends", () => {
    const registry = structuredClone(videoContentTypes);
    const entry = registry.entries.find((row) =>
      row.tags.includes("injury-moment"),
    )!;
    entry.segments = [{ ...segment, endSeconds: 9 }];
    expect(videoContentTypesSchema.safeParse(registry).success).toBe(false);
    entry.segments = [segment, { ...segment, startSeconds: 5 }];
    expect(videoContentTypesSchema.safeParse(registry).success).toBe(false);
    entry.segments = [{ ...segment, endSeconds: undefined }];
    expect(videoContentTypesSchema.safeParse(registry).success).toBe(true);
  });
});
