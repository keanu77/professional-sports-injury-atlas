/** Generates the append-only Decision 15 photo-first registry successor. */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalJson,
  parseStrictJson,
  sha256Hex,
} from "../src/lib/contracts/canonical";
import {
  DECISION_15_ALLOWED_BY_SA_USE_KINDS,
  DECISION_15_FORBIDDEN_BY_SA_USE_KINDS,
  DECISION_15_NON_CLEARANCE_STATEMENT,
  DECISION_15_POLICY_BINDING,
  DECISION_15_PROTECTED_ATHLETES,
  DECISION_15_REGISTRY_V6_BINDING,
  DECISION_15_TARGET_ATHLETES,
  type Decision15CcLicense,
  type Decision15PhotoCandidate,
  type Decision15RecordedFact,
} from "../src/lib/contracts/decision-15-photo-contract";
import {
  PLAYER_PHOTO_POLICY_V8_BINDING,
  PLAYER_PHOTO_REGISTRY_V7_OWNER_ACCEPTED_RESIDUAL_RISKS,
  PLAYER_PHOTO_REGISTRY_V7_PATH,
  PLAYER_PHOTO_REGISTRY_V7_PHASE_EVIDENCE,
  PLAYER_PHOTO_REGISTRY_V7_PREDECESSOR,
  PLAYER_PHOTO_REGISTRY_V7_SCOPE_ID,
  type PlayerPhotoDecision15SelectionV7,
  type PlayerPhotoRegistryV7,
} from "../src/lib/contracts/player-photo-registry-v7";
import type { PlayerPhotoRegistryV6 } from "../src/lib/contracts/player-photo-registry-v6";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const checkedAt = "2026-08-14";
const checkedBy = "decision-15-photo-review";
const adoptionReason =
  "replaces-current-svg-after-v8-explicit-rights-qualification";

const ccBy2 = {
  bucket: "cc-by",
  name: "CC BY 2.0",
  token: "cc-by-2.0",
  url: "https://creativecommons.org/licenses/by/2.0",
  version: "2.0",
} as const satisfies Decision15CcLicense;
const ccBySa2 = {
  bucket: "cc-by-sa",
  name: "CC BY-SA 2.0",
  token: "cc-by-sa-2.0",
  url: "https://creativecommons.org/licenses/by-sa/2.0",
  version: "2.0",
} as const satisfies Decision15CcLicense;
const ccBySa4 = {
  bucket: "cc-by-sa",
  name: "CC BY-SA 4.0",
  token: "cc-by-sa-4.0",
  url: "https://creativecommons.org/licenses/by-sa/4.0",
  version: "4.0",
} as const satisfies Decision15CcLicense;

interface CandidateSeed {
  alteration: string;
  athleteName: (typeof DECISION_15_TARGET_ATHLETES)[number];
  byteLength: number;
  copyrightNotice?: string;
  credit: string;
  descriptionUrl: string;
  differentEventEvidence: string;
  focalPosition: { xPercent: number; yPercent: number };
  height: number;
  identityEvidence: string;
  license: Decision15CcLicense | null;
  mediaWikiSha1: string;
  nonInjuryCaption: string;
  originalFileUrl: string;
  otherNotice?: string;
  publicDomainStatement?: string;
  revisionId: number;
  revisionPermalink: string;
  revisionTimestamp: string;
  revisionTitle: string;
  rightsStatementSource?: string;
  slug: string;
  workTitle?: string;
  width: number;
}

const candidates: CandidateSeed[] = [
  {
    alteration:
      "Commons CropTool derivative; unmodified local original with site CSS presentation crop.",
    athleteName: "Anfernee Simons",
    byteLength: 1365032,
    credit: "Frenchieinportland",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:AnferneeSimons_(cropped).jpg",
    differentEventEvidence:
      "The source is the 2019-12-04 Kings–Blazers regular-season pregame/warm-up, different from the governed 2023-02-14 injury event.",
    focalPosition: { xPercent: 50, yPercent: 13 },
    height: 3070,
    identityEvidence:
      "The fixed Commons revision identifies Anfernee Simons as the depicted athlete.",
    license: ccBySa4,
    mediaWikiSha1: "ebad62aead18a3f41498c2760e7100303605e5c3",
    nonInjuryCaption:
      "Anfernee Simons 於 2019-12-04 國王對拓荒者賽前熱身；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/ea/AnferneeSimons_%28cropped%29.jpg",
    revisionId: 827612495,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AAnferneeSimons_%28cropped%29.jpg&oldid=827612495",
    revisionTimestamp: "2023-12-03T18:11:38Z",
    revisionTitle: "File:AnferneeSimons (cropped).jpg",
    slug: "anfernee-simons",
    width: 2563,
  },
  {
    alteration:
      "No source crop declared; unmodified local original with site CSS presentation crop.",
    athleteName: "Anthony Edwards",
    byteLength: 4531034,
    credit: "Bryan Berlin / WikiPortraits",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Anthony_Edwards_Argentina_v_Egypt_7_July_2026-069.jpg",
    differentEventEvidence:
      "The source depicts Anthony Edwards at Argentina–Egypt on 2026-07-07, different from both governed NBA injury events.",
    focalPosition: { xPercent: 50, yPercent: 13 },
    height: 5000,
    identityEvidence:
      "The fixed Commons revision identifies Anthony Edwards as the depicted athlete.",
    license: ccBySa4,
    mediaWikiSha1: "51b1d4498043862a969fad316724115ee834b918",
    nonInjuryCaption:
      "Anthony Edwards 於 2026-07-07 阿根廷對埃及賽事場合；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/21/Anthony_Edwards_Argentina_v_Egypt_7_July_2026-069.jpg",
    otherNotice: "Personality rights warning",
    revisionId: 1253738497,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AAnthony%20Edwards%20Argentina%20v%20Egypt%207%20July%202026-069.jpg&oldid=1253738497",
    revisionTimestamp: "2026-07-29T14:37:54Z",
    revisionTitle: "File:Anthony Edwards Argentina v Egypt 7 July 2026-069.jpg",
    slug: "anthony-edwards",
    width: 3333,
  },
  {
    alteration:
      "Commons cropped/extracted derivative; unmodified local original with site CSS presentation crop.",
    athleteName: "Brandon Clarke",
    byteLength: 3872559,
    credit: "Erik Drost",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Brandon_Clarke_(51814063744)_(cropped).jpg",
    differentEventEvidence:
      "The source is Memphis–Cleveland live action on 2022-01-04, different from the governed 2023-03-03 injury event.",
    focalPosition: { xPercent: 50, yPercent: 5 },
    height: 3000,
    identityEvidence:
      "The fixed Commons revision identifies Brandon Clarke as the depicted athlete.",
    license: ccBy2,
    mediaWikiSha1: "c5c5429b5f70bae7a354622a7cdd32a253775556",
    nonInjuryCaption:
      "Brandon Clarke 於 2022-01-04 灰熊對騎士賽事；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/58/Brandon_Clarke_%2851814063744%29_%28cropped%29.jpg",
    revisionId: 1244619086,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ABrandon%20Clarke%20(51814063744)%20(cropped).jpg&oldid=1244619086",
    revisionTimestamp: "2026-07-07T04:40:33Z",
    revisionTitle: "File:Brandon Clarke (51814063744) (cropped).jpg",
    slug: "brandon-clarke",
    width: 1892,
  },
  {
    alteration:
      "No source crop declared; unmodified local original with site CSS presentation crop.",
    athleteName: "Danny Green",
    byteLength: 74488,
    credit: "Des Runyan",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Danny_Green_dance_Senior_Day.jpg",
    differentEventEvidence:
      "The source is Senior Day on 2009-03-08, different from the governed 2022-05-12 injury event.",
    focalPosition: { xPercent: 50, yPercent: 45 },
    height: 480,
    identityEvidence:
      "The fixed Commons revision and description identify Danny Green as the depicted athlete.",
    license: ccBy2,
    mediaWikiSha1: "d1286f2fa1a02eb229f5a095f364a450e6d2cb7b",
    nonInjuryCaption:
      "Danny Green 於 2009-03-08 北卡 Senior Day；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/a/a6/Danny_Green_dance_Senior_Day.jpg",
    revisionId: 1088225177,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ADanny%20Green%20dance%20Senior%20Day.jpg&oldid=1088225177",
    revisionTimestamp: "2025-09-20T10:31:14Z",
    revisionTitle: "File:Danny Green dance Senior Day.jpg",
    slug: "danny-green",
    width: 640,
    workTitle: "P1010646.JPG",
  },
  {
    alteration:
      "No source crop declared; unmodified local original with site CSS presentation crop.",
    athleteName: "Dejounte Murray",
    byteLength: 1583907,
    credit:
      "U.S. Navy photo by Mass Communication Specialist 2nd Class Shayla D. Hamilton/Released",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Dejounte_Murray_Tours_the_METC_(5148235).jpg",
    differentEventEvidence:
      "The source was recorded on 2019-02-27/28, different from the governed 2025-01-31 injury event.",
    focalPosition: { xPercent: 72, yPercent: 45 },
    height: 1870,
    identityEvidence:
      "The fixed Commons and DVIDS records identify Dejounte Murray as the depicted athlete.",
    license: null,
    mediaWikiSha1: "1c0d39ee222223567aeb4e19a80bf8150210be19",
    nonInjuryCaption:
      "Dejounte Murray 於 2019-02-27/28 參訪 METC；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/7/79/Dejounte_Murray_Tours_the_METC_%285148235%29.jpg",
    otherNotice: "/Released",
    publicDomainStatement:
      "Public domain — PD-USGov-Military-Navy, a work of the United States Navy.",
    revisionId: 1199576196,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ADejounte%20Murray%20Tours%20the%20METC%20(5148235).jpg&oldid=1199576196",
    revisionTimestamp: "2026-04-18T14:52:21Z",
    revisionTitle: "File:Dejounte Murray Tours the METC (5148235).jpg",
    rightsStatementSource:
      "https://www.dvidshub.net/image/5148235/dejounte-murray-tours-metc",
    slug: "dejounte-murray",
    width: 2602,
    workTitle: "Dejounte Murray Tours the METC",
  },
  {
    alteration:
      "No source crop declared; unmodified local original with site CSS presentation crop.",
    athleteName: "Ja Morant",
    byteLength: 1842653,
    credit: "Katie Dugan / Gamecock Central",
    descriptionUrl: "https://commons.wikimedia.org/wiki/File:Ja_Morant.jpg",
    differentEventEvidence:
      "The source metadata is dated 2019-07-28, different from the governed 2020-12-28 injury event.",
    focalPosition: { xPercent: 45, yPercent: 40 },
    height: 3197,
    identityEvidence:
      "The fixed Commons revision identifies Ja Morant as the depicted athlete; the displayed Katie Dugan and Gamecock Central names are preserved without an authority inference.",
    license: ccBy2,
    mediaWikiSha1: "2295ea14f7883f33de3fefc9a425052e194cb21c",
    nonInjuryCaption: "Ja Morant 的 2019-07-28 球員照片；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/7/71/Ja_Morant.jpg",
    revisionId: 981268435,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AJa%20Morant.jpg&oldid=981268435",
    revisionTimestamp: "2025-01-08T23:47:02Z",
    revisionTitle: "File:Ja Morant.jpg",
    slug: "ja-morant",
    width: 4796,
    workTitle: "Ja Morant",
  },
  {
    alteration:
      "Commons crop derivative; unmodified local original with site CSS presentation crop.",
    athleteName: "Joe Ingles",
    byteLength: 1090689,
    credit: "Frenchieinportland",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Joe_Ingles_Utah_(cropped).jpg",
    differentEventEvidence:
      "The source is Utah–Portland live preseason competition on 2018-10-07, different from the governed 2022-01-30 injury event.",
    focalPosition: { xPercent: 50, yPercent: 8 },
    height: 2334,
    identityEvidence:
      "The fixed Commons revision and parent identify Joe Ingles as the depicted athlete.",
    license: ccBySa4,
    mediaWikiSha1: "ea5ad8bffa1b0fba6805d7725ae90c4688966864",
    nonInjuryCaption:
      "Joe Ingles 於 2018-10-07 爵士對拓荒者季前賽；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/d/de/Joe_Ingles_Utah_%28cropped%29.jpg",
    revisionId: 877365146,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AJoe_Ingles_Utah_%28cropped%29.jpg&oldid=877365146",
    revisionTimestamp: "2024-05-18T20:00:27Z",
    revisionTitle: "File:Joe Ingles Utah (cropped).jpg",
    slug: "joe-ingles",
    width: 1453,
  },
  {
    alteration:
      "Commons CropTool derivative; unmodified local original with site CSS presentation crop.",
    athleteName: "LaMelo Ball",
    byteLength: 7261079,
    copyrightNotice: "Erik Drost",
    credit: "Erik Drost",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:LaMelo_Ball_(cropped).jpg",
    differentEventEvidence:
      "The source is the 2022-02-20 All-Star Game, different from all three governed injury events.",
    focalPosition: { xPercent: 50, yPercent: 4 },
    height: 3242,
    identityEvidence:
      "The fixed Commons revision identifies LaMelo Ball as the depicted athlete.",
    license: ccBy2,
    mediaWikiSha1: "c46d8d44ae566670b012801f4874d81520e4e81c",
    nonInjuryCaption:
      "LaMelo Ball 於 2022-02-20 NBA 全明星賽；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/f/f9/LaMelo_Ball_%28cropped%29.jpg",
    revisionId: 1130229739,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ALaMelo_Ball_%28cropped%29.jpg&oldid=1130229739",
    revisionTimestamp: "2025-12-13T07:33:56Z",
    revisionTitle: "File:LaMelo Ball (cropped).jpg",
    slug: "lamelo-ball",
    width: 2415,
    workTitle: "LaMelo Ball",
  },
  {
    alteration:
      "No Commons source crop declared; unmodified local original with site CSS presentation crop.",
    athleteName: "Markelle Fultz",
    byteLength: 5387248,
    credit: "Mogami Kariya",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Markelle_Fultz_(50639078246).jpg",
    differentEventEvidence:
      "The source is Wizards–Magic on 2019-12-03, different from the governed 2021-01-06 injury event.",
    focalPosition: { xPercent: 50, yPercent: 12 },
    height: 3899,
    identityEvidence:
      "The fixed Commons revision identifies Markelle Fultz as the depicted athlete.",
    license: ccBySa2,
    mediaWikiSha1: "0d1c39b3e7a0f60dcac7afecef7c8eea19888bac",
    nonInjuryCaption:
      "Markelle Fultz 於 2019-12-03 巫師對魔術賽事；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/eb/Markelle_Fultz_%2850639078246%29.jpg",
    revisionId: 1130452222,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3AMarkelle_Fultz_%2850639078246%29.jpg&oldid=1130452222",
    revisionTimestamp: "2025-12-13T16:58:30Z",
    revisionTitle: "File:Markelle Fultz (50639078246).jpg",
    slug: "markelle-fultz",
    width: 2600,
    workTitle: "Markelle Fultz",
  },
  {
    alteration:
      "No source crop declared; unmodified local original with site CSS presentation crop.",
    athleteName: "Moritz Wagner",
    byteLength: 494333,
    copyrightNotice: "Sandro Halank, CC BY-SA 4.0",
    credit: "Sandro Halank, Wikimedia Commons",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:2023-08-09_Deutschland_gegen_Kanada_(Basketball-L%C3%A4nderspiel)_by_Sandro_Halank%E2%80%93145.jpg",
    differentEventEvidence:
      "The source is Germany–Canada preparation-match action on 2023-08-09, different from the governed 2024-12-21 injury event.",
    focalPosition: { xPercent: 50, yPercent: 10 },
    height: 1145,
    identityEvidence:
      "The fixed Commons revision identifies Moritz Wagner as the depicted athlete.",
    license: ccBySa4,
    mediaWikiSha1: "707f1a01f2ea6a642f8fc97d49d7092de16c487d",
    nonInjuryCaption:
      "Moritz Wagner 於 2023-08-09 德國對加拿大熱身賽；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/c/c1/2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93145.jpg",
    otherNotice: "Personality rights warning",
    revisionId: 967382118,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3A2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93145.jpg&oldid=967382118",
    revisionTimestamp: "2024-12-07T23:55:17Z",
    revisionTitle:
      "File:2023-08-09 Deutschland gegen Kanada (Basketball-Länderspiel) by Sandro Halank–145.jpg",
    slug: "moritz-wagner",
    width: 1071,
    workTitle: "Basketball-Länderspiel: Deutschland gegen Kanada",
  },
  {
    alteration:
      "No source crop declared; unmodified local original with site CSS presentation crop.",
    athleteName: "Ricky Rubio",
    byteLength: 2144172,
    credit: "Joe Bielawa",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Ricky_Rubio_at_Lynx_game.jpg",
    differentEventEvidence:
      "The source is a Lynx game on 2012-05-20, different from the governed 2021-12-28 injury event.",
    focalPosition: { xPercent: 42, yPercent: 16 },
    height: 4608,
    identityEvidence:
      "The fixed Commons revision identifies Ricky Rubio as the depicted athlete.",
    license: ccBy2,
    mediaWikiSha1: "e9bd49908fe9e5945d0aa16f9dd2d816340a75fd",
    nonInjuryCaption:
      "Ricky Rubio 於 2012-05-20 明尼蘇達山貓賽事場合；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/1f/Ricky_Rubio_at_Lynx_game.jpg",
    revisionId: 1179110385,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ARicky%20Rubio%20at%20Lynx%20game.jpg&oldid=1179110385",
    revisionTimestamp: "2026-03-10T22:18:53Z",
    revisionTitle: "File:Ricky Rubio at Lynx game.jpg",
    slug: "ricky-rubio",
    width: 3072,
    workTitle: "Lynx.DSC_0676.5:20:12",
  },
  {
    alteration:
      "No source crop declared; unmodified local original with site CSS presentation crop.",
    athleteName: "Thomas Bryant",
    byteLength: 1345351,
    credit: "TonyTheTiger",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:20150329_MCDAAG_closed_practice_Thomas_Bryant_(1).JPG",
    differentEventEvidence:
      "The source is the McDonald's All-American closed practice on 2015-03-29, different from the governed 2021-01-09 injury event.",
    focalPosition: { xPercent: 67, yPercent: 0 },
    height: 3919,
    identityEvidence:
      "The fixed Commons revision identifies Thomas Bryant as the depicted athlete.",
    license: ccBySa4,
    mediaWikiSha1: "d2f87cf6324edfc9039ccc1e6e4994577bacc7f7",
    nonInjuryCaption:
      "Thomas Bryant 於 2015-03-29 麥當勞全美賽封閉練習；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/54/20150329_MCDAAG_closed_practice_Thomas_Bryant_%281%29.JPG",
    revisionId: 957946914,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3A20150329%20MCDAAG%20closed%20practice%20Thomas%20Bryant%20(1).JPG&oldid=957946914",
    revisionTimestamp: "2024-11-16T22:55:13Z",
    revisionTitle: "File:20150329 MCDAAG closed practice Thomas Bryant (1).JPG",
    slug: "thomas-bryant",
    width: 2612,
  },
  {
    alteration:
      "Commons extraction and CropTool derivative; unmodified local original with site CSS presentation crop.",
    athleteName: "Trae Young",
    byteLength: 39619306,
    copyrightNotice: "Erik Drost",
    credit: "Erik Drost",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:Trae_Young_(2022_All-Star_Weekend)_(cropped).jpg",
    differentEventEvidence:
      "The source is All-Star Weekend on 2022-02-19, different from the governed 2021-04-21 injury event.",
    focalPosition: { xPercent: 50, yPercent: 35 },
    height: 5504,
    identityEvidence:
      "The fixed Commons revision identifies Trae Young as the depicted athlete.",
    license: ccBy2,
    mediaWikiSha1: "193bb8a75e73f878359d136f0769205a4a8693ba",
    nonInjuryCaption:
      "Trae Young 於 2022-02-19 NBA 全明星週末；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/4/42/Trae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg",
    revisionId: 1148485505,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3ATrae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg&oldid=1148485505",
    revisionTimestamp: "2026-01-16T19:13:29Z",
    revisionTitle: "File:Trae Young (2022 All-Star Weekend) (cropped).jpg",
    slug: "trae-young",
    width: 6351,
    workTitle: "Trae Young",
  },
  {
    alteration:
      "Commons extraction and CropTool derivative; unmodified local original with site CSS presentation crop.",
    athleteName: "Tyrese Haliburton",
    byteLength: 6113037,
    credit: "Chensiyuan",
    descriptionUrl:
      "https://commons.wikimedia.org/wiki/File:1_tyrese_haliburton_2025_(cropped_2).jpg",
    differentEventEvidence:
      "The source is Pacers–Wizards on 2025-03-28, different from the governed 2025-06-22 injury event.",
    focalPosition: { xPercent: 50, yPercent: 8 },
    height: 3169,
    identityEvidence:
      "The fixed Commons revision and parent identify Tyrese Haliburton as the depicted athlete.",
    license: ccBySa4,
    mediaWikiSha1: "45d283ff520c757dc5eeb4993aa24b3ca91a7b13",
    nonInjuryCaption:
      "Tyrese Haliburton 於 2025-03-28 溜馬對巫師賽事；非本案例受傷當下影像",
    originalFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/1/16/1_tyrese_haliburton_2025_%28cropped_2%29.jpg",
    revisionId: 1202611768,
    revisionPermalink:
      "https://commons.wikimedia.org/w/index.php?title=File%3A1_tyrese_haliburton_2025_%28cropped_2%29.jpg&oldid=1202611768",
    revisionTimestamp: "2026-04-24T03:36:57Z",
    revisionTitle: "File:1 tyrese haliburton 2025 (cropped 2).jpg",
    slug: "tyrese-haliburton",
    width: 2063,
  },
];

function recordedFact(
  sourceUrl: string,
  text: string | undefined,
): Decision15RecordedFact {
  return text === undefined
    ? { sourceUrl, status: "not-supplied", text: null }
    : { sourceUrl, status: "supplied", text };
}

function adapterLicense(license: Decision15CcLicense | null) {
  return license?.bucket === "cc-by-sa"
    ? {
        name: license.name,
        scope: "crop-contribution-only" as const,
        token: license.token,
        url: license.url,
      }
    : null;
}

const predecessorBytes = readFileSync(
  resolve(root, PLAYER_PHOTO_REGISTRY_V7_PREDECESSOR.path),
  "utf8",
);
if (
  sha256Hex(predecessorBytes) !== PLAYER_PHOTO_REGISTRY_V7_PREDECESSOR.sha256
) {
  throw new Error("Frozen player-photo registry v6 bytes changed");
}
const predecessor = parseStrictJson(predecessorBytes) as PlayerPhotoRegistryV6;
const previousByAthlete = new Map(
  predecessor.selections.map((selection) => [selection.athleteName, selection]),
);

function selectionFrom(seed: CandidateSeed): PlayerPhotoDecision15SelectionV7 {
  const previous = previousByAthlete.get(seed.athleteName);
  if (previous?.coverKind !== "original-svg-fallback") {
    throw new Error(`${seed.athleteName} is not an exact v6 SVG target`);
  }
  const localPath = `src/assets/players/decision-15/${seed.slug}.jpg`;
  const localBytes = readFileSync(resolve(root, localPath));
  if (
    localBytes.byteLength !== seed.byteLength ||
    createHash("sha1").update(localBytes).digest("hex") !== seed.mediaWikiSha1
  ) {
    throw new Error(`${seed.athleteName} original binary facts drifted`);
  }

  const displayedCredit = recordedFact(seed.revisionPermalink, seed.credit);
  const workTitle = recordedFact(seed.revisionPermalink, seed.workTitle);
  const copyrightNotice = recordedFact(
    seed.revisionPermalink,
    seed.copyrightNotice,
  );
  const disclaimerNotice = recordedFact(seed.revisionPermalink, undefined);
  const otherNotice = recordedFact(seed.revisionPermalink, seed.otherNotice);
  const candidate: Decision15PhotoCandidate = {
    athleteName: seed.athleteName,
    caseIds: [...previous.caseIds],
    crop: {
      adapterLicense: adapterLicense(seed.license),
      checkedAt,
      checkedBy,
      focalPosition: seed.focalPosition,
      localFileIsUnmodifiedOriginal: true,
      presentation: "css-object-fit-cover-crop",
      ratios: [
        { aspectRatio: "5:2", subjectSafe: true },
        { aspectRatio: "16:9", subjectSafe: true },
      ],
    },
    depictedAthleteName: seed.athleteName,
    identityEvidence: seed.identityEvidence,
    injuryEventRelationships: previous.caseIds.map((caseId) => ({
      caseId,
      evidence: seed.differentEventEvidence,
      status: "different-from-governed-injury-event-verified",
    })),
    lineage: {
      policy: { ...DECISION_15_POLICY_BINDING },
      predecessorRegistry: { ...DECISION_15_REGISTRY_V6_BINDING },
    },
    nonClearanceStatement: DECISION_15_NON_CLEARANCE_STATEMENT,
    nonInjuryCaption: seed.nonInjuryCaption,
    originalBinary: {
      downloadDate: checkedAt,
      localFile: {
        byteLength: seed.byteLength,
        height: seed.height,
        mimeType: "image/jpeg",
        path: localPath,
        sha256: sha256Hex(localBytes),
        width: seed.width,
      },
      original: {
        byteLength: seed.byteLength,
        filenameOrPlatformAssetId: decodeURIComponent(
          basename(new URL(seed.originalFileUrl).pathname),
        ),
        height: seed.height,
        mimeType: "image/jpeg",
        retrievalIdentity: seed.originalFileUrl,
        width: seed.width,
      },
      retrievalKind: "original-binary",
    },
    rightsMarker:
      seed.license === null
        ? {
            alterationDisclosure: seed.alteration,
            attributionCondition: null,
            copyrightNotice,
            displayedCredit,
            disclaimerNotice,
            fulfillment: {
              alterationDisclosed: true,
              copyrightNoticeVisibleWhenSupplied: true,
              creditVisibleWhenSupplied: true,
              disclaimerNoticeVisibleWhenSupplied: true,
              fixedSourceEvidenceVisible: true,
              otherNoticeVisibleWhenSupplied: true,
              termsOrStatusLinkVisible: true,
              titleVisibleWhenSupplied: true,
            },
            licenseName: null,
            licenseVersion: null,
            markerAppliesToExactWork: true,
            markerKind: "united-states-government-work-statement",
            markerStatus: "explicit",
            otherNotice,
            rightsBucket: "public-domain",
            rightsLinkOrStatementSource: seed.rightsStatementSource ?? null,
            statement: seed.publicDomainStatement ?? null,
            token: "PD-USGov-Military-Navy",
            workPageUrl: seed.revisionPermalink,
            workTitle,
          }
        : {
            alterationDisclosure: seed.alteration,
            attributionCondition: "license-conditions-apply",
            copyrightNotice,
            displayedCredit,
            disclaimerNotice,
            fulfillment: {
              alterationDisclosed: true,
              copyrightNoticeVisibleWhenSupplied: true,
              creditVisibleWhenSupplied: true,
              disclaimerNoticeVisibleWhenSupplied: true,
              fixedSourceEvidenceVisible: true,
              otherNoticeVisibleWhenSupplied: true,
              termsOrStatusLinkVisible: true,
              titleVisibleWhenSupplied: true,
            },
            licenseName: seed.license.name,
            licenseVersion: seed.license.version,
            markerAppliesToExactWork: true,
            markerKind: "creative-commons-license",
            markerStatus: "explicit",
            otherNotice,
            rightsBucket: seed.license.bucket,
            rightsLinkOrStatementSource: seed.license.url,
            statement: null,
            token: seed.license.token,
            workPageUrl: seed.revisionPermalink,
            workTitle,
          },
    sourceEvidence: {
      checkedAt,
      checkedBy,
      descriptionUrl: seed.descriptionUrl,
      originalFileUrl: seed.originalFileUrl,
      platform: "wikimedia-commons",
      revisionId: seed.revisionId,
      revisionPermalink: seed.revisionPermalink,
      revisionTimestamp: seed.revisionTimestamp,
    },
    supersession: {
      previousLocalFilePath: previous.localFile.path,
      previousLocalFileSha256: previous.localFile.sha256,
      reason: adoptionReason,
    },
  };

  return {
    athleteName: candidate.athleteName,
    caseIds: [...candidate.caseIds],
    commonsDescriptionUrl: seed.descriptionUrl,
    commonsDownloadUrl: seed.originalFileUrl,
    coverKind: "commons-photo",
    cropValidation: candidate.crop,
    currentCoverStatus: "current",
    decision15Evidence: candidate,
    focalPosition: candidate.crop.focalPosition,
    license:
      seed.license === null
        ? null
        : {
            name: seed.license.name,
            token: seed.license.token,
            url: seed.license.url,
          },
    localFile: candidate.originalBinary.localFile,
    nonEventCaption: candidate.nonInjuryCaption,
    originalMediaWikiSha1: seed.mediaWikiSha1,
    photographerIdentity: {
      name: seed.credit,
      sourceUrl: seed.revisionPermalink,
    },
    rightsAttribution: {
      adapterLicense: candidate.crop.adapterLicense,
      alterationState: {
        disclosure: candidate.rightsMarker.alterationDisclosure,
        presentation: "css-object-fit-cover-crop",
      },
      copyrightNotice,
      disclaimerNotice,
      displayedCredit,
      licenseBucket: candidate.rightsMarker.rightsBucket!,
      otherPerFileNotice: otherNotice,
      workTitle,
    },
    sourceRevision: {
      checkedAt,
      id: seed.revisionId,
      permalink: seed.revisionPermalink,
      timestamp: seed.revisionTimestamp,
      title: seed.revisionTitle,
    },
    supersession: candidate.supersession,
    usePolicy:
      seed.license?.bucket === "cc-by-sa"
        ? {
            allowedUseKinds: [...DECISION_15_ALLOWED_BY_SA_USE_KINDS],
            forbiddenUseKinds: [...DECISION_15_FORBIDDEN_BY_SA_USE_KINDS],
            mode: "placement-rendition-only",
          }
        : {
            mode:
              seed.license === null
                ? "public-domain-placement"
                : "ordinary-attributed-placement",
          },
  };
}

const adoptedSelections = new Map(
  candidates.map((seed) => [seed.athleteName, selectionFrom(seed)]),
);
if (
  adoptedSelections.size !== DECISION_15_TARGET_ATHLETES.length ||
  DECISION_15_TARGET_ATHLETES.some(
    (athleteName) => !adoptedSelections.has(athleteName),
  )
) {
  throw new Error("Decision 15 generator must define exactly all 14 targets");
}

const registry: PlayerPhotoRegistryV7 = {
  nonClearanceStatement: DECISION_15_NON_CLEARANCE_STATEMENT,
  ownerAcceptedResidualRisks: [
    ...PLAYER_PHOTO_REGISTRY_V7_OWNER_ACCEPTED_RESIDUAL_RISKS,
  ],
  phaseEvidenceBindings: PLAYER_PHOTO_REGISTRY_V7_PHASE_EVIDENCE,
  predecessorRegistryBinding: PLAYER_PHOTO_REGISTRY_V7_PREDECESSOR,
  schemaVersion: 7,
  scopeId: PLAYER_PHOTO_REGISTRY_V7_SCOPE_ID,
  selections: predecessor.selections.map((selection) => {
    const adopted = adoptedSelections.get(
      selection.athleteName as (typeof DECISION_15_TARGET_ATHLETES)[number],
    );
    if (adopted !== undefined) return adopted;
    if (
      selection.coverKind === "commons-photo" &&
      (DECISION_15_PROTECTED_ATHLETES as readonly string[]).includes(
        selection.athleteName,
      )
    ) {
      return selection;
    }
    throw new Error(
      `${selection.athleteName} is neither an adopted target nor a protected v6 photo`,
    );
  }),
  sourcePolicyBinding: PLAYER_PHOTO_POLICY_V8_BINDING,
};

const outputBytes = canonicalJson(registry);
if (process.argv.includes("--check")) {
  if (
    readFileSync(resolve(root, PLAYER_PHOTO_REGISTRY_V7_PATH), "utf8") !==
    outputBytes
  ) {
    throw new Error("Generated player-photo registry v7 bytes are stale");
  }
  console.log(`player-photo registry v7 OK — ${sha256Hex(outputBytes)}`);
} else if (process.argv.includes("--stdout")) {
  process.stdout.write(outputBytes);
} else {
  writeFileSync(resolve(root, PLAYER_PHOTO_REGISTRY_V7_PATH), outputBytes);
  console.log(`player-photo registry v7 generated — ${sha256Hex(outputBytes)}`);
}
