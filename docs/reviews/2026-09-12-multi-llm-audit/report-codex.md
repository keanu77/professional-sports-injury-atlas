**本輪新增問題**

ID NEW-01 · P1
檔案/行號：`scripts/public-launch/check-release.ts:163-168`；缺少路徑 `docs/reviews/2026-09-12-recent-120/playback.preview.json`
重現依據：release gate 會 `readFileSync()` 這個 recent-120 playback 憑證，但目前 `docs/reviews/2026-09-12-recent-120/` 只有 `README.md`、`case-review.json`、`source-research.json`、`thumbnail-capture.json`。
使用者影響：不能把本輪 19 例說成已通過 release playback gate；`check-release` 在進入逐筆 playback 驗證前就會因缺檔失敗。
建議修法：補上同一路徑的 recent-120 playback artifact，內容需符合 `check-release.ts:180-209` 對 `played`、HTTPS owned preview origin、path、timecode 的條件；或若尚未準備發布，明確把這列為 release blocker。
待核實處：該 artifact 是否已在別處產生但未放入目前目錄；19 筆是否全部來自 owned HTTPS preview。

ID NEW-02 · P2
檔案/行號：`src/lib/videos/expansion.ts:267-295`、`src/lib/videos/expansion.ts:99-124`、`tests/unit/recent-120.test.ts:55-62`
重現依據：`recent120Schema` 只透過既有 `additionsSchema` 檢查 slug/videoId/videoUrl/timecode/date window；測試標題說「另一個 upload of existing event」，但實際只把 `videoId/videoUrl` 改成既有影片，沒有測「同一球員、同一事件日、同一事件但不同 videoId」的 duplicate event identity。
使用者影響：未來可用不同 YouTube 影片與新 slug 重複計入同一真實事件，仍可能滿足 19/120 數量與 release coverage。
建議修法：新增明確事件 identity，例如 normalized `name + eventDate + event/bodyPart` 或獨立 `eventId`，在所有公開 observation clips 間檢查唯一；補一個 distinct videoId 但 duplicate event identity 的 failing test。
待核實處：目前 19 例用簡單 `name|eventDate|bodyPart` 沒看到重複；正式 key 應由資料政策決定。

**已存在問題**

ID EXISTING-01 · P2
檔案/行號：`scripts/verify-video-thumbnails.ts:31-56`、`src/data/videos/curation.v1.json:6`、`src/data/videos/expansion.v1.json:146-181`、`src/assets/videos/provenance.json:80-88`
重現依據：縮圖 verifier 的 expected set 納入 `expansion.clips` 但未排除 `curation.removedSlugs`，因此仍期待兩個非公開排除項 `tEHP_6GA6ZA`、`qwuEydc9qXQ`。公開 video allowlist 我用只讀交叉計算是 120 unique 且不含這兩個 ID，但 thumbnail inventory 是 122。
使用者影響：公開路由/播放 allowlist 看起來未暴露 removed videos；但縮圖 provenance/release 驗證口徑仍把非公開排除項當 selected video，會混淆公開素材稽核，也可能讓缺少 removed thumbnail 反而擋 gate。
建議修法：在 `loadVideoThumbnails()` 組 expected clips 時同樣套用 `!curation.removedSlugs.includes(clip.slug)`，並把測試期望改成 public selected IDs 數量；若需要保留封存素材，放到 release gate 之外的 archival manifest。
待核實處：是否有政策要求保留 excluded video thumbnails 作為內部審計紀錄；若有，需和 public release inventory 分離。

未發現新 19 的 slug/update/discovery/resource 對應缺漏；clip 與 event update 的 `videoUrl/eventDate/returnDate/returnText` 也一致。未跑 install、build 或測試。
