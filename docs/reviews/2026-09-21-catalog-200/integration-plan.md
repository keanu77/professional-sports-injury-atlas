# Catalog 200 single-batch integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在四個既有神經案例的嵌入修復及自有 HTTPS 實播完成後，以一個 42 例批次將 158 例擴至 200 個不同事件。

**Architecture:** 保留 7 個核心臨床病例，以一個 catalog-200 observation batch 和一個 event batch 加入 42 例；最終 193 observations + 7 core = 200。資料來源、片型與原片 metadata 綁定於 selected-cases.json，本站播放與正常發布證據另外取得。

**Tech Stack:** Astro、TypeScript、現有 Zod、Vitest、Playwright 本地整合測試、主流程允許的 browser 工具、Node 24。工作分支沿用主流程已授權 current branch，不新建 worktree。

---

日期：2026-09-21。本子計畫承接 [implementation-plan.md](implementation-plan.md) Task 3；只新增本文件及 [selected-cases.json](selected-cases.json)，本步不修改 src 或建立 proof。

## 完整 42 例選取清單

以下數字是影片起點／完整時長（秒），逐字沿用主流程原站 metadata；不是新產生的本站播放證據。三份草稿 URL 與 42 個原片 review 完全相符，無替換衝突。selected-cases.json 包含 clips、eventEntries、provenance、resourceEntries 與最小可見情境項目。

| #   | Slug                                         | 選手／國家                    | 運動／主要部位       | 事件日期         | 原片                                                       | 起點／時長秒 | 片型              |
| --- | -------------------------------------------- | ----------------------------- | -------------------- | ---------------- | ---------------------------------------------------------- | ------------ | ----------------- |
| 1   | `nathan-florence-2023-t12-fracture`          | Nathan Florence／USA          | 衝浪／軀幹           | 2023（日未確認） | [lqlkP27TXvA](https://www.youtube.com/watch?v=lqlkP27TXvA) | 450 / 940    | injury-motion     |
| 2   | `billy-kemper-2020-pelvis-knee`              | Billy Kemper／USA             | 衝浪／骨盆           | 2020（日未確認） | [gGGMvPtjtZo](https://www.youtube.com/watch?v=gGGMvPtjtZo) | 740 / 826    | athlete-interview |
| 3   | `missy-franklin-2016-shoulder`               | Missy Franklin／USA           | 游泳／肩部           | 2016（日未確認） | [WevF13bkLAM](https://www.youtube.com/watch?v=WevF13bkLAM) | 130 / 1820   | athlete-interview |
| 4   | `gabriel-medina-2025-pectoral-tendon`        | Gabriel Medina／BRA           | 衝浪／軀幹           | 2025-01-09       | [z6KNabUBA88](https://www.youtube.com/watch?v=z6KNabUBA88) | 30 / 499     | athlete-interview |
| 5   | `jj-watt-2019-pectoral`                      | J.J. Watt／USA                | 美式足球／軀幹       | 2019-10-27       | [D8492O0ciGY](https://www.youtube.com/watch?v=D8492O0ciGY) | 100 / 942    | athlete-interview |
| 6   | `zoey-clark-2023-disc-nerve`                 | Zoey Clark／GBR               | 田徑／軀幹           | 2023（日未確認） | [7_GZg1qIZLQ](https://www.youtube.com/watch?v=7_GZg1qIZLQ) | 95 / 495     | athlete-interview |
| 7   | `chloe-kim-2026-shoulder`                    | Chloe Kim／USA                | 單板滑雪／肩部       | 2026（日未確認） | [iRo0jHPhr2I](https://www.youtube.com/watch?v=iRo0jHPhr2I) | 0 / 15       | news-analysis     |
| 8   | `adam-peaty-2022-foot`                       | Adam Peaty／GBR               | 游泳／足部           | 2022（日未確認） | [7oFg7YmMgtI](https://www.youtube.com/watch?v=7oFg7YmMgtI) | 690 / 719    | athlete-interview |
| 9   | `kerri-walsh-jennings-2015-shoulder`         | Kerri Walsh Jennings／USA     | 沙灘排球／肩部       | 2015-07-10       | [RyWuQ_RW6OA](https://www.youtube.com/watch?v=RyWuQ_RW6OA) | 0 / 38       | athlete-interview |
| 10  | `rafael-nadal-2022-abdominal`                | Rafael Nadal／ESP             | 網球／軀幹           | 2022（日未確認） | [9vGOrRkqAK4](https://www.youtube.com/watch?v=9vGOrRkqAK4) | 15 / 678     | athlete-interview |
| 11  | `jordyn-poulter-2022-knee`                   | Jordyn Poulter／USA           | 室內排球／膝部       | 2022-12-03       | [xBgZKehMBDA](https://www.youtube.com/watch?v=xBgZKehMBDA) | 15 / 792     | athlete-interview |
| 12  | `paula-badosa-2023-spinal-stress-fracture`   | Paula Badosa／ESP             | 網球／軀幹           | 2023（日未確認） | [X8X7Xg7UwD0](https://www.youtube.com/watch?v=X8X7Xg7UwD0) | 250 / 410    | athlete-interview |
| 13  | `rafael-nadal-2022-rib-stress-fracture`      | Rafael Nadal／ESP             | 網球／軀幹           | 2022-03-19       | [vsc3sE7WwXk](https://www.youtube.com/watch?v=vsc3sE7WwXk) | 0 / 42       | athlete-interview |
| 14  | `jake-wightman-2023-foot`                    | Jake Wightman／GBR            | 田徑／足部           | 2023（日未確認） | [IpYzdWZ80CE](https://www.youtube.com/watch?v=IpYzdWZ80CE) | 330 / 1645   | athlete-interview |
| 15  | `karsten-warholm-2022-hamstring`             | Karsten Warholm／NOR          | 田徑／大腿後側       | 2022-06-05       | [z7x0dxJf3Zk](https://www.youtube.com/watch?v=z7x0dxJf3Zk) | 15 / 621     | news-analysis     |
| 16  | `molly-seidel-2024-patella`                  | Molly Seidel／USA             | 田徑／膝部           | 2024（日未確認） | [F-KkglTfq3Y](https://www.youtube.com/watch?v=F-KkglTfq3Y) | 285 / 547    | athlete-interview |
| 17  | `jamahal-hill-2021-elbow`                    | Jamahal Hill／USA             | 綜合格鬥／肘部       | 2021-06-12       | [hvH4AnAD5eg](https://www.youtube.com/watch?v=hvH4AnAD5eg) | 63 / 133     | news-analysis     |
| 18  | `antonio-rodrigo-nogueira-2011-arm`          | Antônio Rodrigo Nogueira／BRA | 綜合格鬥／上臂與前臂 | 2011-12-10       | [XdGi7XI5Y_c](https://www.youtube.com/watch?v=XdGi7XI5Y_c) | 120 / 202    | news-analysis     |
| 19  | `tim-sylvia-2004-arm`                        | Tim Sylvia／USA               | 綜合格鬥／上臂與前臂 | 2004-06-19       | [XEBZ9lSa8fM](https://www.youtube.com/watch?v=XEBZ9lSa8fM) | 530 / 765    | injury-motion     |
| 20  | `ronaldo-jacare-souza-2021-humerus`          | Ronaldo Jacaré Souza／BRA     | 綜合格鬥／上臂與前臂 | 2021-05-15       | [rkiD3kLGIvU](https://www.youtube.com/watch?v=rkiD3kLGIvU) | 125 / 207    | news-analysis     |
| 21  | `tom-aspinall-2022-knee`                     | Tom Aspinall／GBR             | 綜合格鬥／膝部       | 2022-07-23       | [sM8zlrTLroE](https://www.youtube.com/watch?v=sM8zlrTLroE) | 925 / 2471   | athlete-interview |
| 22  | `jordan-burroughs-2013-ankle`                | Jordan Burroughs／USA         | 角力／腳踝           | 2013-08-22       | [sBzHuGCZdTI](https://www.youtube.com/watch?v=sBzHuGCZdTI) | 25 / 536     | athlete-interview |
| 23  | `jofra-archer-2020-elbow-stress-fracture`    | Jofra Archer／GBR             | 板球／肘部           | 2020（日未確認） | [VNo4qQaVNHg](https://www.youtube.com/watch?v=VNo4qQaVNHg) | 0 / 195      | athlete-interview |
| 24  | `manny-pacquiao-2015-shoulder`               | Manny Pacquiao／PHL           | 拳擊／肩部           | 2015（日未確認） | [l1dYgS6mqO0](https://www.youtube.com/watch?v=l1dYgS6mqO0) | 0 / 142      | news-analysis     |
| 25  | `sky-brown-2024-shoulder`                    | Sky Brown／GBR                | 滑板／肩部           | 2024（日未確認） | [5qWBA8MuN_4](https://www.youtube.com/watch?v=5qWBA8MuN_4) | 90 / 296     | athlete-interview |
| 26  | `tony-hawk-2022-femur`                       | Tony Hawk／USA                | 滑板／髖部與大腿     | 2022-03-07       | [Kvm-WXQ2w2Y](https://www.youtube.com/watch?v=Kvm-WXQ2w2Y) | 250 / 3362   | athlete-interview |
| 27  | `helen-maroulis-2018-concussion`             | Helen Maroulis／USA           | 角力／頭頸部         | 2018（日未確認） | [6dGzpQHXQsM](https://www.youtube.com/watch?v=6dGzpQHXQsM) | 145 / 212    | athlete-interview |
| 28  | `tiger-woods-2008-tibial-stress-fractures`   | Tiger Woods／USA              | 高爾夫／小腿         | 2008（日未確認） | [kb_9JHJu1oo](https://www.youtube.com/watch?v=kb_9JHJu1oo) | 1620 / 11470 | aftermath         |
| 29  | `mirabai-chanu-2023-hip`                     | Mirabai Chanu／IND            | 舉重／髖部與大腿     | 2023-09-30       | [1d3pOYyLQkY](https://www.youtube.com/watch?v=1d3pOYyLQkY) | 20 / 130     | news-analysis     |
| 30  | `annemiek-van-vleuten-2022-elbow`            | Annemiek van Vleuten／NED     | 自行車／肘部         | 2022-09-21       | [T7-DAQANyho](https://www.youtube.com/watch?v=T7-DAQANyho) | 273 / 478    | athlete-interview |
| 31  | `daniel-andre-tande-2021-clavicle`           | Daniel Andre Tande／NOR       | 跳台滑雪／肩部       | 2021-03-25       | [jQ7oMEGPHXg](https://www.youtube.com/watch?v=jQ7oMEGPHXg) | 0 / 34       | athlete-interview |
| 32  | `egan-bernal-2022-training-crash`            | Egan Bernal／COL              | 自行車／軀幹         | 2022-01-24       | [aXvM23KcbJw](https://www.youtube.com/watch?v=aXvM23KcbJw) | 20 / 227     | athlete-interview |
| 33  | `connor-fields-2021-brain-hemorrhage`        | Connor Fields／USA            | 自行車／頭頸部       | 2021-07-30       | [kti0XvZn0KQ](https://www.youtube.com/watch?v=kti0XvZn0KQ) | 1475 / 3284  | athlete-interview |
| 34  | `novak-djokovic-2017-elbow`                  | Novak Djokovic／SRB           | 網球／肘部           | 2017（日未確認） | [8H_0tJAwev8](https://www.youtube.com/watch?v=8H_0tJAwev8) | 0 / 114      | athlete-interview |
| 35  | `kei-nishikori-2017-wrist`                   | Kei Nishikori／JPN            | 網球／手腕           | 2017（日未確認） | [_9PMTWdYX6I](https://www.youtube.com/watch?v=_9PMTWdYX6I) | 15 / 224     | athlete-interview |
| 36  | `bianca-andreescu-2023-ankle`                | Bianca Andreescu／CAN         | 網球／腳踝           | 2023-03-27       | [4O87O9rHdoE](https://www.youtube.com/watch?v=4O87O9rHdoE) | 0 / 91       | news-analysis     |
| 37  | `juan-martin-del-potro-2017-wrist-contusion` | Juan Martín del Potro／ARG    | 網球／手腕           | 2017-10-13       | [_qp50gF67sQ](https://www.youtube.com/watch?v=_qp50gF67sQ) | 0 / 120      | athlete-interview |
| 38  | `rafael-nadal-2016-wrist`                    | Rafael Nadal／ESP             | 網球／手腕           | 2016（日未確認） | [yH1WExdlI4Q](https://www.youtube.com/watch?v=yH1WExdlI4Q) | 0 / 208      | athlete-interview |
| 39  | `nikola-karabatic-2020-acl`                  | Nikola Karabatic／FRA         | 手球／膝部           | 2020-10-17       | [ApTbpxIuUJ8](https://www.youtube.com/watch?v=ApTbpxIuUJ8) | 0 / 162      | aftermath         |
| 40  | `kelly-slater-2017-foot`                     | Kelly Slater／USA             | 衝浪／足部           | 2017-07-17       | [WhCalbwjLJg](https://www.youtube.com/watch?v=WhCalbwjLJg) | 25 / 225     | aftermath         |
| 41  | `sally-fitzgibbons-2015-eardrum`             | Sally Fitzgibbons／AUS        | 衝浪／頭頸部         | 2015-06-02       | [wTaCr8olPck](https://www.youtube.com/watch?v=wTaCr8olPck) | 45 / 351     | news-analysis     |
| 42  | `emma-raducanu-2022-2023-wrists`             | Emma Raducanu／GBR            | 網球／手腕           | 2023（日未確認） | [ZQL-1NY5erY](https://www.youtube.com/watch?v=ZQL-1NY5erY) | 25 / 88      | news-analysis     |

片型：27 個本人訪談、10 個新聞／分析、3 個傷後紀錄、2 個受傷動作。對手 Paul Craig、André Muniz 的訪談保留 news-analysis；Full Blast 不冒充 Nogueira 本人或清楚事故回放。

## 去重、來源與資料界線

- 與現行 158 列 catalog 的 slug、姓名／事件及影片查重；三個同名新事件與既有不同：Van Vleuten 2022 肘傷／既有 2016 里約、Djokovic 2017 肘傷／既有 2024 膝傷、del Potro 2017 腕挫傷／既有 2018 膝傷。
- Nadal 的 2016 左腕、2022 年 3 月肋骨、2022 年 7 月腹肌各自有不同來源與原片。不能將 null 日期本身當成相同事件。
- Billy 多部位事故、Missy 的 2016–2017 雙肩病程與 Emma 的反覆雙腕病程各保留一例；這些計數規則放在 provenance，不出現在 observation 文案。
- 原始來源存取層級逐筆保留於 provenance.priorSourceReview，excerpt／貼文不可讀未被改寫為全文成功。國家與原創發布者均非臺灣；CGTN 為中國媒體，Oneindia 為印度媒體，ABS-CBN 為菲律賓媒體。
- 未確認日期與所有復出日期保留 null；所有表列 sourceIndexes 仍引用同一筆 event 的 sources，新增影片來源只附加在尾端，不改原引用序號。
- bodyPart 改名只做導覽正規化，不改醫學診斷：踝部→腳踝、頭部→頭頸部、腕部與手部→手腕；BMX→自行車專項，事件仍清楚記載 BMX。股骨／髖部使用新髖部與大腿，右肱骨或未具名手臂使用新上臂與前臂，Tiger 脛骨使用小腿別名。

## 執行前置條件

目前只整理研究文件，selected-cases.json 不得被 src 匯入。主流程已完成 42 個原站影片內容／metadata 紀錄，與本站實播分開；此文件不把任何新增影片標為 owned playback passed。

- [ ] 先完成四神經案例：主流程回報 Ryan、Horne、Kelly 已實際播放；Jaylon 已改查 WFAA 的 GCWl3Qk3fEQ，仍須完成兩階段 review、刷新 public-mode preview 並實播。以最後寫入的真實證據為準，不以本段狀態文字替代。
- [ ] Jaylon 如更換原片，先同步 nerve-four.v1.json、event-nerve-four.v1.json、固定 selection、相關測試與來源／片型；這是既有案例修復，不增計病例。不得降低 Kelly 既有 allowlist 邊界。
- [ ] 四例均需 docs/reviews/2026-09-21-nerve-four/playback.preview.json 的實際 owned-HTTPS 紀錄，且保持現行七日有效期、URL、route、播放起點及進度要求，才進行以下 src integration。
- [ ] 本批醫學文字、原創發布者／非臺灣來源、同事件關聯及 sourceAccess 限制交主流程 review。Archer 的多傷病訪談尚未逐字確認聲音，不得把整片當作單一 2020 肘傷描述；Bernal／Karabatic 部分官方貼文僅由來源鏈取得，不能宣稱所有原文直接讀取。
- [ ] 沿用已授權的 current branch 工作方式；不修改平台既有 bound authority 文件或編造新的使用者核准。此 subplan 是 implementation-plan.md Task 3 的具體資料依據。

## 檔案責任

| 類別               | 完整路徑                                                                                                    | 用途                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 已完成研究資料     | docs/reviews/2026-09-21-catalog-200/selected-cases.json                                                     | 42 clips／eventEntries／provenance／原片 metadata 綁定         |
| 已有原片紀錄       | docs/reviews/2026-09-21-catalog-200/original-video-review.json                                              | 主流程原站觀看資料，不能冒充本站實播                           |
| 新增正式批次       | src/data/videos/catalog-200.v1.json                                                                         | 42 observation clips                                           |
| 新增正式事件批次   | src/data/videos/event-catalog-200.v1.json                                                                   | 42 事件來源與時間軸                                            |
| 修改 loader/schema | src/lib/videos/expansion.ts                                                                                 | 精確 selection、42 筆驗證、去重、allObservationClips           |
| 修改事件 loader    | src/lib/videos/event-updates.ts                                                                             | 新批次、42 筆、相同 checkedAt／binding                         |
| 修改 allowlist     | src/lib/videos/public-video-ids.ts                                                                          | 增加本批 42 個 YouTube ID                                      |
| 修改分類           | src/lib/videos/sports.ts、src/lib/videos/body-parts.ts                                                      | 新增非空運動／部位，保留既有路由                               |
| 修改資源           | src/data/videos/observation-resources.v1.json                                                               | 每例 1–3 個合適既有主站資源                                    |
| 視需要修改情境     | src/data/videos/discovery.v1.json                                                                           | 只為可見動作分類；訪談／新聞採現有 unclear fallback            |
| 整合前內容基線     | docs/reviews/2026-09-21-catalog-200/baseline-before-integration.json                                        | 四神經最終修正後 151 observations／158 events 的內容與 SHA-256 |
| 新增測試           | tests/unit/catalog-200.test.ts、e2e/catalog-200.spec.ts                                                     | 選取、來源、日期、分類、隱私與頁面呈現                         |
| 修改影片工具       | scripts/verify-video-thumbnails.ts、tests/unit/video-thumbnails.test.ts、tests/unit/video-expansion.test.ts | 納入新正式 JSON 清單                                           |
| 修改發布 loader    | scripts/public-launch/check-release.ts                                                                      | 納入新批次真實實播檔，保持所有 assert                          |
| 後續真實實播產物   | docs/reviews/2026-09-21-catalog-200/playback.preview.json                                                   | 42 個已在自有 HTTPS candidate 實播的紀錄；現在不建立           |
| 整合後紀錄         | docs/reviews/2026-09-21-catalog-200/integration-validation.md                                               | RED/GREEN、完整檢查、review、來源限制與實播結果                |

既有 /videos/[slug].astro 與卡片已可讀取批次資料；不新增一套病例模板，不為資料數量改動 UI 架構。

## Task 0：四神經完成後先保存整合基線

Create: docs/reviews/2026-09-21-catalog-200/baseline-before-integration.json。必須在匯入 catalog-200 production batch 前執行；保存四神經最後修正後的 151 observation 與 158 event 內容，單純總數不能證明舊病例未被覆寫。若該檔已存在，先確認 sourceCommit 是實際整合基線，不重新覆蓋使測試配合結果。

```sh
node --import tsx --input-type=module <<'NODE'
import fs from "node:fs";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {allObservationClips} from "./src/lib/videos/expansion.ts";
import {eventUpdates} from "./src/lib/videos/event-updates.ts";
const path = "docs/reviews/2026-09-21-catalog-200/baseline-before-integration.json";
if (fs.existsSync(path)) throw new Error("Baseline already exists; do not replace it silently");
if (allObservationClips.length !== 151 || eventUpdates.entries.length !== 158) throw new Error("Capture before the 42-case integration");
const content = {clips: allObservationClips, eventEntries: eventUpdates.entries};
const result = {schemaVersion: 1, scope: "existing-data-preservation-baseline", sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {encoding: "utf8"}).trim(), capturedAt: new Date().toISOString(), contentSha256: createHash("sha256").update(JSON.stringify(content)).digest("hex"), ...content};
fs.writeFileSync(path, JSON.stringify(result, null, 2) + "\n");
NODE
```

- [ ] 保存基線內容與雜湊；此為資料保留檢查，不是播放、來源或醫學核准證據。
- [ ] 基線、selected-cases 與 literal metadata snapshot 各有獨立職責；禁止從整合後正式資料重新產生基線或 selection。

## Task 1：先建立會失敗的批次與內容契約測試

Create: tests/unit/catalog-200.test.ts。下列測試同時驗證真實資料邊界與負向輸入，並不把外部播放當作單元測試結果。

```ts
import { describe, expect, it } from "vitest";
import selected from "../../docs/reviews/2026-09-21-catalog-200/selected-cases.json";
import baseline from "../../docs/reviews/2026-09-21-catalog-200/baseline-before-integration.json";
import resourceData from "../../src/data/videos/observation-resources.v1.json";
import { discoveryFor } from "../../src/lib/videos/discovery";
import {
  allObservationClips,
  catalog200,
  catalog200Schema,
} from "../../src/lib/videos/expansion";
import {
  eventUpdateFor,
  eventUpdates,
  returnDays,
} from "../../src/lib/videos/event-updates";
import { publicVideoIds } from "../../src/lib/videos/public-video-ids";
import { videosBySport } from "../../src/lib/videos/sports";
import { videosByBodyPart } from "../../src/lib/videos/body-parts";
import {
  observationCategoryLinks,
  observationResourcesFor,
} from "../../src/lib/videos/observation-guidance";
import { nerveInjuryGroup } from "../../src/lib/videos/nerve-categories";

describe("catalog 200 sourced expansion", () => {
  it("preserves prior events and admits the selected 42 once", () => {
    expect(catalog200.clips).toEqual(selected.clips);
    expect(catalog200.clips).toHaveLength(42);
    expect(allObservationClips).toHaveLength(193);
    expect(eventUpdates.entries).toHaveLength(200);
    expect(publicVideoIds.size).toBe(199);
    expect(new Set(allObservationClips.map((c) => c.slug)).size).toBe(193);
    expect(new Set(catalog200.clips.map((c) => c.videoId)).size).toBe(42);
    expect(nerveInjuryGroup(allObservationClips).count).toBe(4);
    const added = new Set(selected.clips.map((c) => c.slug));
    expect(baseline.clips).toHaveLength(151);
    expect(baseline.eventEntries).toHaveLength(158);
    expect(allObservationClips.filter((c) => !added.has(c.slug))).toEqual(
      baseline.clips,
    );
    expect(eventUpdates.entries.filter((e) => !added.has(e.slug))).toEqual(
      baseline.eventEntries,
    );
  });
  it("binds every source timeline to its clip and preserves unknown recovery", () => {
    for (const clip of catalog200.clips) {
      const expected = selected.eventEntries.find((e) => e.slug === clip.slug)!;
      const entry = eventUpdateFor(clip.slug, clip.videoUrl, clip.eventDate)!;
      expect(entry).toEqual(expected);
      expect(returnDays(entry)).toBeNull();
      expect(clip.startSeconds).toBeLessThan(clip.durationSeconds);
      expect(entry.sources.length).toBeGreaterThan(0);
      for (const row of entry.timeline ?? [])
        for (const i of row.sourceIndexes)
          expect(entry.sources[i - 1]).toBeDefined();
      expect(observationResourcesFor(clip.slug).length).toBeGreaterThan(0);
      expect(observationCategoryLinks(clip).length).toBe(3);
    }
  });
  it("routes every new event to one sport and one anatomical group", () => {
    const expected = catalog200.clips.map((c) => c.slug).sort();
    expect(
      videosBySport([], catalog200.clips)
        .flatMap((g) => g.clips.map((c) => c.slug))
        .sort(),
    ).toEqual(expected);
    expect(
      videosByBodyPart([], catalog200.clips)
        .flatMap((g) => g.clips.map((c) => c.slug))
        .sort(),
    ).toEqual(expected);
  });
  it("uses each reviewed route, resource and visible situation exactly", () => {
    const routes = [
      ["nathan-florence-2023-t12-fracture", "trunk", "surfing"],
      ["billy-kemper-2020-pelvis-knee", "pelvis", "surfing"],
      ["missy-franklin-2016-shoulder", "shoulder", "swimming"],
      ["gabriel-medina-2025-pectoral-tendon", "trunk", "surfing"],
      ["jj-watt-2019-pectoral", "trunk", "american-football"],
      ["zoey-clark-2023-disc-nerve", "trunk", "athletics"],
      ["chloe-kim-2026-shoulder", "shoulder", "snowboarding"],
      ["adam-peaty-2022-foot", "foot", "swimming"],
      ["kerri-walsh-jennings-2015-shoulder", "shoulder", "beach-volleyball"],
      ["rafael-nadal-2022-abdominal", "trunk", "tennis"],
      ["jordyn-poulter-2022-knee", "knee", "indoor-volleyball"],
      ["paula-badosa-2023-spinal-stress-fracture", "trunk", "tennis"],
      ["rafael-nadal-2022-rib-stress-fracture", "trunk", "tennis"],
      ["jake-wightman-2023-foot", "foot", "athletics"],
      ["karsten-warholm-2022-hamstring", "posterior-thigh", "athletics"],
      ["molly-seidel-2024-patella", "knee", "athletics"],
      ["jamahal-hill-2021-elbow", "elbow", "mixed-martial-arts"],
      ["antonio-rodrigo-nogueira-2011-arm", "arm", "mixed-martial-arts"],
      ["tim-sylvia-2004-arm", "arm", "mixed-martial-arts"],
      ["ronaldo-jacare-souza-2021-humerus", "arm", "mixed-martial-arts"],
      ["tom-aspinall-2022-knee", "knee", "mixed-martial-arts"],
      ["jordan-burroughs-2013-ankle", "ankle", "wrestling"],
      ["jofra-archer-2020-elbow-stress-fracture", "elbow", "cricket"],
      ["manny-pacquiao-2015-shoulder", "shoulder", "boxing"],
      ["sky-brown-2024-shoulder", "shoulder", "skateboarding"],
      ["tony-hawk-2022-femur", "hip-thigh", "skateboarding"],
      ["helen-maroulis-2018-concussion", "head-neck", "wrestling"],
      ["tiger-woods-2008-tibial-stress-fractures", "calf-achilles", "golf"],
      ["mirabai-chanu-2023-hip", "hip-thigh", "weightlifting"],
      ["annemiek-van-vleuten-2022-elbow", "elbow", "cycling"],
      ["daniel-andre-tande-2021-clavicle", "shoulder", "ski-jumping"],
      ["egan-bernal-2022-training-crash", "trunk", "cycling"],
      ["connor-fields-2021-brain-hemorrhage", "head-neck", "cycling"],
      ["novak-djokovic-2017-elbow", "elbow", "tennis"],
      ["kei-nishikori-2017-wrist", "wrist", "tennis"],
      ["bianca-andreescu-2023-ankle", "ankle", "tennis"],
      ["juan-martin-del-potro-2017-wrist-contusion", "wrist", "tennis"],
      ["rafael-nadal-2016-wrist", "wrist", "tennis"],
      ["nikola-karabatic-2020-acl", "knee", "handball"],
      ["kelly-slater-2017-foot", "foot", "surfing"],
      ["sally-fitzgibbons-2015-eardrum", "head-neck", "surfing"],
      ["emma-raducanu-2022-2023-wrists", "wrist", "tennis"],
    ] as const;
    for (const [slug, body, sport] of routes) {
      const clip = catalog200.clips.find((c) => c.slug === slug)!;
      const links = observationCategoryLinks(clip);
      expect(links.find((l) => l.kind === "body-part")!.href).toBe(
        "/body-parts/" + body + "/",
      );
      expect(links.find((l) => l.kind === "sport")!.href).toBe(
        "/sports/" + sport + "/",
      );
      const expected = selected.resourceEntries[slug];
      expect(resourceData.entries[slug]).toEqual(expected);
      const registry = resourceData.resources as Record<
        string,
        { url: string }
      >;
      expect(observationResourcesFor(slug).map((r) => r.url)).toEqual(
        expected.resources.map((key) => registry[key]!.url),
      );
      const situation =
        selected.discoveryEntries.find((e) => e.slug === slug)?.situation ??
        "unclear";
      expect(discoveryFor(slug).situation).toBe(situation);
      expect(discoveryFor(slug).curatedRank).toBeUndefined();
    }
  });
  it("does not turn review metadata into clinical or public approval", () => {
    expect(selected.scope).toBe("candidate-source-verified-not-owned-playback");
    expect(selected.ownedHttpsPlaybackVerified).toBe(false);
    expect(selected.acceptedForPublication).toBe(0);
    expect(
      catalog200.clips.find((c) => c.slug === "zoey-clark-2023-disc-nerve")!
        .nerveCategory,
    ).toBeUndefined();
    expect(
      catalog200.clips.find((c) => c.slug === "jake-wightman-2023-foot")!
        .eventDate,
    ).toBeNull();
    for (const clip of catalog200.clips) {
      expect(clip.observation).not.toMatch(
        /schema|主流程|待主流程|計入|只計一例|草稿|startSeconds|durationSeconds/,
      );
    }
  });
  it("rejects wrong video bindings, duplicate selections, missing citations and invalid offsets", () => {
    for (const mutate of [
      (v: typeof catalog200) => {
        v.clips[0]!.videoUrl = "https://www.youtube.com/watch?v=abcdefghijk";
      },
      (v: typeof catalog200) => {
        v.clips[0]!.videoId = "abcdefghijk";
        v.clips[0]!.videoUrl = "https://www.youtube.com/watch?v=abcdefghijk";
      },
      (v: typeof catalog200) => {
        v.clips[1] = v.clips[0]!;
      },
      (v: typeof catalog200) => {
        v.clips[0]!.eventYear = 2024;
      },
      (v: typeof catalog200) => {
        v.clips[0]!.eventDate = "2023-01-15";
      },
      (v: typeof catalog200) => {
        v.clips[0]!.startSeconds += 1;
      },
      (v: typeof catalog200) => {
        v.clips[0]!.durationSeconds -= 1;
      },
      (v: typeof catalog200) => {
        v.clips[0]!.publisher = "Different publisher";
      },
      (v: typeof catalog200) => {
        v.clips[0]!.sourceTitle = "Different title";
      },
      (v: typeof catalog200) => {
        v.clips[0]!.footageKind = "news-analysis";
      },
      (v: typeof catalog200) => {
        v.clips[0]!.startSeconds = v.clips[0]!.durationSeconds;
      },
      (v: typeof catalog200) => {
        v.clips[0]!.sources = [];
      },
      (v: typeof catalog200) => {
        v.clips[0]!.returnDate = "1900-01-01";
      },
    ]) {
      const copy = structuredClone(catalog200);
      mutate(copy);
      expect(catalog200Schema.safeParse(copy).success).toBe(false);
    }
  });
});
```

- [ ] Run under Node 24: npm exec -- vitest run tests/unit/catalog-200.test.ts。預期因 catalog200 export 尚不存在而失敗；保存真實輸出。
- [ ] 不改既有核心個案與醫療核准，先確認上述五組契約覆蓋來源、日期、分類、數量與負向案例。
- [ ] 新 metadata 更動若是正式 review 修正，先更新研究 selection 與說明；不為了測試通過擅自改時間碼。

## Task 2：建立單一正式 observation／event batch

只有 Task 0 四神經前置條件通過後執行。先從 selected-cases.json 寫正式資料，沒有重算或複製私人暫存 proof：

```js
import fs from "node:fs";
const input = JSON.parse(
  fs.readFileSync(
    "docs/reviews/2026-09-21-catalog-200/selected-cases.json",
    "utf8",
  ),
);
const common = { schemaVersion: 1, decision: "catalog-200-2026-09-21" };
fs.writeFileSync(
  "src/data/videos/catalog-200.v1.json",
  JSON.stringify({ ...common, clips: input.clips }, null, 2) + "\n",
);
fs.writeFileSync(
  "src/data/videos/event-catalog-200.v1.json",
  JSON.stringify(
    { ...common, checkedAt: input.checkedAt, entries: input.eventEntries },
    null,
    2,
  ) + "\n",
);
```

上述批次不自行寫 authorizationQuote 或 authorization 時間；使用既有已授權計畫。固定 selection 必須是下列獨立的 42 列 literal snapshot，禁止由 catalog200Data.clips 自我派生。每列依序為 slug、videoId、videoUrl、publisher、sourceTitle、startSeconds、durationSeconds、footageKind、eventYear、eventDate；此常數是已 review 原片的鎖定值，後續 metadata 修正須連同來源說明獨立 review。

```ts
import catalog200Data from "../../data/videos/catalog-200.v1.json";
// Place after nerveFour and before allObservationClips:
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
      ...[...launchData.cases, ...expansion.cases].map((c) => c.slug),
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
```

- [ ] Append ...catalog200.clips to existing allObservationClips。既有 seven core 保留。
- [ ] In src/lib/videos/event-updates.ts add the import and existing-pattern batch:

```ts
import catalog200Data from "../../data/videos/event-catalog-200.v1.json";
const catalog200 = z
  .strictObject({
    schemaVersion: z.literal(1),
    decision: z.literal("catalog-200-2026-09-21"),
    checkedAt: z.iso.date(),
    entries: z.array(eventUpdateEntryInputSchema).length(42),
  })
  .parse(catalog200Data);
```

將 catalog200 加入 normalizeEventUpdateBatches 最後，保留 entry.checkedAt、sourceIndexes、reported certainty 與 null dates。

- [ ] In src/lib/videos/public-video-ids.ts import catalog-200.v1.json，將 ...catalog200.clips 加到 observation 陣列；42 全是 YouTube，不增新 provider。
- [ ] 對 scripts/verify-video-thumbnails.ts、tests/unit/video-thumbnails.test.ts、tests/unit/video-expansion.test.ts 增加同一 JSON 的 inventory。新增 allowlist 不等於 CDN 圖片、caption 或播放成功。
- [ ] Run focused test，預期資料契約 GREEN、未新增分類／resources 的路由測試仍 RED，進 Task 3。
- [ ] 一個獨立 commit 保存 batch、loader 及對應測試，commit 前檢查沒有私人 scratch 或假 proof。

### 封面與 inventory 必須同步

Create 42 files: src/assets/videos/{videoId}.jpg（依完整 selection 的 42 個 ID）；Modify src/assets/videos/provenance.json。沿用使用者既有「YouTube 第一張圖片」授權與 decision-25 預設封面來源，所有實際下載 bytes 都驗 JPEG 與 SHA-256，不能填入不存在的圖片檔或臆測雜湊。以目前四神經修復後的 manifest 為基底，保留其他影片。

```js
import fs from "node:fs";
import { createHash } from "node:crypto";
const selected = JSON.parse(
  fs.readFileSync(
    "docs/reviews/2026-09-21-catalog-200/selected-cases.json",
    "utf8",
  ),
);
const manifestPath = "src/assets/videos/provenance.json";
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
for (const clip of selected.clips) {
  const source = "https://i.ytimg.com/vi/" + clip.videoId + "/hqdefault.jpg";
  const response = await fetch(source);
  if (!response.ok)
    throw new Error("Thumbnail HTTP " + response.status + ": " + clip.slug);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 2000 || bytes.readUInt16BE(0) !== 0xffd8)
    throw new Error("Invalid JPEG: " + clip.slug);
  const path = "src/assets/videos/" + clip.videoId + ".jpg";
  fs.writeFileSync(path, bytes);
  const item = {
    videoId: clip.videoId,
    path,
    source,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
  manifest.assets = [
    ...manifest.assets.filter((a) => a.videoId !== clip.videoId),
    item,
  ];
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
```

封面抓取失敗須解決來源／格式問題，不能把 source policy check 改為忽略。thumbnail 本地檔案、manifest、publicVideoIds 與完整 clip batch 必須在同一次整合一起更新；單元測試 tests/unit/video-thumbnails.test.ts 與 npm run content:check 檢查實際 199 個 YouTube 封面綁定。

## Task 3：分類與延伸資料，保持文案面向讀者

新增 SPORTS 的完整清單與 BODY_PARTS 設定見下方分類區塊。不得把「影像看不到動作」改寫成推測的致傷情境。

- [ ] 修改 src/lib/videos/sports.ts：附加全部實際有本批病例的 13 個新分類；BMX 使用既有 cycling／自行車，事件標題仍保留 BMX。
- [ ] 修改 src/lib/videos/body-parts.ts：增加 arm／上臂與前臂、hip-thigh／髖部與大腿；增加 observationParts 的 小腿→calf-achilles 別名。其餘部位已正規化成現有 label。
- [ ] src/data/videos/observation-resources.v1.json：每例新增 selected-cases.json 的 resourceEntries，僅引用既有 resources key，不以泛用外踝扭傷文冒充骨折、腦傷或脊椎專文。
- [ ] 情境預設維持 discoveryFor 的 unclear；Nathan 可列 fall，Tim Sylvia 可列 collision，僅限已看見該段動作。這是影片可見情境，不是病理機轉，也不新增過度使用計數。新增項目不得有 curatedRank，不改原 10 支精選。
- [ ] 不新增 mechanism 以湊頁面段落。觀察文案已移除計數、schema、主流程及未看影片模板語；保留對手訪談、來源診斷不確定性、後續更新和長期症狀的必要說明。

resourceEntries 整合的確切資料操作：

```js
import fs from "node:fs";
const selected = JSON.parse(
  fs.readFileSync(
    "docs/reviews/2026-09-21-catalog-200/selected-cases.json",
    "utf8",
  ),
);
const path = "src/data/videos/observation-resources.v1.json";
const current = JSON.parse(fs.readFileSync(path, "utf8"));
for (const [slug, entry] of Object.entries(selected.resourceEntries)) {
  if (entry.resources.some((key) => !current.resources[key]))
    throw new Error("Unknown resource: " + slug);
  current.entries[slug] = entry;
}
current.checkedAt = selected.checkedAt;
fs.writeFileSync(path, JSON.stringify(current, null, 2) + "\n");
```

分類程式碼：

```ts
// SPORTS additions:
{ code: "surfing", label: "衝浪" },
{ code: "swimming", label: "游泳" },
{ code: "snowboarding", label: "單板滑雪" },
{ code: "beach-volleyball", label: "沙灘排球" },
{ code: "indoor-volleyball", label: "室內排球" },
{ code: "mixed-martial-arts", label: "綜合格鬥" },
{ code: "wrestling", label: "角力" },
{ code: "boxing", label: "拳擊" },
{ code: "skateboarding", label: "滑板" },
{ code: "golf", label: "高爾夫" },
{ code: "weightlifting", label: "舉重" },
{ code: "ski-jumping", label: "跳台滑雪" },
{ code: "handball", label: "手球" },
// BODY_PARTS additions:
{ code: "arm", label: "上臂與前臂" },
{ code: "hip-thigh", label: "髖部與大腿" },
// observationParts additions:
上臂與前臂: "arm",
髖部與大腿: "hip-thigh",
小腿: "calf-achilles",
```

- [ ] Run npm exec -- vitest run tests/unit/catalog-200.test.ts tests/unit/video-sports.test.ts tests/unit/decision-39-observation-discovery.test.ts tests/unit/nerve-navigation.test.ts。所有 route/resource 契約 GREEN，神經數仍 4， subtype 3+1。
- [ ] 更新聚合計數 assertions：151→193 observations、158→200 events、157→199 YouTube IDs；只改聚合數，不修改原批次自身筆數或歷史文件。確切受影響檔案列在下面。
- [ ] 保留所有 returnDate null 與 source scope；所有 timeline sources 指向同 event sources 陣列，禁止只替換 URL 而留舊 sourceIndexes。

## Task 4：頁面、來源錨點與隱私的真實整合測試

Create e2e/catalog-200.spec.ts 與 playwright.catalog-200.config.ts，使用隔離的 local public-mode 成品。這些測試只驗本站呈現與同意載入，不回報外站播放通過。

```ts
import { test, expect } from "@playwright/test";
import selected from "../docs/reviews/2026-09-21-catalog-200/selected-cases.json";

test.beforeEach(() =>
  test.skip(
    process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21",
    "Public catalog required",
  ),
);
for (const c of selected.clips) {
  test(
    c.slug + ": sources, exact footage label and consent facade",
    async ({ page }) => {
      const external: string[] = [];
      page.on("request", (r) => {
        if (/youtube|ytimg|streamable/.test(r.url())) external.push(r.url());
      });
      await page.goto("/videos/" + c.slug + "/");
      await expect(
        page.getByRole("heading", { name: c.name, exact: true }),
      ).toBeVisible();
      await expect(page.locator("[data-footage-kind]")).toHaveAttribute(
        "data-footage-kind",
        c.footageKind,
      );
      await expect(page.locator("[data-recovery-timeline]")).toBeVisible();
      const refs = page.locator('a[href^="#event-source-"]');
      expect(await refs.count()).toBeGreaterThan(0);
      for (const ref of await refs.all())
        await expect(
          page.locator((await ref.getAttribute("href"))!),
        ).toHaveCount(1);
      await expect(page.locator("iframe")).toHaveCount(0);
      await expect(page.locator(".return-days")).toHaveCount(0);
      expect(external).toEqual([]);
    },
  );
}
test("200 unique events remain searchable", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-discovery-slug]")).toHaveCount(200);
  const slugs = await page
    .locator("[data-discovery-slug]")
    .evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("data-discovery-slug")),
    );
  expect(new Set(slugs).size).toBe(200);
  await page
    .getByRole("searchbox", { name: "搜尋球員或關鍵字" })
    .fill("Rafael Nadal");
  await expect(page.locator("[data-discovery-slug]:visible")).toHaveCount(3);
});
```

隔離 public-mode E2E 配置 playwright.catalog-200.config.ts：

```ts
import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
const port = Number(process.env.ATLAS_E2E_PORT ?? "14323");
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid E2E port");
const origin = "http://127.0.0.1:" + port;
const output = "/private/tmp/atlas-catalog200-e2e-dist";
export default defineConfig({
  ...base,
  webServer: {
    command:
      "ATLAS_BUILD_MODE=public ATLAS_PUBLIC_LAUNCH=decision-21 npm exec -- astro build --outDir " +
      output +
      " && npm run preview -- --host 127.0.0.1 --port " +
      port +
      " --outDir " +
      output,
    url: origin + "/",
    reuseExistingServer: false,
    timeout: 300000,
  },
  use: { ...base.use, baseURL: origin },
});
```

執行：

```sh
ATLAS_PUBLIC_LAUNCH=decision-21 ATLAS_E2E_PORT=14323 npm exec -- playwright test --config=playwright.catalog-200.config.ts e2e/catalog-200.spec.ts e2e/nerve-four.spec.ts e2e/decision-39-observation-pages.spec.ts e2e/video-search.spec.ts e2e/decision-39-ux.spec.ts
```

這個 local public-mode build 只用於頁面整合測試，不是 production release，也不是 owned HTTPS 播放證據；它沒有跳過後續 release:public。既有根 playwright.config.ts 不修改。

- [ ] 先在尚未建立新 route 的 public-mode build 跑新測試確認失敗，再整合資料／分類後 GREEN。使用既有 a11y helper補測三個新運動、arm、hip-thigh，以及 320/390 px 卡片和頁面；不更改外站資源 allowlist 或同意機制。
- [ ] 更新以下現存檔案中明確的聚合數量 expectations，保留其行為 assertions：
  - tests/unit/nerve-four.test.ts
  - tests/unit/rib-fracture-three.test.ts
  - tests/unit/decision-39-ux.test.ts
  - tests/unit/decision-39-observation-discovery.test.ts
  - tests/unit/video-discovery.test.ts
  - tests/unit/public-video-health.test.ts
  - tests/unit/recent-150.test.ts
  - tests/unit/recent-120.test.ts
  - tests/unit/video-search.test.ts
  - e2e/decision-39-observation-pages.spec.ts
  - e2e/patient-experience.spec.ts
  - e2e/video-search.spec.ts
  - e2e/decision-39-ux.spec.ts
- [ ] Run npm run test:unit、npm run check、npm run content:check、npm run plan:verify、npm run build:review；保存實際輸出。review build 與 public build 的收錄邊界仍須各自成立。
- [ ] 用既有 public-mode E2E 啟動方式跑 e2e/catalog-200.spec.ts、e2e/nerve-four.spec.ts、e2e/decision-39-observation-pages.spec.ts、e2e/video-search.spec.ts、e2e/decision-39-ux.spec.ts。一個 browser binding 由主流程持有，其他代理不操作共享瀏覽器。

## Task 5：42 支 owned-HTTPS 實播、release gate、最後線上核對

Modify scripts/public-launch/check-release.ts，只加 proof loader 與既有 proof 陣列展開：

```ts
const catalog200ProofPath = "docs/reviews/2026-09-21-catalog-200/playback.preview.json";
const catalog200Proof = existsSync(catalog200ProofPath)
  ? JSON.parse(readFileSync(catalog200ProofPath, "utf8"))
  : [];
// In the existing URL-matched proof lookup, append:
...catalog200Proof,
```

現在不建立 playback.preview.json；來源觀看 JSON 不可複製成這個檔案。既有 check-release.ts 的 URL、route、origin、七日、時間進度與 state assertions 保留原樣。

- [ ] 先證明缺少本批 owned proof 的 public release 會失敗，不能為了 candidate preview 直接抹掉發布閘門。沿用主流程現有 candidate 準備流程，構建與正式 release 的差異必須記錄。
- [ ] 主流程用當前允許的 browser 工具，在最新自有 HTTPS public-mode candidate 的每一個 /videos/{slug}/ 接受同意、跳到 selected startSeconds 並實际播放。每例記錄 exact source URL、route、origin、checkedAt、before/after time、paused、readyState 與任何 error；字幕是否存在照實保留。
- [ ] 所有 42 例都必須有 status=played、無 error、after.time > before.time、after.paused=false、after.readyState>=3、after.time>=startSeconds；日期不在未來且小於 7 日，HTTPS hostname 符合既有 *.sports-injury-atlas.pages.dev 判定。播放結束的 paused=true 快照不能作 gate 所需證據，必須在實際播放期間重新觀測，不修寫數值。
- [ ] 任一外站失效、地域限制或拒絕嵌入，保留真實 error，退回換同事件原創影片與重新 review；不下載重傳、不換第三方搬運、不放寬 provider 或七日期限。沒有全部合格時保持候選狀態，不宣稱 200 已發布。
- [ ] 刷新所有其他既有批次所需的過期 proof；本批 42 新增並不使舊 proof 自動有效。
- [ ] 確認乾淨 committed tree、實際 inputTreeDigest、review packet、patient guide/source/photo provenance 等既有檢查。使用原授權流程產生對應的 input approval，不能只為消除錯誤改核准雜湊或記錄未取得的核准。
- [ ] Run npm run release:public，預期完整 source/event/approval/playback/artifact 檢查通過。通過後才按既有使用者授權與正式部署流程執行 production。
- [ ] 正式站核對首頁 200 個 unique event routes、193 observations＋7 core、30 個非空運動分類、14 個解剖部位、神經 4 例入口及子類 3+1、Nadal 三個分明事件、搜尋及來源錨點。HTTP 200 或 iframe 存在不是實播證據。

## 完成標準與風險

42 是已具來源與原片 metadata 的候選選取數，不是目前的 production 增量。資料、來源與分類先完成兩階段獨立 review，再完成 42 支 owned 播放及正常 release gate。沒有用任何 mock、來源網站播放或靜態 DOM 充當正式實播。

所有原有醫學不確定性保存在 event text 或 provenance。國籍為選手代表國／研究記錄，不推論居留地；發布者所在地用於排除臺灣來源，不冒稱已取得全球法律授權。13 新運動與 2 新解剖部位皆有真實 selection，不造空分類。
