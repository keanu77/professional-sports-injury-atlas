import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadPublicVideoInventory } from "../../scripts/lib/public-video-inventory";
import { allObservationClips } from "../../src/lib/videos/expansion";
import { eventUpdates } from "../../src/lib/videos/event-updates";
import {
  assertPublicReferenceCoverage,
  createPublicVideoInventory,
  OBSERVATION_SAFETY_URLS,
  publicInventoryDigest,
  type PublicInventoryCoreCase,
} from "../../src/lib/videos/public-inventory";

const inventory = loadPublicVideoInventory();
const records = readdirSync("src/content/cases")
  .filter((file) => file.endsWith(".json"))
  .map(
    (file) =>
      JSON.parse(
        readFileSync(`src/content/cases/${file}`, "utf8"),
      ) as PublicInventoryCoreCase,
  );

describe("shared public media inventory", () => {
  it("matches the governed catalog and includes both providers without frozen batches", () => {
    expect(inventory.map((entry) => entry.slug).sort()).toEqual(
      eventUpdates.entries.map((entry) => entry.slug).sort(),
    );
    expect(
      inventory.filter((entry) => entry.path.startsWith("/videos/")),
    ).toHaveLength(allObservationClips.length);
    expect(new Set(inventory.map((entry) => entry.provider))).toEqual(
      new Set(["youtube", "mlb"]),
    );
    expect(new Set(inventory.map((entry) => entry.path)).size).toBe(
      inventory.length,
    );
  });

  it("includes supplemental sources on their pages, even when absent from event reports", () => {
    const eventUrls = new Set(
      eventUpdates.entries.flatMap((entry) =>
        entry.sources.map((source) => source.url),
      ),
    );
    const missedBefore = allObservationClips.flatMap((clip) =>
      clip.sources
        .filter((source) => !eventUrls.has(source.url))
        .map((source) => ({ path: `/videos/${clip.slug}/`, url: source.url })),
    );
    expect(missedBefore.length).toBeGreaterThan(0);
    expect(() =>
      assertPublicReferenceCoverage(inventory, missedBefore),
    ).not.toThrow();
    expect(() =>
      assertPublicReferenceCoverage(inventory, [
        {
          path: inventory[0]!.path,
          url: "https://example.org/new-unmonitored-reference",
        },
      ]),
    ).toThrow("Unmonitored public references");
  });

  it("guards safety literals in the public template and automatically includes new case sources", () => {
    const page = readFileSync("src/pages/videos/[slug].astro", "utf8");
    const literals = [...page.matchAll(/href="(https:\/\/[^"{}]+)"/g)].map(
      (match) => match[1],
    );
    const safety = new Set(Object.values(OBSERVATION_SAFETY_URLS).flat());
    expect(literals.length).toBeGreaterThan(0);
    expect(literals.filter((url) => !safety.has(url as never))).toEqual([]);
    const knownCase = inventory.find((entry) =>
      entry.path.startsWith("/cases/"),
    )!;
    const changed = records.map((record) =>
      record.slug === knownCase.slug
        ? {
            ...record,
            sources: [
              ...record.sources,
              { url: "https://example.org/new-source" },
            ],
          }
        : record,
    );
    const next = createPublicVideoInventory(changed);
    expect(
      next.find((entry) => entry.slug === knownCase.slug)!.sourceUrls,
    ).toContain("https://example.org/new-source");
  });

  it("binds the digest to the actual reference inventory rather than item order", () => {
    expect(publicInventoryDigest([...inventory].reverse())).toBe(
      publicInventoryDigest(inventory),
    );
    expect(
      publicInventoryDigest(
        inventory.map((entry, index) =>
          index ? entry : { ...entry, startSeconds: entry.startSeconds + 1 },
        ),
      ),
    ).not.toBe(publicInventoryDigest(inventory));
    expect(() => createPublicVideoInventory([])).toThrow("binding missing");
  });
});
