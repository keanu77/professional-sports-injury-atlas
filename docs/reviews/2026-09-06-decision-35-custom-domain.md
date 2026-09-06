# Decision 35 — injury.sportsmedicine.tw（待 DNS）

使用者已選擇 injury.sportsmedicine.tw。Cloudflare Pages 自訂網域已註冊到 sports-injury-atlas，網域 ID e35880e7-8c5d-49d1-9fdc-3750770fe37a。狀態 pending，Cloudflare 回覆 CNAME record not set。現有 Wrangler OAuth 能管理 Pages，但 DNS API 回覆 403；沒有修改 DNS、主站或既有 Worker 路由。

需在 sportsmedicine.tw DNS 新增 CNAME：名稱 injury，目標 sports-injury-atlas.pages.dev，代理開啟、TTL 自動。使用者完成後須重查 DNS、Pages domain active、HTTPS，再發布準備好的 D35 canonical 版本。新網域尚未宣稱上線；正式仍為 D34／b91377ba。

新 origin 用獨立 public-domain.v1.json 記錄本次授權，不改寫原 D21 醫療發布 origin／病例核准；只重綁 inputTreeDigest。BaseLayout canonical／OG URL 與 artifact receipt 採新 origin。播放器及 API 都使用當前同源網址，無需放寬跨來源檢查；D1 保留原來 preview／production 分離。

預覽：https://313b9807.sports-injury-atlas.pages.dev/。84 檔 1,349 單元通過；Astro 0 errors／0 warnings、16 既有 hints；格式與隔離 release:public 通過（144 HTML、2,167 內部連結）。148 回應 hash 及 canonical origin、4 頁 × 2 尺寸 Axe／無溢位、首頁 101／11／15、熱門 GET 通過；王建民原生 iframe 實播通過。初版 Axe harness 使用 browser.newPage 不符套件要求，改為顯式 newContext 後通過，無網站程式修正。

剩餘：DNS CNAME、網域 active／HTTPS、root release:public、Production/main 發布、正式新網域唯讀內容／API驗證與不寫入統計的實播檢查。不要在 DNS 未通時發布指向無法連線的 canonical，也不要把預覽成功當成新域名上線。
