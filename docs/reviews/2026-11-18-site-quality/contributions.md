# 投稿與來源政策改善（T13／T14）

日期：2026-11-18；實作分支 `feat/site-quality-20261118`。

已實作：

- 自訂驗證回傳逐欄錯誤；欄位連接錯誤文字、`aria-invalid` 與可跳回欄位的錯誤摘要。保留原有 live status、原生欄位限制及後端驗證。
- 首次 Turnstile script 下載、API 缺失、render 失敗或等待逾時可原地重試。已有 widget 仍用 reset；輸入不清除，未通過驗證不送出。
- 同分頁 sessionStorage 草稿：只保存類型、公開網址／說明／來源，以及恢復所需版本、來源頁、時間與結果不確定旗標。有效期30分鐘，輸入時重新計時；到期移除儲存而保留頁面文字。拒絕多餘欄位、超長值、未來日期、不同來源頁；不存 challenge token、姓名／信箱欄位或 honeypot。可手動清除；確認成功後清除；儲存被停用時顯示實際限制。
- 不確定結果不自動重寄，需使用者明確允許重試，再次按送出；不確定狀態跨重新整理保留。原有後端 D1 防重寄與額度保留仍有效。
- 後端產生隨機 request ID，回應與固定上游請求使用同一 header。保留原 JSON body／信件格式；不信任訪客提供的 ID。結構化紀錄只含隨機 ID、固定 reason/status、HTTP status、latency；guard reservation ID 僅在 UUID 格式時記錄，以便內部核對。settle 失敗保留 pending 並記錄 `settle-failed`，不重寄。
- 隱私頁同步記錄實際草稿期限／清除方式、儲存不可用行為與隨機回報編號的診斷範圍。
- 來源政策涵蓋目前 YouTube 與 MLB／Streamable 播放流程，保留點擊前提示、原始來源及字幕／再製權的界線。

驗證：

```sh
PATH=/Users/ethanstudio/.local/share/mise/installs/node/24.14.0/bin:$PATH \
  node_modules/.bin/vitest run tests/unit/contributions.test.ts \
  tests/unit/contribution-form.test.ts tests/unit/contribution-limits.test.ts
```

2026-11-18 02:16 Asia/Taipei：3 files／103 tests 通過。日誌：`output/site-quality-validation/contributions-unit.log`。內容涵蓋原點／型別／大小／URL邊界、配額／D1 settlement、模糊上游結果、非個資對帳、逐欄指引與草稿期限／範圍／token排除。

`e2e/contributions.spec.ts` 已補寫並成功列出 Chromium 22 個案例，包含既有失敗保留、錯誤關聯、首次驗證3種失敗重試、草稿恢復／清除／無儲存、模糊送件跨重整鎖定。**此處尚未執行瀏覽器測試**，由主代理在新產物建好後統一執行。全部挑戰與送件請求均以本地mock驗收，不會發送真實信件。

尚待整合驗收：完整typecheck／build、公開preview與跨瀏覽器E2E、人工讀屏與正式環境實況。API接受不等於收件端已收到；本輪未向production POST或測真實Turnstile／收件。
