# 內容契約（Content Contract）

單筆結構由 `src/lib/contracts/case.ts` 的 `z.strictObject()` 定義；跨欄位／跨案例規則在 `src/lib/contracts/cross-validation.ts`。本文件是人類可讀對照表，衝突時以程式碼與測試為準。

## 受控 enum

| 型別                 | 值                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `CaseStatus`         | `draft`、`source-verified`、`medical-review`、`approved`、`rejected`、`retired`                        |
| `ConfirmationStatus` | `unconfirmed`、`confirmed`、`conflicted`                                                               |
| `ReviewStatus`       | `not-requested`、`in-review`、`approved`、`changes-requested`                                          |
| `EmbedStatus`        | `verified`、`external-link-only`、`unavailable`                                                        |
| `CaptionStatus`      | `available`、`unavailable`、`not-verified`                                                             |
| `VideoProviderCode`  | `youtube`、`nba`                                                                                       |
| `VideoContentType`   | `in-game-injury-event`                                                                                 |
| `ProvenanceStatus`   | `pending`、`verified`、`rejected`                                                                      |
| `PublicRightsStatus` | `not-requested`、`cleared`、`rejected`                                                                 |
| `InjuryCode`         | `acl`、`ankle-sprain`、`achilles-rupture`                                                              |
| `SourceType`         | `diagnosis-first-party`、`diagnosis-secondary`、`video-original`、`event-context`、`teaching-evidence` |
| 更新／總覽 `status`  | `draft`、`medical-review`、`approved`                                                                  |

機轉 registry（觀察分類，永不作為診斷）：`non-contact-cut`、`non-contact-landing`、`contact-at-knee`、`hyperextension-visible`、`inversion-landing`、`contact-landing`、`stepped-on-foot`、`push-off-acceleration`、`deceleration`、`unclear`；`unclear` 不得與其他 tag 併用。

## 識別與日期

- `id` 符合 `^CASE-[A-Z0-9]+-[0-9]{4}-[0-9]{3}$`；`slug` 為 lower-kebab-case；ID／slug 全域唯一；檔名必為 `{slug}.json`。Source ID 跨全案例集合唯一。
- 一般 `season` 為 `YYYY` 或 `YYYY-YY`；NBA cross-validator 強制兩年制 `YYYY-YY`，且事件日期必須落在該球季。日期為 ISO `YYYY-MM-DD`，時間戳為 UTC `YYYY-MM-DDTHH:MM:SSZ`。

## 診斷規則

- 診斷永遠來自外部具名來源；影片畫面與機轉標籤不構成診斷。
- 核准／公開需 `injury.confirmationStatus='confirmed'`。
- 近期核准案例需至少一個 `diagnosis-first-party` 來源。經典案例同樣以 first-party 為先；只有其綁定 source audit 含結構化 `documented-unavailable` first-party 證據時，才可改用至少兩個 `diagnosis-secondary`，且 `independenceGroup` 不同、不得共享同一非空 `originReportId`。

## 經典案例 cutoff

`eventDate >= 2016-08-06` 為一般近期案例。更早的事件必須 `isClassic=true`、非空 `classicReason` 與 `classicProposedBy`（且與 frozen source-review decision 的提案一致）；核准的經典案例另需 `classicExceptionApprovedBy` 等於同案例的醫療審查者姓名。UI 一律顯示「經典案例」標籤與理由。

## 影片與權利規則

- 主影片必為 `in-game-injury-event`，由官方／權利方頻道上傳，並與 event source 綁定同一球員／日期／對手／賽事。訪談、新聞回顧、練習、復健、剪輯合集一律不合格。
- Provider registry 控制 host 與 embed 能力：`youtube`（youtube.com／www.youtube.com／youtu.be）可 `verified` 內嵌；`nba`（nba.com／www.nba.com）僅 `external-link-only` 或 `unavailable`。新 provider 必須改 registry 與測試。
- 所有 URL 皆 HTTPS；禁止任意 iframe HTML 與儲存縮圖 URL。`fallbackUrl` 必須等於同一 canonical 原始平台頁面。
- `sourceProvenanceVerification` 與 `publicRightsReview` 永不互換：前者綁 pre-verification video-identity digest 與 source-policy 版本；後者綁 video-source digest、rights policy 版本與 per-case `PublicVideoRightsDecisionV1` 檔案。政策或識別改變即失效。
- 每支影片記錄 caption 狀態與查核日期；本站永不儲存逐字稿。公開內嵌需 `captionStatus='available'`，否則降級為明確標示的原始平台連結。

## 時間軸（timecode）規則

Segment 秒數為整數、遞增、不重疊，且 `0 <= start < end <= durationSeconds`。時間軸連結是真實的原始平台 timestamp URL；JavaScript 只在播放器就緒後攔截並 `seekTo()`，失敗時瀏覽器直接開啟原始 URL。

## 來源／證據區分

- `video-original` 只支援 `general.whatHappened`、`general.whatIsVisible`、`video.segmentObservation`；診斷來源支援 confirmed-diagnosis／confirmedUpdate 路徑；`event-context` 支援 `general.whatHappened`；**只有** `teaching-evidence` 可支援 professional 路徑。
- `professional.claims[]` 是原子證據契約：每條 claim 有穩定 ID、單一欄位路徑、exact text 與非空 evidenceIds；欄位文字必須恰好等於其有序 claim 以空行串接；`professional.evidenceIds` 恰好等於全部 claim 證據的 sorted unique 聯集。傷種總覽（`injury-overview.ts`)沿用同一規則，並禁止逐週處方／劑量表／複製 RTP 課程單元。

## 來源批次與 registry

`sourceManifestBinding` 把案例凍結到 immutable source batch entry（manifest／entry／decision digest＋policy 版本）。Registry（`research/source-manifest-registry.v1.json`）為 append-only：batch 只能新增（launch／quarterly／correction），correction 需 exact `supersedes`；superseded 綁定不能通過當前醫療／公開選擇，必須重綁、重審或轉入 retired／unavailable。歷史 release 只對自己 release-time 的 immutable artifacts 驗證，永不被改寫。
