/** Attributed public reporting, separate from the original clinical approval ledger. */
import { z } from "astro/zod";
import batchData from "../../data/videos/event-batch-30.v1.json";
import batch31Data from "../../data/videos/event-batch-31.v1.json";
import newData from "../../data/videos/event-additions.v1.json";
import { curation } from "./expansion";
import data from "../../data/videos/event-updates.v1.json";
const text = z.string().trim().min(1);
const https = z.url({ protocol: /^https$/ });
export const eventUpdatesSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-27"),
    checkedAt: z.iso.date(),
    scope: z.literal("attributed-public-reports"),
    entries: z
      .array(
        z.strictObject({
          slug: text,
          videoUrl: https,
          eventDate: z.iso.date().nullable(),
          injury: text,
          returnDate: z.iso.date().nullable(),
          returnSummary: text,
          context: text,
          sources: z
            .array(
              z.strictObject({
                title: text,
                url: https,
                publishedAt: z.iso.date().nullable(),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
  })
  .superRefine((value, ctx) => {
    const slugs = new Set<string>();
    const videos = new Set<string>();
    const today = new Date().toISOString().slice(0, 10);
    if (value.checkedAt > today)
      ctx.addIssue({ code: "custom", message: "Future verification date" });
    for (const entry of value.entries) {
      if (slugs.has(entry.slug) || videos.has(entry.videoUrl))
        ctx.addIssue({ code: "custom", message: "Duplicate event update" });
      slugs.add(entry.slug);
      videos.add(entry.videoUrl);
      if (
        entry.returnDate &&
        (!entry.eventDate ||
          entry.returnDate < entry.eventDate ||
          entry.returnDate > value.checkedAt)
      )
        ctx.addIssue({
          code: "custom",
          message: `Invalid completed return: ${entry.slug}`,
        });
      if (entry.eventDate && entry.eventDate > value.checkedAt)
        ctx.addIssue({ code: "custom", message: "Future event" });
      if (
        entry.sources.some(
          (s) => s.publishedAt && s.publishedAt > value.checkedAt,
        )
      )
        ctx.addIssue({ code: "custom", message: "Future source" });
    }
  });
const additions = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-28"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdatesSchema.shape.entries.element),
  })
  .parse(newData);
const batch30 = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-30"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdatesSchema.shape.entries.element),
  })
  .parse(batchData);
const batch31 = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-31"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdatesSchema.shape.entries.element),
  })
  .parse(batch31Data);
// The shared public check date is valid only when every batch was reviewed on it.
// A later review must introduce per-entry dates rather than silently relabel older entries.
if (
  additions.checkedAt !== data.checkedAt ||
  batch30.checkedAt !== data.checkedAt ||
  batch31.checkedAt !== data.checkedAt
)
  throw new Error("Mixed event review dates require per-entry check dates");
export const eventUpdates = eventUpdatesSchema.parse({
  ...data,
  entries: [
    ...data.entries,
    ...additions.entries,
    ...batch30.entries,
    ...batch31.entries,
  ].filter((e) => !curation.removedSlugs.some((slug) => slug === e.slug)),
});
export type EventUpdate = (typeof eventUpdates.entries)[number];
export function eventUpdateFor(
  slug: string,
  videoUrl: string,
  eventDate: string | null,
): EventUpdate | undefined {
  const entry = eventUpdates.entries.find((e) => e.slug === slug);
  if (entry && (entry.videoUrl !== videoUrl || entry.eventDate !== eventDate))
    throw new Error(`Event update binding mismatch: ${slug}`);
  return entry;
}
export function returnDays(entry: EventUpdate): number | null {
  return entry.eventDate && entry.returnDate
    ? Math.round(
        (Date.parse(entry.returnDate) - Date.parse(entry.eventDate)) / 86400000,
      )
    : null;
}
