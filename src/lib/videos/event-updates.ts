/** Attributed public reporting, separate from the original clinical approval ledger. */
import { z } from "astro/zod";
import batchData from "../../data/videos/event-batch-30.v1.json";
import batch31Data from "../../data/videos/event-batch-31.v1.json";
import batch32Data from "../../data/videos/event-batch-32.v1.json";
import batch34Data from "../../data/videos/event-batch-34.v1.json";
import recent120Data from "../../data/videos/event-recent-120.v1.json";
import recent150Data from "../../data/videos/event-recent-150.v1.json";
import judgeRibData from "../../data/videos/event-judge-rib.v1.json";
import ribFractureData from "../../data/videos/event-rib-fracture-three.v1.json";
import newData from "../../data/videos/event-additions.v1.json";
import { curation } from "./expansion";
import data from "../../data/videos/event-updates.v1.json";
const text = z.string().trim().min(1);
const https = z.url({ protocol: /^https$/ });
const citedReportSchema = z.strictObject({
  text,
  sourceIndexes: z.array(z.number().int().positive()).min(1),
});
const timelineDateSchema = z.union([
  z.iso.date(),
  z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  z.string().regex(/^\d{4}$/),
]);

/** Compare date ranges without inventing a day for month/year-only reports. */
export function timelineDateBounds(date: string): [string, string] {
  if (date.length === 4) return [`${date}-01-01`, `${date}-12-31`];
  if (date.length === 7) {
    const [year, month] = date.split("-").map(Number);
    const lastDay = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
    return [`${date}-01`, `${date}-${lastDay}`];
  }
  return [date, date];
}

export function formatTimelineDate(date: string): string {
  if (date.length === 4) return `${date} 年`;
  if (date.length === 7)
    return `${date.slice(0, 4)} 年 ${Number(date.slice(5))} 月`;
  return date;
}
const eventUpdateEntryInputSchema = z.strictObject({
  slug: text,
  videoUrl: https,
  eventDate: z.iso.date().nullable(),
  eventDateCertainty: z.enum(["confirmed", "reported"]).optional(),
  injury: text,
  returnDate: z.iso.date().nullable(),
  returnSummary: text,
  context: text,
  mechanism: z
    .strictObject({
      title: text,
      summary: citedReportSchema,
      steps: z.array(text).min(1),
      explanation: citedReportSchema,
      research: citedReportSchema.optional(),
      limitation: text,
    })
    .optional(),
  timeline: z
    .array(
      citedReportSchema.extend({
        date: timelineDateSchema,
        title: text,
      }),
    )
    .min(1)
    .optional(),
  checkedAt: z.iso.date().optional(),
  sources: z
    .array(
      z.strictObject({
        title: text,
        url: https,
        publishedAt: z.iso.date().nullable(),
      }),
    )
    .min(1),
});
const eventUpdateEntrySchema = eventUpdateEntryInputSchema.extend({
  checkedAt: z.iso.date(),
});
export const eventUpdatesSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-27"),
    checkedAt: z.iso.date(),
    scope: z.literal("attributed-public-reports"),
    entries: z.array(eventUpdateEntrySchema).min(1),
  })
  .superRefine((value, ctx) => {
    const slugs = new Set<string>();
    const videos = new Set<string>();
    const today = new Date().toISOString().slice(0, 10);
    if (value.checkedAt > today)
      ctx.addIssue({ code: "custom", message: "Future verification date" });
    for (const entry of value.entries) {
      const citedReports = [
        ...(entry.mechanism
          ? [
              entry.mechanism.summary,
              entry.mechanism.explanation,
              ...(entry.mechanism.research ? [entry.mechanism.research] : []),
            ]
          : []),
        ...(entry.timeline ?? []),
      ];
      if (
        citedReports.some((report) =>
          report.sourceIndexes.some((index) => index > entry.sources.length),
        )
      )
        ctx.addIssue({
          code: "custom",
          message: `Unknown report source: ${entry.slug}`,
        });
      for (const [index, milestone] of (entry.timeline ?? []).entries()) {
        const [start, end] = timelineDateBounds(milestone.date);
        const previousStart =
          index > 0
            ? timelineDateBounds(entry.timeline![index - 1]!.date)[0]
            : null;
        if (
          (entry.eventDate && end < entry.eventDate) ||
          start > entry.checkedAt ||
          (previousStart && end < previousStart)
        )
          ctx.addIssue({
            code: "custom",
            message: `Invalid timeline date: ${entry.slug}`,
          });
      }
      if (slugs.has(entry.slug) || videos.has(entry.videoUrl))
        ctx.addIssue({ code: "custom", message: "Duplicate event update" });
      slugs.add(entry.slug);
      videos.add(entry.videoUrl);
      if (entry.checkedAt > today)
        ctx.addIssue({
          code: "custom",
          message: `Future verification date: ${entry.slug}`,
        });
      if (
        entry.returnDate &&
        (!entry.eventDate ||
          entry.returnDate < entry.eventDate ||
          entry.returnDate > entry.checkedAt)
      )
        ctx.addIssue({
          code: "custom",
          message: `Invalid completed return: ${entry.slug}`,
        });
      if (entry.eventDate && entry.eventDate > entry.checkedAt)
        ctx.addIssue({ code: "custom", message: "Future event" });
      if (
        entry.sources.some(
          (s) => s.publishedAt && s.publishedAt > entry.checkedAt,
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
    entries: z.array(eventUpdateEntryInputSchema),
  })
  .parse(newData);
const batch30 = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-30"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdateEntryInputSchema),
  })
  .parse(batchData);
const batch31 = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-31"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdateEntryInputSchema),
  })
  .parse(batch31Data);
const batch32 = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-32"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdateEntryInputSchema),
  })
  .parse(batch32Data);
const batch34 = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-34"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdateEntryInputSchema),
  })
  .parse(batch34Data);
const recent120 = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("recent-120-2026-09-12"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdateEntryInputSchema).length(19),
  })
  .parse(recent120Data);

const recent150 = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("recent-150-2026-09-13"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdateEntryInputSchema).length(30),
  })
  .parse(recent150Data);

const judgeRib = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("judge-rib-2026-09-18"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdateEntryInputSchema).length(1),
  })
  .parse(judgeRibData);

type EventUpdateBatchInput = {
  checkedAt: string;
  entries: readonly z.input<typeof eventUpdateEntryInputSchema>[];
};

const ribFractureThree = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("rib-fracture-three-2026-09-20"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdateEntryInputSchema).length(3),
  })
  .parse(ribFractureData);

/** Preserve the date of the batch that actually checked each entry. */
export function normalizeEventUpdateBatches(
  batches: readonly EventUpdateBatchInput[],
): z.infer<typeof eventUpdateEntrySchema>[] {
  return batches.flatMap((batch) =>
    batch.entries.map((entry) =>
      eventUpdateEntrySchema.parse({
        ...entry,
        checkedAt: entry.checkedAt ?? batch.checkedAt,
      }),
    ),
  );
}

const normalizedEntries = normalizeEventUpdateBatches([
  data,
  additions,
  batch30,
  batch31,
  batch32,
  batch34,
  recent120,
  recent150,
  judgeRib,
  ribFractureThree,
]).filter((e) => !curation.removedSlugs.some((slug) => slug === e.slug));
export const eventUpdates = eventUpdatesSchema.parse({
  ...data,
  checkedAt: normalizedEntries.reduce(
    (latest, entry) => (entry.checkedAt > latest ? entry.checkedAt : latest),
    data.checkedAt,
  ),
  entries: normalizedEntries,
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
  return entry.eventDate &&
    entry.returnDate &&
    entry.eventDateCertainty !== "reported"
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
  | "術後出賽"
  | "跨兩次傷害後出賽"
  | "首次出賽"
  | "再次出賽";

const RETURN_MILESTONE_BY_SLUG: Readonly<
  Partial<Record<EventUpdate["slug"], ReturnMilestone>>
> = {
  "shohei-ohtani-world-series-2024": "帶傷出賽",
  "klay-thompson-2019-acl": "跨兩次傷害後出賽",
  "kristaps-porzingis-retinaculum-2024": "術後出賽",
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
