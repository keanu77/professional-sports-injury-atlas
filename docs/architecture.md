# Atlas 平台架構

本文件記錄平台底座的固定邊界。實作細節以 `src/lib/**` 的型別與測試為準；本文件說明「為什麼這樣切」，避免後續開發越過治理邊界。

## 選擇器邊界（selector boundaries）

所有「哪些案例可以出現在哪裡」的判斷只存在 `src/lib/cases/selectors.ts`：

- `selectReviewCases()`：review build 專用，包含 draft／source-verified／medical-review／approved 並標示各自狀態。
- `selectMedicallyApprovedCases()`：只含 `status='approved'`、外部診斷 confirmed、來源批次綁定與 provenance 皆為當前版本、醫療審查 digest 相符的案例。G5 計數只用這個選擇器；它刻意**不**要求公開權利清查。
- `selectPublicCases()`：在醫療核准之上再要求 `publicRightsReview` cleared 且 digest／policy 為當前版本。公開站內嵌播放另需 `captionStatus='available'`；字幕 unavailable／not-verified 的案例降級為明確標示的原始平台外部連結，但不因此被剔除。
- Astro 元件與路由**不得**重複實作核准邏輯；它們只消費選擇器輸出。

## 逐案例 digest

`src/lib/cases/canonical-json.ts` 是唯一的 canonical 化演算法（NFC、鍵排序、無多餘空白、SHA-256）。三個互相獨立的 digest：

- `computeCaseContentDigest()`（clinical digest）：allowlist 投影，含事件識別、兩層筆記、來源與影片事實；排除 workflow `status`、醫療 `review`、審查者身分、`publicRightsReview` 與 `audit`，因此套用具名醫療決定不會改變被審查的內容 digest。
- `computeVideoIdentityDigest()`：驗證前的影片識別 payload；provenance 驗證綁定它，識別或 source-policy 版本改變即失效。
- `computeVideoSourceDigest()`：識別 payload 加 embed／caption／provenance 狀態；公開權利清查綁定它。

`review.status='approved'` 而 digest 過期的紀錄立即被拒。

## Site digest 與發布治理

`src/lib/governance/site-digest.ts` 把「整個站的可公開狀態」壓成一個 digest：governance 旗標、reviewedContentCommit、renderer tree digest、公開案例 ID＋clinical＋video-source＋rights-decision digest tuples、三份傷種總覽、當前季度更新、frozen release bases、課程連結與政策版本。任何一項改變都使既有的 `SitePublicationDecisionV1` 與索引授權失效。`release:public` 由 `scripts/release-check.ts` 執行，缺少任何授權即以明確訊息失敗——公開發布在本階段**設計上不可能成功**。

## Review／public 兩種 build mode

`ATLAS_BUILD_MODE` 只接受 `review`（預設）與 `public`。Review 模式在每頁輸出 `noindex,nofollow,noarchive,nosnippet,noimageindex`、robots `Disallow: /`、無 sitemap／analytics／第三方 iframe／preconnect，並得渲染 review-only fixture 路由與 component lab；public 模式不產生任何 review 路由。**noindex 不是隱私**：在 hosting 計畫實測 access control 之前，任何 review artifact 都不得聲稱是私人部署（`ops/http-header-policy.v1.json` 亦明載 HTTP 遞送為 not-verified）。

## RTP catalog 唯讀匯入

`scripts/import-rtp-catalog.ts` 只讀 parent workspace 的 `artifacts/rtp/rtp-catalog.v1.json`＋manifest，逐 byte 驗證 SHA-256 後以 allowlist 欄位寫出 `src/data/generated/rtp-course-summaries.v1.json`。它不寫回 parent、不匯入 RTP 影片或處方內容；課程公開連結另需 `CourseLinkApprovalDecisionV1` 與上游課程本身的醫療／索引授權，缺一即回到 `課程連結待核准`。

## 外部驗證與一般 build 解耦

`npm run build:review` 永不連網。`npm run external:verify`（`src/lib/external/verification.ts`）是唯一連網路徑：受限並行（≤3）、15 秒 timeout、至多 3 次退避重試、只對已驗證案例資料中既有的 HTTPS URL 發出 GET；結果寫入 `artifacts/external-verification.v1.json`，由 release gate 以 7 天新鮮度與 exact URL-set 比對消費。
