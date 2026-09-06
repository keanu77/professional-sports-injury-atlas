# Decision 35 — 自訂網域、製作者與匿名資料回報

## 發布結果

正式 https://injury.sportsmedicine.tw/，Cloudflare domain／驗證 active。使用者完成 CNAME 後曾短暫 522／pending；使用官方 domain PATCH 重試驗證後恢復 active，沒有重建網域或更動主站。正式最終部署 f49d7320-ac5f-406b-95f8-be68a386f39e，來源 6d20b40f8f87940ebc26c3fedb30590c62046277，main／clean。主站首頁、/content/ 都為 200 且 hash 與修改前一致。

原 D21 醫療核准及 origin 不動；D35 的 public-domain.v1.json 獨立記錄使用者選定新網域，BaseLayout canonical／OG 與 receipt 用新 origin；僅重綁輸入摘要。保留 101 支影片、11 部位、15 運動與既有播放統計資料。

## 功能與資料流

頁首製作者連到吳易澄醫師主站；「提供影片／資料修正」連 /contribute/。匿名表單依影片／修正切換欄位，修正可帶入原本瀏覽頁面，附說明及最多 3 筆參考來源。不要求姓名或訪客 email；感謝訊息只顯示在頁面，不寄訪客確認信、不自動修改或刊登回報。

POST /api/contributions 固定呼叫既有主站 /api/contact，再由既有 Turnstile／Resend／CONTACT_RECIPIENT_EMAIL 處理。主站 secrets 不可讀、沒有複製或新設；本輪未修改主站。匿名系統 no-reply 地址只滿足上游既有必填欄位，信內標註勿回覆。只有上游 ok:true 才顯示成功；服務失敗／逾時／429 保留輸入，不宣稱送達。使用者提供的網址不會由伺服器抓取。

方法、來源、JSON、串流 body 12 KB、URL、修正說明、來源筆數、honeypot 及 3/min/isolate/IP 驗證已加入。主站選用 KV 有 3/min、10/hr 限流；relay 可能共用出口，容量受主站限制，無寄信佇列或全域限流保證。Token 單次有效與送出時停用按鈕降低重複請求，沒有保證 exactly-once delivery。

public/_routes.json 明確開放新 API；CSP 放行 Turnstile script/frame，只在表單頁載入。窄表單採 compact widget，其餘 flexible；隱私頁說明寄信、安全驗證與資料用途。尺寸依 [Cloudflare 官方 widget 文件](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/) 的 300 px flexible 最小寬度選擇。

## 驗證

- 最終單元 85 檔 1,380 項；Astro 0 errors／0 warnings、16 既有 hints；變更格式通過。
- 四瀏覽器 52 項頁首／表單驗證；最後提示／窄螢幕修改再跑 12 項表單回歸，皆通過。送出與 Turnstile mock，不寄真實郵件。
- release:public 通過 145 HTML、2,322 內部連結、384 產物；醫療與授權檢查保持。
- 最終正式 149 回應 hash／canonical 相符，5 頁 × 390/1440 共 10 組 Axe、無溢位、製作者／入口／表單外觀與熱門 GET 通過。
- 正式 API 方法拒絕 405、跨來源拒絕 403、空修正說明 400；皆在寄信前拒絕。
- 新網域王建民 native playback 成功；DNT 並攔截 /api/plays，1 個測試請求攔截，0 傳送，未污染正式熱門。
- 主站首頁及內容頁原 hash 保持。手機與桌面截圖已人工檢視。

初輪 root dirty provenance 與 sandbox listen 拒絕導致既有測試失敗，改乾淨隔離 checkout 及授權 loopback 執行通過；另修正測試 mock 重複讀取 Response。第一個新表單預覽 API 404，實查發現 _routes.json 少新路由，補上後加入回歸並驗證 405/403/400。這些失敗未視為通過。

## 尚未驗證的部分

真實 Turnstile 在新網域已顯示 widget，但自動 Chrome 要求人工勾選，未取得 token；診斷亦見 challenge 子請求 ERR_ADDRESS_UNREACHABLE。沒有換測試 key、沒有繞過安全驗證。寄信邏輯單元與頁面成功／失敗回歸通過，但尚無實際寄送／收信證據。

已詢問使用者是否允許一封「影片圖鑑功能測試」，尚未收到答覆。下一步由真人完成驗證後送出一筆測試，再確認主站目前設定的收件信箱收到通知；未確認之前不得宣稱端到端寄信已完成。收件地址 secret 未讀出，也不得僅依本機 .env 宣稱正式寄送到某地址。

本次來源提交 c749c03（功能）與 6d20b40（提示／尺寸），均已 push。證據位於 evidence/decision-35；最終 browser.production.final.json 與 deployment.final.json 為目前正式依據。先前 pending-domain 與 preview 證據保留為歷史，不能當作當前狀態。
