# Decision 39：十五項網站優化完成報告

日期：2026-09-07（台灣時間）。範圍：Decision 37 已驗證的 15 項改善建議，以及投稿所依賴的 `sportsmedicine.tw` 聯絡 API。醫療事件與來源資料沒有因版型一致而硬填；真人投稿寄達仍需一次明確授權後的正式信件驗收。

## 完成範圍

| 編號 | 完成內容                                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| 01   | 手機首頁用分頁切換受傷部位、運動項目與受傷情境，加入直接到影片入口，縮短選片路徑。                               |
| 02   | 94 張觀察影片卡片統一補上部位、運動與事件年份。                                                                  |
| 03   | 觀察頁加入依既有資料選出的民眾參考重點與 1–3 篇主站相關文章；保留證據限制。                                      |
| 04   | 回場天數改以「首次復健賽／首次正式出賽」等已核定里程碑直接標示。                                                 |
| 05   | 個案影片來源操作擴為適合觸控的連結區，並重跑鍵盤與 WCAG 2.2 檢查。                                               |
| 06   | 投稿三個內容欄位皆空時，前後端一致拒絕，公開影片網址仍為選填。                                                   |
| 07   | 播放事件新增 D1 共享短期防重與嘗試紀錄；隱私偏好及每小時熱門規則不變。                                           |
| 08   | 修補 `fast-uri`、`nanoid` 公告版本；高風險依賴稽核歸零。                                                         |
| 09   | 影片頁加入同部位／同情境相關影片，分類選擇與返回位置可由 URL hash 保存。                                         |
| 10   | 加強動作觀察、聲音與字幕查核狀態說明，未驗證字幕不被寫成已提供。                                                 |
| 11   | 補 favicon、Open Graph、影片頁 `VideoObject`（僅輸出已知欄位）與正式 sitemap。                                   |
| 12   | 查核日期改為逐筆保存；每週健康監測分開判斷來源網址、YouTube metadata 與可嵌入狀態。                              |
| 13   | About、來源政策、首頁標題與站內投稿導覽語意整理完成。                                                            |
| 14   | CSP 移除 `script-src 'unsafe-inline'`；主站 Turnstile 後端精確校驗合法 hostname/action。                         |
| 15   | 投稿將輸入錯誤 400 與驗證服務暫時無法使用 503 分開顯示，並加入不含投稿內文、token、IP 或上游回應的固定結構日誌。 |

## 來源健康盤點

2026-09-07 實際掃描 101 支影片、287 個來源網址。YouTube oEmbed metadata 為 101／101 可用；2 個參考來源確認回 404，15 個來源因反機器人或網路狀態暫時無法判定，沒有誤標成失效。環境未提供 YouTube Data API key，所以本次沒有宣稱重新證明 101 支皆可嵌入；工作流程在有 key 時會另外檢查 embeddable 狀態。

目前確認 404：

- Carolina Marín 2019：西班牙羽協舊醫療公告。
- Héctor Bellerín 2019：Wolves 舊賽事頁。

這兩筆保留為健康監測訊號，等待依內容與來源治理補上等價來源；沒有在本輪自行改寫醫療證據。

## 驗證

- Atlas 單元測試：92 檔、1457／1457 通過。
- Atlas Astro：0 errors、0 warnings、16 個既有 hints；內容檢查通過。
- Decision 39 桌機與手機瀏覽器驗收：16／16；投稿 Chromium E2E：12／12。
- 夜間預設、切換、頁尾連結與既有投稿／播放器 Chromium 驗收：37／37；版型與無障礙跨 Chromium、Firefox、WebKit、行動 Chromium：44／44。
- Atlas `npm audit --audit-level=high`：0 vulnerabilities。
- Atlas public release：101 個事件綁定、145 頁、3,323 個本機連結，沒有 review route 或預先載入影片；Decision 21 核准鏈保持有效。
- D1 migration `0003_play_guards.sql` 已套用 preview 與 production；既有播放與投稿資料表保留。
- 主站 Turnstile 目標測試：30／30；完整測試 1590／1590；建置 380 頁。
- 主站搜尋探索：369 個 sitemap URL、369 頁受檢、0 warning、0 error；正式路徑連續性 0 unresolved、0 error。
- 主站 Spectra change 已封存，`spectra validate --all` 通過。

## 發布與營運驗收

發布前另依使用者指示，把新訪客的初始外觀改為夜間模式；讀者仍可切換淺色模式，選擇只保存在瀏覽器。頁尾同步加入主站公開的衛教部落格、Facebook、Instagram、GitHub、LINE 與 RSS 六個追蹤入口。

- Atlas 功能來源 commit `1ba51be7cbc4d19abba5db047ac2e538965d8719` 已推送至 GitHub main；Cloudflare Pages deployment `1f9f8b91`：<https://1f9f8b91.sports-injury-atlas.pages.dev/>。
- <https://injury.sportsmedicine.tw/> 與本次 deployment 首頁 SHA-256 同為 `e388ed8084b36a3703632a8d5783663f3af27f342591694355197f8a9dfe516a`。兩者都含夜間初始值、直接看全部影片與六個追蹤入口。
- 正式 Atlas CSP 的 `script-src` 已無 `unsafe-inline`；`/preferences-init.js` 為 200、JavaScript MIME，實際內容以 `dark` 起始並接受已保存的 `light`／`dark`。
- 主站來源 commit `d2533c9239b5987f4ede70143c6b8d3902586c51` 已推送至 GitHub main；Cloudflare Pages deployment `4ca9fa52-e47c-4869-ab55-5018cfa25f5d`：<https://4ca9fa52.sportsmedicine-tw.pages.dev/>。
- <https://sportsmedicine.tw/contact/> 與主站 deployment HTML SHA-256 同為 `a1d5f3f3d172a0f3e9d2c7a75b0e73bf791722fe845f65ed9f5ad766ef5f99c8`，都含 `data-action="main-contact"`。刻意無效的 Turnstile token 得到 400 `Turnstile verification failed`，在 Resend 之前停止，沒有寄信。
- preview 與 production D1 均回報 `No migrations to apply`。

本輪不會以無效 token 或 mock 成功取代真實收信證明；仍需使用者明確允許送出 1 次真人投稿，才能完成實際信箱寄達驗收。
