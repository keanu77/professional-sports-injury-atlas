# 2026-11-19 單次發布例外

**已部署並完成線上驗證**：[正式站](https://injury.sportsmedicine.tw)，版本 `efd5aa5aca4b6754b1ca4a6440b2aed20d7a67ad`，Cloudflare production `9a38af65-df01-4d12-83d8-df61b0f4e4d8`。正式成品 276 頁、203 支影片、15,269 個站內連結。部署紀錄見 [deployment.json](deployment.json)，逐項驗證及範圍見 [verification.json](verification.json)。本次授權已使用，不能再次執行。

使用者在得知兩項發布門檻仍未完成後，對以下確認回答「允許」：

> 是否同意對本次 203 支影片版本（ab3f048）採用一次性發布例外？例外範圍只有兩項：接受 picomatch 的本地防護（官方 audit 仍未通過），以及暫緩全數影片的本次實播驗收；失敗與待驗證紀錄會保留，不改寫醫療核可。

這是發布例外，不是上游漏洞結案、播放成功或新的醫療核可。原始 `security:check`、一般 `release:public`／`release:legacy`、歷史核可與 pending 實播檔保持原狀。

`authorization.json` 綁定此候選版、四份發布準備程式、程式 commit、完整 input digest、lock、203 支 inventory、舊臨床核可及 pending 實播檔 hash；有效期最多 24 小時。發布後的 `deployment.json` 使同一授權不能再次執行。新增其他 advisory、未知套件副本、內容改動、過期或髒工作樹仍會阻擋。

```sh
ATLAS_RELEASE_AUTHORIZATION=2026-11-19-owner-exception node --import tsx scripts/public-launch/release-with-authorization.ts
```

這個命令保留完整 audit 的失敗報告，只對指定 advisory 的傳遞影響允許本次發布建置。它會核對 picomatch 防護、其他內容／臨床／來源條件，重新建置 production artifact 並執行既有完整 artifact 檢查。新 input binding 留在本次授權，不更動 2026-09-06 的臨床核可。上傳是建置驗證後獨立執行的步驟，不能上傳 `artifacts/public-preview`。

正式站：`https://injury.sportsmedicine.tw`，Cloudflare Pages project `sports-injury-atlas`。前一正式部署 `28c920c4-d58e-409d-94f9-3d3100400383`／source `9d6f38a4159ec69715e8e185cc1c363b1430bf49`，保留為本次回復目標。

## 發布時發現的資料格式修復

完整 checker 找到 Curry 三筆分類的既有格式缺口：`video-content-types.v1.json` 已列新聞／本人訪談／專業解說，原 integration README 也記載相同片型，但被引用的 `media.json` 沒有 `tags`。新增 `curry-classification-binding.json` 將既有分類序列化，綁定原媒體證據與原 README 的 SHA-256。checker 只對這個明確來源套用補充欄位，仍逐筆核對 slug、URL、tags 與 segments。原媒體證據位元組、播放狀態、時間窗與臨床核可均未更改。
