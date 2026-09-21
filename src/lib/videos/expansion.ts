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
import catalog200Data from "../../data/videos/catalog-200.v1.json";
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
    { id: "GCWl3Qk3fEQ", category: "peripheral-nerve", provider: "youtube" },
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
// Independent literal binding copied from the reviewed catalog-200 selection.
// Keep this snapshot separate from the production JSON it validates.
const catalog200SelectionSnapshot = [
  [
    "nathan-florence-2023-t12-fracture",
    "lqlkP27TXvA",
    "https://www.youtube.com/watch?v=lqlkP27TXvA",
    "Nathan Florence",
    "INSANE XXL JAWS PADDLE SESSION GOES DOWN",
    450,
    940,
    "injury-motion",
    "2023",
    null,
  ],
  [
    "billy-kemper-2020-pelvis-knee",
    "gGGMvPtjtZo",
    "https://www.youtube.com/watch?v=gGGMvPtjtZo",
    "World Surf League",
    "The Session Of A Lifetime Goes Horribly Wrong For Big Wave Champ Billy Kemper | BILLY Chapter 2",
    740,
    826,
    "athlete-interview",
    "2020",
    null,
  ],
  [
    "missy-franklin-2016-shoulder",
    "WevF13bkLAM",
    "https://www.youtube.com/watch?v=WevF13bkLAM",
    "SwimSwam",
    "Olympic Champion Missy Franklin Explains Her Shoulder Problems: GMM presented by SwimOutlet.com",
    130,
    1820,
    "athlete-interview",
    "2016",
    null,
  ],
  [
    "gabriel-medina-2025-pectoral-tendon",
    "z6KNabUBA88",
    "https://www.youtube.com/watch?v=z6KNabUBA88",
    "World Surf League",
    'Gabriel Medina’s magnificent return to the CT: "I’ve been here before" | [Inside Pro Surfing]',
    30,
    499,
    "athlete-interview",
    "2025",
    "2025-01-09",
  ],
  [
    "jj-watt-2019-pectoral",
    "D8492O0ciGY",
    "https://www.youtube.com/watch?v=D8492O0ciGY",
    "ESPN",
    "J.J. Watt exclusive ESPN interview on returning for Texans’ playoff run from injury | NFL on ESPN",
    100,
    942,
    "athlete-interview",
    "2019",
    "2019-10-27",
  ],
  [
    "zoey-clark-2023-disc-nerve",
    "7_GZg1qIZLQ",
    "https://www.youtube.com/watch?v=7_GZg1qIZLQ",
    "scottishathletics",
    "Zoey Clark: Fighting Back - A short documentary",
    95,
    495,
    "athlete-interview",
    "2023",
    null,
  ],
  [
    "chloe-kim-2026-shoulder",
    "iRo0jHPhr2I",
    "https://www.youtube.com/watch?v=iRo0jHPhr2I",
    "NBC News",
    "Olympic gold medalist Chloe Kim announces she dislocated her shoulder",
    0,
    15,
    "news-analysis",
    "2026",
    null,
  ],
  [
    "adam-peaty-2022-foot",
    "7oFg7YmMgtI",
    "https://www.youtube.com/watch?v=7oFg7YmMgtI",
    "Adam Ramsay-Peaty",
    "How I BROKE My Foot!",
    690,
    719,
    "athlete-interview",
    "2022",
    null,
  ],
  [
    "kerri-walsh-jennings-2015-shoulder",
    "RyWuQ_RW6OA",
    "https://www.youtube.com/watch?v=RyWuQ_RW6OA",
    "Beach Volleyball Majors",
    "Gstaad Major: This just might have been Kerri Walsh’s greatest comeback!",
    0,
    38,
    "athlete-interview",
    "2015",
    "2015-07-10",
  ],
  [
    "rafael-nadal-2022-abdominal",
    "9vGOrRkqAK4",
    "https://www.youtube.com/watch?v=9vGOrRkqAK4",
    "Wimbledon",
    "Rafael Nadal Withdraws from Wimbledon Due to Injury | Press Conference | Wimbledon 2022",
    15,
    678,
    "athlete-interview",
    "2022",
    null,
  ],
  [
    "jordyn-poulter-2022-knee",
    "xBgZKehMBDA",
    "https://www.youtube.com/watch?v=xBgZKehMBDA",
    "Elevate Yourself",
    "From ACL Injury To PARIS OLYMPICS | Jordyn Poulter Interview (VNL 2024)",
    15,
    792,
    "athlete-interview",
    "2022",
    "2022-12-03",
  ],
  [
    "paula-badosa-2023-spinal-stress-fracture",
    "X8X7Xg7UwD0",
    "https://www.youtube.com/watch?v=X8X7Xg7UwD0",
    "US Open Tennis Championships",
    "Paula Badosa Press Conference | 2024 US Open Round 4",
    250,
    410,
    "athlete-interview",
    "2023",
    null,
  ],
  [
    "rafael-nadal-2022-rib-stress-fracture",
    "vsc3sE7WwXk",
    "https://www.youtube.com/watch?v=vsc3sE7WwXk",
    "CGTN Sports Scene",
    "Nadal feels physically good after recovery from rib injury to take part in Madrid Open | MMOPEN",
    0,
    42,
    "athlete-interview",
    "2022",
    "2022-03-19",
  ],
  [
    "jake-wightman-2023-foot",
    "IpYzdWZ80CE",
    "https://www.youtube.com/watch?v=IpYzdWZ80CE",
    "CITIUS MAG",
    "Jake Wightman On His Return From Injury, Why He Thinks He Can Still Beat Jakob Ingebrigtsen",
    330,
    1645,
    "athlete-interview",
    "2023",
    null,
  ],
  [
    "karsten-warholm-2022-hamstring",
    "z7x0dxJf3Zk",
    "https://www.youtube.com/watch?v=z7x0dxJf3Zk",
    "FloTrack",
    "Karsten Warholm Injured, Suspects Hamstring Tear",
    15,
    621,
    "news-analysis",
    "2022",
    "2022-06-05",
  ],
  [
    "molly-seidel-2024-patella",
    "F-KkglTfq3Y",
    "https://www.youtube.com/watch?v=F-KkglTfq3Y",
    "FloTrack",
    "Molly Seidel on the other side of injury and looking ahead to fall marathon",
    285,
    547,
    "athlete-interview",
    "2024",
    null,
  ],
  [
    "jamahal-hill-2021-elbow",
    "hvH4AnAD5eg",
    "https://www.youtube.com/watch?v=hvH4AnAD5eg",
    "UFC",
    "UFC 263: Paul Craig Octagon Interview",
    63,
    133,
    "news-analysis",
    "2021",
    "2021-06-12",
  ],
  [
    "antonio-rodrigo-nogueira-2011-arm",
    "XdGi7XI5Y_c",
    "https://www.youtube.com/watch?v=XdGi7XI5Y_c",
    "UFC",
    "Full Blast: Munoz & Mitrione - Mir vs Nogueira",
    120,
    202,
    "news-analysis",
    "2011",
    "2011-12-10",
  ],
  [
    "tim-sylvia-2004-arm",
    "XEBZ9lSa8fM",
    "https://www.youtube.com/watch?v=XEBZ9lSa8fM",
    "UFC FIGHT PASS",
    "UFC: Frank Mir vs. Tim Sylvia | June 19, 2004",
    530,
    765,
    "injury-motion",
    "2004",
    "2004-06-19",
  ],
  [
    "ronaldo-jacare-souza-2021-humerus",
    "rkiD3kLGIvU",
    "https://www.youtube.com/watch?v=rkiD3kLGIvU",
    "UFC",
    "UFC 262: André Muniz Octagon Interview",
    125,
    207,
    "news-analysis",
    "2021",
    "2021-05-15",
  ],
  [
    "tom-aspinall-2022-knee",
    "sM8zlrTLroE",
    "https://www.youtube.com/watch?v=sM8zlrTLroE",
    "UFC",
    "Tom Aspinall Talks Octagon Return, Heavyweight Division & More | FULL INTERVIEW w/ John Gooden",
    925,
    2471,
    "athlete-interview",
    "2022",
    "2022-07-23",
  ],
  [
    "jordan-burroughs-2013-ankle",
    "sBzHuGCZdTI",
    "https://www.youtube.com/watch?v=sBzHuGCZdTI",
    "Trackwrestling .com",
    "Jordan Burroughs looks back on winning a World title four weeks after breaking his ankle",
    25,
    536,
    "athlete-interview",
    "2013",
    "2013-08-22",
  ],
  [
    "jofra-archer-2020-elbow-stress-fracture",
    "VNo4qQaVNHg",
    "https://www.youtube.com/watch?v=VNo4qQaVNHg",
    "England & Wales Cricket Board",
    "The Passion Never Went | EXCLUSIVE Jofra Archer Interview | Injuries, Playing For England & Future",
    0,
    195,
    "athlete-interview",
    "2020",
    null,
  ],
  [
    "manny-pacquiao-2015-shoulder",
    "l1dYgS6mqO0",
    "https://www.youtube.com/watch?v=l1dYgS6mqO0",
    "ABS-CBN News",
    "Pacquiao undergoes surgery for injured shoulder",
    0,
    142,
    "news-analysis",
    "2015",
    null,
  ],
  [
    "sky-brown-2024-shoulder",
    "5qWBA8MuN_4",
    "https://www.youtube.com/watch?v=5qWBA8MuN_4",
    "Sky Sports News",
    "It’s been an insane journey | Sky Brown on winning Olympic bronze after dislocating her shoulder",
    90,
    296,
    "athlete-interview",
    "2024",
    null,
  ],
  [
    "tony-hawk-2022-femur",
    "Kvm-WXQ2w2Y",
    "https://www.youtube.com/watch?v=Kvm-WXQ2w2Y",
    "Hawk vs Wolf",
    "Tony Hawk Recounts his Bad Fall at the Ramp; Straight from the Hospital to the Podcast!",
    250,
    3362,
    "athlete-interview",
    "2022",
    "2022-03-07",
  ],
  [
    "helen-maroulis-2018-concussion",
    "6dGzpQHXQsM",
    "https://www.youtube.com/watch?v=6dGzpQHXQsM",
    "WGN News",
    "Helen | Believe",
    145,
    212,
    "athlete-interview",
    "2018",
    null,
  ],
  [
    "tiger-woods-2008-tibial-stress-fractures",
    "kb_9JHJu1oo",
    "https://www.youtube.com/watch?v=kb_9JHJu1oo",
    "United States Golf Association (USGA)",
    "Tiger Woods’ 2008 U.S. Open Victory at Torrey Pines | Every Televised Shot | Champion’s Journey",
    1620,
    11470,
    "aftermath",
    "2008",
    null,
  ],
  [
    "mirabai-chanu-2023-hip",
    "1d3pOYyLQkY",
    "https://www.youtube.com/watch?v=1d3pOYyLQkY",
    "Oneindia Hindi",
    "Asian Games 2023 Day 7: Mirabai Chanu injured",
    20,
    130,
    "news-analysis",
    "2023",
    "2023-09-30",
  ],
  [
    "annemiek-van-vleuten-2022-elbow",
    "T7-DAQANyho",
    "https://www.youtube.com/watch?v=T7-DAQANyho",
    "Movistar Team",
    "Annemiek van Vleuten: The Last Interview | Movistar Team - 2023",
    273,
    478,
    "athlete-interview",
    "2022",
    "2022-09-21",
  ],
  [
    "daniel-andre-tande-2021-clavicle",
    "jQ7oMEGPHXg",
    "https://www.youtube.com/watch?v=jQ7oMEGPHXg",
    "FIS Ski Jumping",
    "Daniel Andre Tande is back! | FIS Ski Jumping",
    0,
    34,
    "athlete-interview",
    "2021",
    "2021-03-25",
  ],
  [
    "egan-bernal-2022-training-crash",
    "aXvM23KcbJw",
    "https://www.youtube.com/watch?v=aXvM23KcbJw",
    "INEOS Grenadiers / Netcompany INEOS",
    "Egan Bernal: The Best Day of my Life | INEOS Grenadiers behind the scenes",
    20,
    227,
    "athlete-interview",
    "2022",
    "2022-01-24",
  ],
  [
    "connor-fields-2021-brain-hemorrhage",
    "kti0XvZn0KQ",
    "https://www.youtube.com/watch?v=kti0XvZn0KQ",
    "Barry Shore",
    "The Real Price of the Podium: Connor Fields on Recovery, Identity, and the Power of Choice",
    1475,
    3284,
    "athlete-interview",
    "2021",
    "2021-07-30",
  ],
  [
    "novak-djokovic-2017-elbow",
    "8H_0tJAwev8",
    "https://www.youtube.com/watch?v=8H_0tJAwev8",
    "Wimbledon",
    "Novak Djokovic Wimbledon 2017 quarter-final press conference",
    0,
    114,
    "athlete-interview",
    "2017",
    null,
  ],
  [
    "kei-nishikori-2017-wrist",
    "_9PMTWdYX6I",
    "https://www.youtube.com/watch?v=_9PMTWdYX6I",
    "ATP Tour",
    "Nishikori On The Comeback Trail",
    15,
    224,
    "athlete-interview",
    "2017",
    null,
  ],
  [
    "bianca-andreescu-2023-ankle",
    "4O87O9rHdoE",
    "https://www.youtube.com/watch?v=4O87O9rHdoE",
    "Tennis Channel",
    "Bianca Andreescu Injury Update | Tennis Channel Live",
    0,
    91,
    "news-analysis",
    "2023",
    "2023-03-27",
  ],
  [
    "juan-martin-del-potro-2017-wrist-contusion",
    "_qp50gF67sQ",
    "https://www.youtube.com/watch?v=_qp50gF67sQ",
    "ATP Tour",
    "Del Potro Opens Up About Wrist Injury Shanghai 2017",
    0,
    120,
    "athlete-interview",
    "2017",
    "2017-10-13",
  ],
  [
    "rafael-nadal-2016-wrist",
    "yH1WExdlI4Q",
    "https://www.youtube.com/watch?v=yH1WExdlI4Q",
    "Roland-Garros",
    "Rafael Nadal Withdraws from 2016 Roland-Garros",
    0,
    208,
    "athlete-interview",
    "2016",
    null,
  ],
  [
    "nikola-karabatic-2020-acl",
    "ApTbpxIuUJ8",
    "https://www.youtube.com/watch?v=ApTbpxIuUJ8",
    "PSG HANDBALL",
    "Une séance avec Nikola Karabatic",
    0,
    162,
    "aftermath",
    "2020",
    "2020-10-17",
  ],
  [
    "kelly-slater-2017-foot",
    "WhCalbwjLJg",
    "https://www.youtube.com/watch?v=WhCalbwjLJg",
    "World Surf League",
    "Injury Update: Kelly Slater Breaks Foot During Free Surf Session - Corona Open J-Bay 2017",
    25,
    225,
    "aftermath",
    "2017",
    "2017-07-17",
  ],
  [
    "sally-fitzgibbons-2015-eardrum",
    "wTaCr8olPck",
    "https://www.youtube.com/watch?v=wTaCr8olPck",
    "World Surf League",
    "One Of The Toughest Performances Ever - Sally Fitzgibbons Wins ’15 Fiji With A Busted Ear!!",
    45,
    351,
    "news-analysis",
    "2015",
    "2015-06-02",
  ],
  [
    "emma-raducanu-2022-2023-wrists",
    "ZQL-1NY5erY",
    "https://www.youtube.com/watch?v=ZQL-1NY5erY",
    "Sky Sports News",
    "Emma Raducanu to miss the French Open & Wimbledon after undergoing surgery on her wrists & ankle",
    25,
    88,
    "news-analysis",
    "2023",
    null,
  ],
] as const;
const catalog200Selections = new Map<string, readonly unknown[]>(
  catalog200SelectionSnapshot.map(([slug, ...binding]) => [slug, binding]),
);
export const catalog200Schema = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("catalog-200-2026-09-21"),
    clips: z.array(observationClipSchema).length(42),
  })
  .superRefine((value, ctx) => {
    const prior = [
      ...priorObservationClips,
      ...judgeRib.clips,
      ...ribFractureThree.clips,
      ...nerveFour.clips,
    ];
    const slugs = new Set([
      ...prior.map((c) => c.slug),
      ...expansion.cases.map((c) => c.slug),
      // The original launch ledger stores IDs, so reserve its five core slugs explicitly.
      "anfernee-simons-ankle-sprain-2023",
      "kevin-durant-achilles-rupture-2019",
      "kyrie-irving-ankle-sprain-2021",
      "lamelo-ball-ankle-sprain-2023",
      "lamelo-ball-ankle-sprain-2025",
    ]);
    const ids = new Set([
      ...prior.map((c) => c.videoId),
      ...[...launchData.cases, ...expansion.cases].map((c) =>
        parseYouTubeVideoId(c.videoUrl),
      ),
    ]);
    const events = new Set(
      prior
        .map(observationEventKey)
        .filter((key): key is string => key !== null),
    );
    for (const clip of value.clips) {
      const event = observationEventKey(clip);
      const expected = catalog200Selections.get(clip.slug);
      const actual = [
        clip.videoId,
        clip.videoUrl,
        clip.publisher,
        clip.sourceTitle,
        clip.startSeconds,
        clip.durationSeconds,
        clip.footageKind,
        clip.eventYear,
        clip.eventDate,
      ];
      if (
        !expected ||
        JSON.stringify(expected) !== JSON.stringify(actual) ||
        slugs.has(clip.slug) ||
        ids.has(clip.videoId) ||
        (event !== null && events.has(event)) ||
        clip.provider !== "youtube" ||
        parseYouTubeVideoId(clip.videoUrl) !== clip.videoId ||
        clip.startSeconds >= clip.durationSeconds ||
        clip.sources.length === 0 ||
        (clip.returnDate !== null &&
          (clip.eventDate === null || clip.returnDate < clip.eventDate))
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid catalog-200 clip: " + clip.slug,
        });
      }
      slugs.add(clip.slug);
      ids.add(clip.videoId);
      if (event !== null) events.add(event);
    }
  });
export const catalog200 = catalog200Schema.parse(catalog200Data);
export const allObservationClips: ObservationClip[] = [
  ...priorObservationClips,
  ...judgeRib.clips,
  ...ribFractureThree.clips,
  ...nerveFour.clips,
  ...catalog200.clips,
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
