# Decision 33 — 受傷情境、精選與本站熱門

依使用者「請加入受傷情境、精選影片、本站熱門（本站近 30 天實際播放次數）」完成實作。總數維持 78，7 部位、14 運動；新增 7 個主要受傷情境，各影片只歸一組：跳躍落地 18、跑動轉向 17、碰撞接觸 22、滑壘滑倒摔落 6、球體撞擊 5、揮拍擊球 1、其他／畫面未明 9。依原有可見觀察，不由診斷推定原因，原醫療資料與核准不改。

精選 6 支、跨 5 運動：Acuña、Zverev、Marín、Bassitt、Dupont、Vonn。使用原有卡片 DOM 切換全部／精選／熱門，分類為靜態頁，無 JS 仍可瀏覽全部與分類。熱門只在點選時讀取，沒有資料或服務失敗皆顯示真實狀態，不拿精選冒充熱門；阻止慢請求覆蓋後來的選擇。

## 播放統計

沿用官方 YouTube IFrame API，只有 onStateChange=PLAYING 觸發；載入、ready、暫停、緩衝或結束不計。同頁同播放器首次開始一次，pause/resume 或同事件 UUID 重送不再累計；重新開啟頁面可產生新事件，不是獨立觀看人數。

兩個同源 Pages Functions，資料寫入 D1，固定已發布影片 allowlist、512 bytes body 上限、UUID／欄位檢查、同源 Origin、參數化 SQL、伺服器時間、精確 now−30 days < played_at <= now。DNT/GPC 不蒐集。僅保存影片 ID、隨機事件 ID 及時間，沒有 IP／訪客 Cookie／跨頁識別碼。過期紀錄隨寫入清理。熱門快取最多 60 秒。

Preview/local：atlas-playback-preview，14ebcfe3-b040-4726-b7e6-84c6c8c03f3d；Production：atlas-playback-production，d7fae228-d624-4746-bfad-a00bc9ed7800。從已下載的現有 Pages 設定添加獨立綁定；公開仍為 Astro static，不導入 SSR。_routes 僅啟用 /api/plays 和 /api/popular。新 functions／migrations／wrangler 設定納入 inputTreeDigest。

## 獨立複核與限制

獨立 reviewer 核對資料、API、UI及來源，重跑 26 項 focused tests。P2 無頻率限制已部分緩解：每 isolate/IP 每分鐘 POST 30、GET 60，上限 4096 keys；IP 只在記憶體，下一分鐘請求進來或 isolate 回收才清除，已如實寫入隱私。這不是跨 isolate 全域配額，也不能阻止刻意偽造客戶端播放事件，不宣稱防灌榜保證。Cloudflare Pages 官方綁定清單及已安装 Wrangler 4.129.0 validation 不支援 rate-limit binding，沒有為此另加 Worker。保留此匿名統計的限制。

## 驗證

84 檔 1,348 單元通過；第一次 root dirty tree 造成三個既有治理測試拒絕，乾淨隔離副本重跑全部通過。Astro 0 errors／0 warnings、16 既有 hints；四瀏覽器 100 回歸通過；變更格式通過。公開產物 116 HTML、1,722 內部連結，原封面與 78 影片不變。

最終預覽 https://49b4fe97.sports-injury-atlas.pages.dev/，實際 HTTPS iframe 已驗證 ready 不寫入、PLAYING 增一筆、pause/resume 不增、同 UUID 重送不增、跨站／未知影片拒絕、首頁熱門反映新次數。首次測試腳本卡在 Playwright 讀 keepalive response.body，保留中止紀錄；改以 HTTP 狀態與獨立 DB 查詢驗證後全部通過，沒有修改實際播放器或計次邏輯。這兩次中止所產生的真實測試播放都只在 preview。正式 DB 新建後確認為零，無預覽測試混入。

UI 含精選／mock 熱門排序、空／503、競態、無 JS、三尺寸與新分類 light/dark Axe 通過；mock 值從未寫入 DB。正常字體手機／桌面畫面已人工檢視。完整預覽逐頁與正式驗證完成後補記。

參考：[YouTube 官方事件](https://developers.google.com/youtube/iframe_api_reference)、[Pages 綁定](https://developers.cloudflare.com/pages/functions/bindings/)、[Pages 設定](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)、[D1 參數化查詢](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)。
