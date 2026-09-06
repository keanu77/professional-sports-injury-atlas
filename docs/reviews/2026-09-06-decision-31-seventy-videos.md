# Decision 31 — 70 支影片

使用者在 100 支可行性評估後回覆「好的，我們繼續補充」。依 52 → 70 → 85 → 100 的分批方向，本批新增 18 個事件，共 70 支影片（7 病例、63 動作觀察）。下一階段距 100 尚餘 30 支；本批不代表已完成 100 支。

新增棒球 5（Díaz、Hoskins、Hudson、Posey、Morales）、冰球 4（Stamkos、McDavid、Sergachev、Pacioretty）、網球 3（Mattek-Sands、Del Potro、Thiem）、足球 3（Elliott、Fofana、Bellerín），以及 Rodgers 美式足球、Van Vleuten 自行車、Andrade 體操各 1。分類增至 14 種運動與 7 個部位，新增美式足球及手腕入口，維持無搜尋、YouTube 預設封面與既有主站版型。

## 搜尋與來源

實際執行兩個不重疊維度的可連網 CLI：Codex 棒球／冰球研究，215 秒、exit 0；Grok 其他運動研究，593 秒、exit 0。僅傳公開資料提示，隔離於各自 scratch 目錄。另由獨立 Pass 2 逐筆閱讀官方／新聞原文，核對日期、側別、賽事層級與來源綁定。AGY、Qwen 本批未執行，不計入已完成模型。

Grok 漏掉 Elliott 2022-01-29 閉門友誼賽，只列較晚足總盃；已採更早實際出賽。Hoskins 用 MLB 逐場春訓資料確認 2024-03-01；Morales 採 2012-03-16 小聯盟熱身賽；McDavid 採 2019-09-24 季前賽，與翌日發布日期分開。Díaz 先前兩次是模擬賽，採 2024-03-11 對其他球隊春訓；Bellerín 採 U23，Thiem 採挑戰賽。Andrade 保留回場日期 null，只列已確認的 Baku 資格賽，未生成天數。17 組已知日期差均獨立重算，不作休養期限。

新增來源摘要置於 `event-batch-31.v1.json`，與 `batch-31.v1.json` 精確綁定。原病例、醫療核准、D18/D20 與先前影片批次未改；只更新公開建置的 inputTreeDigest，沒有重做或冒充醫療簽核。

## 影片與畫面

探測 35 個不同 YouTube ID（36 次探測含一個重複），在自有 HTTPS origin 的原生 iframe 點擊播放、確認時間前進，再逐段檢視事件。禁止內嵌的 Burrow、Prescott、Tua 等候選不採用；模型的 oEmbed 宣稱不能取代實播。Samir 紀錄片在落地前切黑，未採用；改補 Thiem 官方 Tennis TV 片段。

長影片設定事件附近起播點，例如 Hoskins 30 秒、Mattek-Sands 46 秒、Thiem 172 秒。Andrade 保留完整地板動作，沒有從影像推定某一次落地造成 ACL 傷害。Díaz 慶祝畫面有隊友遮擋，觀察文已說明。

18 支在預覽實際頁面首次全部實播成功。18 張預設封面均保存來源 URL、影片 ID 與檔案雜湊。沒有下載或重新上傳影片，沒有代理或規避禁止嵌入。字幕文字未逐字查核者維持 not-verified。

## 驗證

Astro check：0 errors、0 warnings，16 既有 hints。全單元初測 1,317/1,321 通過；三項要求乾淨 Git、另一項為縮圖舊計數。已補齊縮圖 fixture 的新批次，並驗證 fixture 原先有效；在乾淨隔離副本重跑四檔 33 項全部通過，原四個失敗皆解除。四瀏覽器導覽／播放器／民眾閱讀回歸 88/88 通過。變更程式與資料 Prettier、diff whitespace 通過。

第一次 artifact 檢查抓到 Van Vleuten 的「頭部」未映射分類；已統一為「頭頸部」，使頭傷處理與不得當天回場提示正確顯示，完整分類覆蓋重驗通過。建置與 release:public 通過：101 HTML、70 支影片、1,430 內部連結。未放寬來源、核准、乾淨 Git 或七天內實播閘門。

預覽：`https://b6f38717.sports-injury-atlas.pages.dev/`。完整瀏覽器於 2026-09-06T09:46:28.380Z 通過：105 個回應雜湊、92 頁 × 3 尺寸 = 276 組；分類、來源展開、縮圖、Axe、無水平溢位、零第三方預先連線與無 JS 皆通過。首頁桌面／手機與手腕分類、Thiem 影片手機版另檢視截圖。正式 18 支影片首次全部實播成功。正式驗證於 2026-09-06T09:53:52.477Z 完成：105 回應 hash 與 b3b4cb0 產物相符，92 頁 × 3 尺寸 = 276 組，以及來源展開、分類、縮圖、Axe、無水平溢位、零第三方預先連線與無 JS 全數通過。證據：`docs/reviews/evidence/decision-31/`。

獨立稽核的 scratch 檔名 `source-matrix.json` 對應保存的 `source-pass2.json`，`code-review.md` 對應 `code-pass2.md`；原始輸出保持原文。

正式部署：`https://sports-injury-atlas.pages.dev/`；Production/main `3ba37ddc-5954-47ed-b609-36c9fb8f1b50`，來源 `b3b4cb0ad681f177ea1fcb16a55715802d12cb9d` 已推送。收尾證據與交接文件另行提交，不改已驗證的網站產物。下一階段距 100 支尚餘 30 支。
