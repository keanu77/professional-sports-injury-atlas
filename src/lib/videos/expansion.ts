/** User-confirmed video expansion; observation clips do not claim medical approval. */
import { z } from "astro/zod";
import batchData from "../../data/videos/batch-30.v1.json";
import batch31Data from "../../data/videos/batch-31.v1.json";
import batch32Data from "../../data/videos/batch-32.v1.json";
import batch34Data from "../../data/videos/batch-34.v1.json";
import recent120Data from "../../data/videos/recent-120.v1.json";
import recent150Data from "../../data/videos/recent-150.v1.json";
import judgeRibData from "../../data/videos/judge-rib.v1.json";
import ribFractureData from "../../data/videos/rib-fracture-three.v1.json";
import nerveFourData from "../../data/videos/nerve-four.v1.json";
import data from "../../data/videos/expansion.v1.json";
import launchData from "../../data/public-launch.v1.json";
import curationData from "../../data/videos/curation.v1.json";
import additionsData from "../../data/videos/additions.v1.json";
import type { InjuryCase } from "../contracts/case";
import { canonicalJson, sha256Hex } from "../contracts/canonical";
import { parseYouTubeVideoId } from "../video/youtube";
const url = z.url({ protocol: /^https$/ });
const day = z.iso.date().nullable();
export const observationClipSchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  videoId: z.union([
    z.string().regex(/^[\w-]{11}$/),
    z.literal("zack-kelly-leaves-with-injury"),
  ]),
  provider: z.enum(["youtube", "mlb"]).optional(),
  nerveCategory: z.enum(["peripheral-nerve", "brachial-plexus"]).optional(),
  eventYear: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
  name: z.string().min(1),
  sport: z.string().min(1),
  event: z.string().min(1),
  bodyPart: z.string().min(1),
  observation: z.string().min(1),
  footageKind: z
    .enum(["injury-motion", "aftermath", "news-analysis", "athlete-interview"])
    .optional(),
  eventDate: day,
  returnDate: day,
  returnText: z.string().min(1),
  videoUrl: url,
  publisher: z.string().min(1),
  sourceTitle: z.string().min(1),
  captionStatus: z.enum(["available", "unavailable", "not-verified"]),
  startSeconds: z.number().int().nonnegative(),
  durationSeconds: z.number().int().positive(),
  sources: z.array(z.strictObject({ title: z.string().min(1), url })),
});
export const expansionSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-23"),
    authorizationQuote: z.literal("可以"),
    authorizedAt: z.iso.datetime(),
    scope: z.literal("nine-confirmed-videos-captions-optional"),
    cases: z
      .array(
        z.strictObject({
          id: z.string(),
          slug: z.string(),
          recordDigest: z.string().regex(/^[a-f0-9]{64}$/),
          videoUrl: url,
        }),
      )
      .length(2),
    clips: z.array(observationClipSchema).length(7),
  })
  .superRefine((value, ctx) => {
    const urls = [
      ...value.cases.map((c) => c.videoUrl),
      ...value.clips.map((c) => c.videoUrl),
    ];
    if (
      new Set(urls).size !== 9 ||
      urls.some((u) => parseYouTubeVideoId(u) === null)
    )
      ctx.addIssue({
        code: "custom",
        message: "Nine distinct canonical YouTube videos required",
      });
    if (new Set(value.clips.map((c) => c.slug)).size !== value.clips.length)
      ctx.addIssue({ code: "custom", message: "Duplicate clip slug" });
    for (const c of value.clips) {
      if (
        parseYouTubeVideoId(c.videoUrl) !== c.videoId ||
        c.startSeconds >= c.durationSeconds
      )
        ctx.addIssue({
          code: "custom",
          message: `Invalid video binding or timecode: ${c.slug}`,
        });
      if (
        c.returnDate &&
        (!c.eventDate || c.returnDate < c.eventDate || c.sources.length === 0)
      )
        ctx.addIssue({
          code: "custom",
          message: `Unsupported return date: ${c.slug}`,
        });
    }
  });
export const expansion = expansionSchema.parse(data);
export type ObservationClip = z.infer<typeof observationClipSchema>;
export const additionsSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-27"),
    authorizationQuote: z.literal("可以，請在搜尋更多影片並加入"),
    authorizedAt: z.iso.datetime(),
    clips: z.array(observationClipSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const videoIds = new Set(
      [...launchData.cases, ...expansion.cases].map((c) =>
        parseYouTubeVideoId(c.videoUrl),
      ),
    );
    const slugs = new Set(expansion.cases.map((c) => c.slug));
    for (const c of [...expansion.clips, ...value.clips]) {
      if (
        videoIds.has(c.videoId) ||
        slugs.has(c.slug) ||
        parseYouTubeVideoId(c.videoUrl) !== c.videoId ||
        c.startSeconds >= c.durationSeconds ||
        (c.returnDate &&
          (!c.eventDate ||
            c.returnDate < c.eventDate ||
            c.sources.length === 0))
      ) {
        ctx.addIssue({
          code: "custom",
          message: `Invalid or duplicate clip: ${c.slug}`,
        });
      }
      videoIds.add(c.videoId);
      slugs.add(c.slug);
    }
  });
export const additions = additionsSchema.parse(additionsData);
export const curationSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-28"),
    authorizationQuote: z.literal(
      "請刪除兩個球友上傳的影片，然後繼續搜尋更多影片來源，可包含任何運動項目",
    ),
    authorizedAt: z.iso.datetime(),
    removedSlugs: z
      .array(z.enum(["volleyball-pov-135", "ankle-inversion-observation"]))
      .length(2),
    clips: z.array(observationClipSchema),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.removedSlugs).size !== 2)
      ctx.addIssue({
        code: "custom",
        message: "Exactly two distinct removed videos required",
      });
    const combined = additionsSchema.safeParse({
      ...additions,
      clips: [...additions.clips, ...value.clips],
    });
    if (!combined.success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate new curation video",
      });
  });
export const curation = curationSchema.parse(curationData);
export const batch30Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-30"),
    authorizationQuote: z.literal(
      "影片總數量的目標是50個以上，請你盡最大努力完成",
    ),
    authorizedAt: z.iso.datetime(),
    clips: z.array(observationClipSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const combined = additionsSchema.safeParse({
      ...additions,
      clips: [...additions.clips, ...curation.clips, ...value.clips],
    });
    if (!combined.success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate batch 30 video",
      });
  });
export const batch30 = batch30Schema.parse(batchData);
export const batch31Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-31"),
    authorizationQuote: z.literal("好的，我們繼續補充"),
    authorizedAt: z.iso.datetime(),
    clips: z.array(observationClipSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const combined = additionsSchema.safeParse({
      ...additions,
      clips: [
        ...additions.clips,
        ...curation.clips,
        ...batch30.clips,
        ...value.clips,
      ],
    });
    if (!combined.success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate batch 31 video",
      });
  });
export const batch31 = batch31Schema.parse(batch31Data);
export const batch32Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-32"),
    authorizationQuote: z.literal("我覺得棒球的影片可以多一些"),
    authorizedAt: z.iso.datetime(),
    clips: z.array(observationClipSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const combined = additionsSchema.safeParse({
      ...additions,
      clips: [
        ...additions.clips,
        ...curation.clips,
        ...batch30.clips,
        ...batch31.clips,
        ...value.clips,
      ],
    });
    if (!combined.success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate batch 32 video",
      });
  });
export const batch32 = batch32Schema.parse(batch32Data);
export const batch34Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("decision-34"),
    authorizationQuote: z.literal("我們來把影片數量做到100個"),
    authorizedAt: z.iso.datetime(),
    clips: z.array(observationClipSchema).min(1),
  })
  .superRefine((value, ctx) => {
    const combined = additionsSchema.safeParse({
      ...additions,
      clips: [
        ...additions.clips,
        ...curation.clips,
        ...batch30.clips,
        ...batch31.clips,
        ...batch32.clips,
        ...value.clips,
      ],
    });
    if (!combined.success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate batch 34 video",
      });
  });
export const batch34 = batch34Schema.parse(batch34Data);
/** One athlete on one date is one event; a different upload is not a new case. */
export function observationEventKey(
  clip: Pick<ObservationClip, "name" | "eventDate">,
): string | null {
  if (!clip.eventDate) return null;
  const name = clip.name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]/gu, "");
  return `${name}|${clip.eventDate}`;
}
/** The user's new scope is an editorial expansion, not a clinical signoff. */
export const recent120Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("recent-120-2026-09-12"),
    authorizationQuote: z.literal("我們先做120個個案後再來審查"),
    authorizedAt: z.iso.datetime(),
    scope: z.literal("nineteen-recent-observation-cases"),
    clips: z.array(observationClipSchema).length(19),
  })
  .superRefine((value, ctx) => {
    const combined = additionsSchema.safeParse({
      ...additions,
      clips: [
        ...additions.clips,
        ...curation.clips,
        ...batch30.clips,
        ...batch31.clips,
        ...batch32.clips,
        ...batch34.clips,
        ...value.clips,
      ],
    });
    if (!combined.success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate recent video",
      });
    const knownEvents = new Set(
      [
        ...expansion.clips,
        ...additions.clips,
        ...curation.clips,
        ...batch30.clips,
        ...batch31.clips,
        ...batch32.clips,
        ...batch34.clips,
      ]
        .map(observationEventKey)
        .filter((key) => key !== null),
    );
    for (const clip of value.clips) {
      const key = observationEventKey(clip);
      if (key && knownEvents.has(key))
        ctx.addIssue({
          code: "custom",
          message: `Duplicate recent event: ${clip.slug}`,
        });
      if (key) knownEvents.add(key);
      if (
        !clip.eventDate ||
        clip.eventDate < "2023-09-12" ||
        clip.eventDate > "2026-09-12"
      )
        ctx.addIssue({
          code: "custom",
          message: `Recent event outside the requested three years: ${clip.slug}`,
        });
    }
  });
export const recent120 = recent120Schema.parse(recent120Data);
export const recent150Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("recent-150-2026-09-13"),
    authorizationQuote: z.literal("可以，那我們就新增到150例"),
    authorizedAt: z.iso.datetime(),
    scope: z.literal("thirty-recent-observation-cases"),
    clips: z.array(observationClipSchema).length(30),
  })
  .superRefine((value, ctx) => {
    const combined = additionsSchema.safeParse({
      ...additions,
      clips: [
        ...additions.clips,
        ...curation.clips,
        ...batch30.clips,
        ...batch31.clips,
        ...batch32.clips,
        ...batch34.clips,
        ...recent120.clips,
        ...value.clips,
      ],
    });
    if (!combined.success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate recent video",
      });
    const knownEvents = new Set(
      [
        ...expansion.clips,
        ...additions.clips,
        ...curation.clips,
        ...batch30.clips,
        ...batch31.clips,
        ...batch32.clips,
        ...batch34.clips,
        ...recent120.clips,
      ]
        .map(observationEventKey)
        .filter((key) => key !== null),
    );
    for (const clip of value.clips) {
      const key = observationEventKey(clip);
      if (key && knownEvents.has(key))
        ctx.addIssue({
          code: "custom",
          message: `Duplicate recent event: ${clip.slug}`,
        });
      if (key) knownEvents.add(key);
      if (
        !clip.eventDate ||
        clip.eventDate < "2023-09-13" ||
        clip.eventDate > "2026-09-13"
      )
        ctx.addIssue({
          code: "custom",
          message: `Recent event outside the requested three years: ${clip.slug}`,
        });
    }
  });
export const recent150 = recent150Schema.parse(recent150Data);
const priorObservationClips: ObservationClip[] = [
  ...expansion.clips,
  ...additions.clips,
  ...curation.clips,
  ...batch30.clips,
  ...batch31.clips,
  ...batch32.clips,
  ...batch34.clips,
  ...recent120.clips,
  ...recent150.clips,
].filter((c) => !curation.removedSlugs.some((slug) => slug === c.slug));
export const judgeRibSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("judge-rib-2026-09-18"),
    authorizationQuote: z.literal(
      "我想新增Aaron judge injury rib影片跟相關資訊到這個網站",
    ),
    clips: z.array(observationClipSchema).length(1),
  })
  .superRefine((value, ctx) => {
    const combined = additionsSchema.safeParse({
      ...additions,
      clips: [
        ...additions.clips,
        ...curation.clips,
        ...batch30.clips,
        ...batch31.clips,
        ...batch32.clips,
        ...batch34.clips,
        ...recent120.clips,
        ...recent150.clips,
        ...value.clips,
      ],
    });
    if (!combined.success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate Judge video",
      });
    const clip = value.clips[0]!;
    if (
      clip.slug !== "aaron-judge-2026-rib" ||
      priorObservationClips.some(
        (prior) => observationEventKey(prior) === observationEventKey(clip),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Invalid or duplicate Judge event",
      });
  });
export const judgeRib = judgeRibSchema.parse(judgeRibData);
const ribSelections = new Map([
  ["fernando-alonso-2016-rib", "HiLO6a9crD4"],
  ["drew-brees-2020-rib", "_jrPqJow81Q"],
  ["tua-tagovailoa-2021-rib", "JckTrmIPRK8"],
]);
export const ribFractureThreeSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("rib-fracture-three-2026-09-20"),
    authorizationQuote: z.literal("規格確認，開始實作"),
    clips: z.array(observationClipSchema).length(3),
  })
  .superRefine((value, ctx) => {
    const previous = [...priorObservationClips, ...judgeRib.clips];
    const slugs = new Set(previous.map((c) => c.slug));
    const ids = new Set([
      ...previous.map((c) => c.videoId),
      ...[...launchData.cases, ...expansion.cases].map((c) =>
        parseYouTubeVideoId(c.videoUrl),
      ),
    ]);
    const events = new Set(previous.map(observationEventKey));
    for (const clip of value.clips) {
      if (
        ribSelections.get(clip.slug) !== clip.videoId ||
        slugs.has(clip.slug) ||
        ids.has(clip.videoId) ||
        events.has(observationEventKey(clip)) ||
        parseYouTubeVideoId(clip.videoUrl) !== clip.videoId ||
        clip.startSeconds >= clip.durationSeconds ||
        (clip.returnDate &&
          (!clip.eventDate ||
            clip.returnDate < clip.eventDate ||
            clip.sources.length === 0))
      )
        ctx.addIssue({
          code: "custom",
          message: `Invalid or duplicate rib case: ${clip.slug}`,
        });
      slugs.add(clip.slug);
      ids.add(clip.videoId);
      events.add(observationEventKey(clip));
    }
  });
export const ribFractureThree = ribFractureThreeSchema.parse(ribFractureData);
const nerveSelections = new Map([
  [
    "jaylon-smith-2016-peroneal-nerve",
    { id: "O5keKcfVyZM", category: "peripheral-nerve", provider: "youtube" },
  ],
  [
    "zack-kelly-2023-ulnar-nerve",
    {
      id: "zack-kelly-leaves-with-injury",
      category: "peripheral-nerve",
      provider: "mlb",
    },
  ],
  [
    "ryan-crouser-2024-ulnar-nerve",
    { id: "Cuw96lZ9aYI", category: "peripheral-nerve", provider: "youtube" },
  ],
  [
    "rob-horne-2018-brachial-plexus",
    { id: "wgZZoWIR7rQ", category: "brachial-plexus", provider: "youtube" },
  ],
]);
export const nerveFourSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("nerve-four-2026-09-21"),
    authorizationQuote: z.literal("請你開始新增影片到網站"),
    clips: z.array(observationClipSchema).length(4),
  })
  .superRefine((value, ctx) => {
    const previous = [
      ...priorObservationClips,
      ...judgeRib.clips,
      ...ribFractureThree.clips,
    ];
    const slugs = new Set(previous.map((c) => c.slug));
    const ids = new Set([
      ...previous.map((c) => c.videoId),
      ...[...launchData.cases, ...expansion.cases].map((c) =>
        parseYouTubeVideoId(c.videoUrl),
      ),
    ]);
    const events = new Set(previous.map(observationEventKey));
    for (const clip of value.clips) {
      const selection = nerveSelections.get(clip.slug);
      const canonical =
        clip.provider === "mlb"
          ? clip.videoUrl ===
              "https://www.mlb.com/redsox/video/zack-kelly-leaves-with-injury" &&
            clip.startSeconds === 0
          : parseYouTubeVideoId(clip.videoUrl) === clip.videoId;
      if (
        !selection ||
        selection.id !== clip.videoId ||
        selection.category !== clip.nerveCategory ||
        selection.provider !== clip.provider ||
        !canonical ||
        slugs.has(clip.slug) ||
        ids.has(clip.videoId) ||
        (observationEventKey(clip) !== null &&
          events.has(observationEventKey(clip))) ||
        clip.startSeconds >= clip.durationSeconds ||
        clip.sources.length === 0 ||
        (clip.eventYear &&
          clip.eventDate &&
          clip.eventYear !== clip.eventDate.slice(0, 4)) ||
        (clip.returnDate &&
          (!clip.eventDate || clip.returnDate < clip.eventDate))
      ) {
        ctx.addIssue({
          code: "custom",
          message: `Invalid or duplicate nerve case: ${clip.slug}`,
        });
      }
      slugs.add(clip.slug);
      ids.add(clip.videoId);
      events.add(observationEventKey(clip));
    }
  });
export const nerveFour = nerveFourSchema.parse(nerveFourData);
export const allObservationClips: ObservationClip[] = [
  ...priorObservationClips,
  ...judgeRib.clips,
  ...ribFractureThree.clips,
  ...nerveFour.clips,
];
export const expansionEnabled = () =>
  process.env.ATLAS_PUBLIC_LAUNCH === "decision-21";
export function captionsOptionalFor(videoUrl: string): boolean {
  return (
    expansionEnabled() &&
    [...expansion.cases, ...allObservationClips].some(
      (c) => c.videoUrl === videoUrl,
    )
  );
}
export function expandedCaseAllowed(record: InjuryCase): boolean {
  return (
    expansionEnabled() &&
    expansion.cases.some(
      (c) =>
        c.id === record.id &&
        c.videoUrl === record.video.canonicalUrl &&
        c.recordDigest === sha256Hex(canonicalJson(record)),
    )
  );
}
export function observationClips(): ObservationClip[] {
  return expansionEnabled() ? allObservationClips : [];
}
