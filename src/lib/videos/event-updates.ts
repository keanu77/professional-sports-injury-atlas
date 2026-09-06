/** Attributed public reporting, separate from the original clinical approval ledger. */
import { z } from "astro/zod";
import batchData from "../../data/videos/event-batch-30.v1.json";
import batch31Data from "../../data/videos/event-batch-31.v1.json";
import batch32Data from "../../data/videos/event-batch-32.v1.json";
import batch34Data from "../../data/videos/event-batch-34.v1.json";
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
const batch32 = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-32"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdatesSchema.shape.entries.element),
  })
  .parse(batch32Data);
const batch34 = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-34"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdatesSchema.shape.entries.element),
  })
  .parse(batch34Data);
// The shared public check date is valid only when every batch was reviewed on it.
// A later review must introduce per-entry dates rather than silently relabel older entries.
if (
  additions.checkedAt !== data.checkedAt ||
  batch30.checkedAt !== data.checkedAt ||
  batch31.checkedAt !== data.checkedAt ||
  batch32.checkedAt !== data.checkedAt ||
  batch34.checkedAt !== data.checkedAt
)
  throw new Error("Mixed event review dates require per-entry check dates");
export const eventUpdates = eventUpdatesSchema.parse({
  ...data,
  entries: [
    ...data.entries,
    ...additions.entries,
    ...batch30.entries,
    ...batch31.entries,
    ...batch32.entries,
    ...batch34.entries,
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

export type ReturnMilestone =
  | "復健賽"
  | "春訓"
  | "季前賽"
  | "熱身賽"
  | "正式賽"
  | "帶傷出賽"
  | "首次出賽"
  | "再次出賽";

const RETURN_MILESTONE_BY_SLUG: Readonly<
  Partial<Record<EventUpdate["slug"], ReturnMilestone>>
> = {
  "shohei-ohtani-world-series-2024": "帶傷出賽",
};

/** Labels the recorded return event without changing or extending its facts. */
export function classifyReturnMilestone(
  entry: Pick<EventUpdate, "slug" | "returnSummary" | "context">,
): ReturnMilestone {
  const summary = entry.returnSummary;
  const governedLabel = RETURN_MILESTONE_BY_SLUG[entry.slug];
  if (governedLabel) return governedLabel;

  if (/復健賽/u.test(summary)) return "復健賽";
  if (/春訓/u.test(summary)) return "春訓";
  if (/季前賽/u.test(summary)) return "季前賽";
  if (/(?:熱身賽|友誼賽)/u.test(summary)) return "熱身賽";
  if (/帶傷(?:出賽|參賽)/u.test(summary)) return "帶傷出賽";
  if (
    /(?:首次(?:復出|出賽|重返|比賽)|傷後.{0,12}(?:第一場|首場))/u.test(summary)
  )
    return "首次出賽";
  if (/(?:正式復出|正式賽|例行賽|季後賽|世界盃|奧運)/u.test(summary))
    return "正式賽";
  return "再次出賽";
}
