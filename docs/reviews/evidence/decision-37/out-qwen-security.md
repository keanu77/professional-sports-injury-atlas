開頭哨兵 SECURITY_START。
末端哨兵 SECURITY_END。

**P1 漏洞：Turnstile 驗證未校驗 `action` 參數，存在跨動作濫用風險**
*   **File/Line**: `DEPENDENCY main-site-contact.ts` (行 128-140 `verifyTurnstile` 函數內部及 170-173 呼叫處)
*   **利用條件**: 攻擊者獲取其他 Cloudflare Turnstile 實例（例如同域或異域的登入、註冊等敏感動作）生成的有效 Token。
*   **影響**: 攻擊者可將用於高風險操作（如登入）的 Turnstile Token 重用於此處的低風險表單提交，或反之（若此處為唯一驗證點則影響較小，但通常 Turnstile 最佳實務要求嚴格匹配 `action` 以防止 Token 重用攻擊）。若 `action` 未校驗，攻擊者可能在其他情境下生成 Token 並在此處重用，繞過針對特定表單的速率限制或風控策略。
*   **具體修法**: 在 `verifyTurnstile` 中解構 `TurnstileVerifyResponse`，檢查 `data.hostname` 是否為預期主機（如 `injury.sportsmedicine.tw` 或 `sportsmedicine.tw`），並強制檢查 `data` 中是否包含預期動作或確保前端傳遞的 `action` 與後端預期一致（需前端傳遞 `action` 並在後端比對，或依賴 Turnstile 的 `action` 參數校驗邏輯，需在 `siteverify` 請求中傳入 `action` 參數並校驗響應或確保前端嚴格限制動作）。最簡潔修法是前端傳遞 `action: "atlas-contribution"`，後端在 `verifyTurnstile` 請求中加入 `form.set("action", "atlas-contribution")` 或校驗返回的 `hostname` 與預期域名匹配。
*   **confidence**: 0.9

**P1 漏洞：主站聯絡表單未對 `message` 欄位進行控制字元過濾，存在郵件報頭注入風險**
*   **File/Line**: `DEPENDENCY main-site-contact.ts` (行 188-191 及 220-235)
*   **利用條件**: 攻擊者提交包含 CRLF（\r\n）或 NUL 字元的 `message` 內容。
*   **影響**: 雖然 `message` 在 HTML 渲染時有 `escapeHtml`，但在構建純文本郵件 `textBody` 時直接拼接 `message`。如果 Resend API 或郵件伺服器未嚴格過濾報頭中的 CRLF，攻擊者可注入自定義郵件報頭（如 `Reply-To` 改為攻擊者信箱，或 `Bcc` 發送垃圾郵件），造成隱私洩露或垃圾郵件濫用。註釋中提及 `message` 豁免控制字元檢查，這是錯誤的最佳實務，因為純文本郵件 body 中的 CRLF 可能被某些郵件代理或客戶端誤解，或若 `message` 被用於其他報頭字段則風險更高。即使僅用於 body，注入額外報頭是常見攻擊向量。
*   **具體修法**: 對 `message` 也應用控制字元過濾，或使用正規表達式移除 `\r\n` 序列，或確保 Resend API 在處理 `text` 字段時嚴格避免報頭注入。建議對 `message` 執行 `message = message.replace(/[\r\n]+/g, ' ')` 或僅允許 LF，並在發送前進行淨化。
*   **confidence**: 0.85

**P2 可靠性缺陷：Turnstile 驗證失敗時未區分臨時錯誤與永久失敗，導致潛在的誤判**
*   **File/Line**: `DEPENDENCY main-site-contact.ts` (行 135-140 `verifyTurnstile` catch 塊)
*   **利用條件**: Cloudflare Turnstile 服務暫時不可用或網路抖動導致 `fetch` 拋出異常。
*   **影響**: 當 Turnstile 驗證因網路問題失敗時，`verifyTurnstile` 返回 `false`，導致合法的用戶請求被拒絕（400 錯誤）。這降低了系統在依賴服務不穩定時的可用性。應區分「驗證失敗」（Token 無效）與「驗證服務不可用」（網路錯誤），後者應返回 503 或 502，讓用戶稍後重試，而非直接拒絕。
*   **具體修法**: 在 `verifyTurnstile` 的 catch 塊中拋出特定錯誤或返回特殊狀態，讓 `onRequestPost` 區分處理。例如，catch 中 `throw new Error("turnstile-service-unavailable")`，然後在 `onRequestPost` 中 try-catch 此錯誤並返回 503。
*   **confidence**: 0.7

**P2 安全缺陷：`publicUrl` 未阻止內部網路地址（SSRF 防護不足，雖未直接抓取但可能用於後續流程）**
*   **File/Line**: `src/lib/video/contributions.ts` (行 8-26 `publicUrl` 函數)
*   **利用條件**: 攻擊者提交指向 `10.0.0.1`、`192.168.x.x`、`127.0.0.1` 或 `169.254.x.x` 的 URL。
*   **影響**: 雖然註釋說明「submitted URLs are text, never fetched」，但若未來有自動化流程或人工審核時點擊連結，或若其他系統消費這些數據並嘗試抓取，將構成 SSRF 風險。此外，當前 `publicUrl` 僅阻止 `http://169.254.169.254` 等明面地址，但未解析 DNS 或檢查 IP 範圍。建議在提交階段即阻止內部地址，防止數據污染。
*   **具體修法**: 在 `publicUrl` 中增加對 IPv4 私有地址（10.x, 192.168.x, 127.x, 169.254.x）及 IPv6 迴環地址的檢查。可使用 `URL` 的 `hostname` 解析或正則匹配常見私有 IP 模式。
*   **confidence**: 0.75

**P2 可靠性缺陷：Play Count 插入操作未處理並發競態導致的事件遺漏或重複計數**
*   **File/Line**: `src/lib/video/play-counts.ts` (行 108-115)
*   **利用條件**: 同一用戶在同一毫秒內發送多個相同 `eventId` 的請求，或 D1 資料庫在 `INSERT OR IGNORE` 時發生衝突但未正確處理。
*   **影響**: `INSERT OR IGNORE` 確保了 `eventId` 的唯一性，但若 `eventId` 在前端生成時存在重複（例如瀏覽器快取導致重複發射），則後端會忽略重複請求。然而，`smallJson` 讀取體積限制為 512 字節，若 `eventId` 格式錯誤或未通過正則，會被 400 拒絕。主要風險是若前端未正確實現 `eventId` 的獨一性生成（如每次頁面載入新生成 UUID），則可能導致計數不準確。目前代碼依賴前端生成 UUID v4，若前端實現有缺陷，後端無法檢測。建議後端增加對 `eventId` 的有效期檢查或與 `videoId` 關聯的唯一性約束。
*   **具體修法**: 確保前端在每次會話或播放動作生成新的 `eventId`。後端可增加日誌監控被忽略的事件數量，以檢測異常。
*   **confidence**: 0.6

**P2 安全缺陷：`contribution-limits.ts` 中的 HMAC 密鑰旋轉機制未明確，可能導致歷史數據無法驗證**
*   **File/Line**: `src/lib/video/contribution-limits.ts` (行 46-76)
*   **利用條件**: 若 `contribution_guard_key` 中的密鑰被更換，歷史的 `ip_key` 和 `content_key` 將無法用新密鑰重現，導致重複請求檢測失效。
*   **影響**: 密鑰旋轉後，攻擊者可通過使用舊密鑰生成的 key 繞過重複檢測，或使用新密鑰生成新的 key 規避每日限制。需確保密鑰旋轉時有過渡期或雙寫機制，或確保密鑰穩定。
*   **具體修法**: 確保 `contribution_guard_key` 在部署週期中穩定，或實現密鑰版本化，查詢時同時檢查多個版本的 key。
*   **confidence**: 0.65

**P1 漏洞：主站聯絡表單的 `reply_to` 欄位未經驗證即轉發，可能被用於釣魚或垃圾郵件**
*   **File/Line**: `DEPENDENCY main-site-contact.ts` (行 228-232)
*   **利用條件**: 攻擊者在 `email` 欄位填寫惡意信箱（如 `attacker@evil.com`）或帶附件的信箱。
*   **影響**: 雖然 `email` 經過 `isValidEmail` 格式驗證，但未限制域名。攻擊者可將 `reply_to` 設為惡意地址，當受害者回覆郵件時，郵件將發送至攻擊者信箱，可能包含敏感信息或用於釣魚。
*   **具體修法**: 對 `email` 進行域名白名單檢查，或僅允許公司內部域名，或移除 `reply_to` 欄位，改為在郵件正文中顯示用戶信箱而不設為 `reply_to`。
*   **confidence**: 0.8

**P2 安全缺陷：`contributions.ts` 中未對 `sources` 欄位進行內容淨化，可能包含惡意腳本或連結**
*   **File/Line**: `src/lib/video/contributions.ts` (行 123-127)
*   **利用條件**: 攻擊者在 `sources` 中嵌入 JavaScript URL（`javascript:alert(1)`）或 HTML 標籤。
*   **影響**: 雖然 `publicUrl` 驗證了協議，但僅允許 `http:` 和 `https:`，因此 `javascript:` 會被拒絕。但若 `sources` 包含 HTML 實體或特殊字元，在郵件中顯示時可能被誤解。目前郵件發送使用純文本格式，風險較低，但建議對 `sources` 進行 URL 編碼或淨化。
*   **具體修法**: 在生成郵件內容前，對 `sourceUrls` 進行 URL 編碼或確保僅包含安全字元。
*   **confidence**: 0.5