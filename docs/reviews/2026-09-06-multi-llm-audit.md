# 2026-09-06 網站多模型稽核

目前未確認 P0 上線阻斷問題；有 **3 項 P1 播放／無障礙缺陷**，以及應逐步整理的閱讀體驗問題。14支影片今日皆實播成功。保持目前主站配色、YouTube預設封面、不設首頁搜尋、分類留在頁內的決定。

本輪是稽核與修正計畫，沒有修改網站程式或重新部署。

## 三路結果與核對方式

| 工具 | 實際範圍 | 結果 |
|---|---|---|
| Codex CLI / gpt-6-astra | 隔離副本的效能、無障礙與播放器程式 | 8項；148.6秒；exit 0 |
| Grok CLI | 隔離副本的產品閱讀流程、分類、品牌與卡片 | 13項；351.9秒；exit 0；具體模型ID未另驗證 |
| Antigravity CLI | 24個已公開HTML的文字；直接注入37,302字元，不使用讀檔工具 | 7項；47.3秒；exit 0；具體模型ID未另驗證 |
| 主agent＋獨立Pass 2 agent | 正式瀏覽器、完整函式與公開build呼叫鏈、數量重算、官方來源反證 | 每項分為採用、降級、選項或排除 |

Grok與Antigravity一致指出次頁舊篩選、審查語氣、案例／觀察計數範圍及過時照片說明；Codex指出的播放器錯誤與焦點問題已用瀏覽器復現。未將各模型的原始P0/P1直接當成結論。

Antigravity私有原始碼稽核被自動審核拒絕，理由為外部目的地授權未具體確認；改採已發布HTML。其讀檔命令另被headless權限拒絕，最後直接提供公開文字完成，未改權限設定。Qwen已確認可用，但本輪在skill記載的09:00–15:30 GPU批次時段，因此使用三路API工具，沒有執行Qwen。原始碼可信度／維護面由主agent與Pass 2補查。

來源HEAD `3b97e16e9dad0480937b5c7e135da3bc97c9570d`，正式渲染來源 `3e8cc75ed026d6a026ed2c07865adc3b0c4ac0be`；網站 https://sports-injury-atlas.pages.dev/ 。模型副本排除Git、憑證、node_modules及部署產物；公開HTML另置目錄。原始模型報告保留於[evidence](./evidence/multi-llm-audit-2026-09-06/)，**未核准的原始論點應以本報告與Pass 2判定為準**。

## 已實測

- **14/14影片實際播放成功**，有currentTime前進、paused=false、readyState=4的紀錄；9支擴充片段的時間碼正確。Kyrie首次字幕按鈕偵測逾時，但播放成功；單支重測後字幕開啟成功，保留首輪與重試。字幕非必要的既有決策不變。
- **24頁 × 320px／深色／字級1.5**，另首頁、案例、觀察頁各於390px與1440px測試，共30個頁面／視窗組合。Axe指定WCAG2A/AA及2.1AA標籤均無違規，沒有整頁水平溢位；**這不能排除元件內裁字或焦點框消失**，以下P1-02/03即為反例。
- 公開4個列表頁各有10個input/select；7個案例頁的深入內容都有`unclear`與4種英文來源enum。首頁14＝7案例＋7觀察，數量正確；7案例只有6名球員（LaMelo有兩個事件），傷種為腳踝4、阿基里斯腱3、ACL0。
- 未發現Noto Serif TC四個檔案的瀏覽器請求；它們雖隨public部署，並非首屏下載。390px首頁單次未節流量測：子資源傳輸187,936 bytes，不含HTML；LCP約1.30秒。這是實驗室單次樣本，不是行動網路／真實使用者Core Web Vitals保證。
- Chrome實際字型：本網站及主站`/content/`的中文h1均為PingFang TC；影片卡片英文使用Fraunces。沒有支持全面更換字型或框架的證據。

## P1：先修播放與無障礙

| ID | 問題及證據 | 最小處理 | 位置／功能檔數 | 信心 |
|---|---|---|---|---|
| P1-01 | 播放器ready後onError只reject已完成Promise；實際注入錯誤150後仍為`ready`，failure/facade仍hidden，iframe仍存在 | 持續監聽播放錯誤，與初始化Promise分離；恢復封面、可重試按鈕及原始連結提示 | `src/scripts/video-player.ts:30`、`src/lib/video/youtube-api-adapter.ts:111`；1–2檔 | 1.00 |
| P1-02 | 320px、字級1.5的觀察頁：按鈕158px高，文字首行top663.30，容器top674.92；**上緣裁掉11.625px** | 窄螢幕／大字級把操作放入正常排版，勿受16:9封面高度裁切 | `src/pages/videos/[slug].astro:142`、`src/components/cases/VideoThumbnail.astro:30`；1–2檔 | 1.00 |
| P1-03 | 案例播放按鈕與裁切容器同324×182.25px；4px outline向外偏移3px，父層overflow:hidden，鍵盤焦點框被裁 | 改內縮焦點框或在內部播放標籤顯示focus樣式；保留清楚對比 | `src/components/cases/CaseVideo.astro:376`；1檔 | 0.99 |

P1-01不代表影片現在不能播放，下方原始連結也一直存在。P1-03只確認案例詳頁播放按鈕，不能擴大為全部卡片；CaseCard已使用內縮焦點框。可對照[W3C文字重排](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)及[焦點可見性](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)。

[大字級裁切截圖](./evidence/multi-llm-audit-2026-09-06/clip-320-max-font.png)；[瀏覽器復現數據](./evidence/multi-llm-audit-2026-09-06/reproductions.json)。

## P2：改善一般民眾閱讀與維護

| ID | 已核對問題／影響 | 建議及範圍 | 信心 |
|---|---|---|---|
| P2-01 | 5/7觀察影片有非零起點，但外部觀看連結沒有時間；Zverev會回到開頭，須再找22:20 | 只替觀看入口加`t`參數，來源canonical不改。`src/pages/videos/[slug].astro:50`；1–2檔 | 1.00 |
| P2-02 | 載入／錯誤只有dataset與hidden，沒有live status；無JS時仍顯示無反應的播放按鈕 | 加簡短讀屏狀態及錯誤關聯；預設外部觀看入口，JS初始化後啟用站內按鈕。`src/scripts/video-player.ts:68`、兩種播放器模板；3檔 | 0.99 |
| P2-03 | 7個案例已存`general.whatIsVisible`，公開頁卻完全沒有呈現；因此也未呈現Kyrie既有的Game3片名／Game4事件註記 | 影片下顯示已核對的1–2句白話觀察，不展開整段專業筆記、不新增診斷判讀。`src/pages/cases/[slug].astro:148`、`src/content/cases/kyrie-irving-ankle-sprain-2021.json:96`；1–2檔 | 1.00 |
| P2-04 | 三傷種頁＋NBA列表仍各有10欄舊篩選；ACL無案例，先顯示篩選／空列表，衛教在後面 | 公開次頁同步取消搜尋表單；零案例傷種優先顯示已有衛教。保留review工具。`src/pages/injuries/[injury].astro:103`、`src/pages/leagues/[league].astro:58`；2–4檔 | 1.00 |
| P2-05 | 深入內容英文enum及列表英文reviewed cases增加理解負擔；14影片與7案例範圍不直觀 | enum只改顯示label，資料值不動；用「案例／動作觀察」短標籤，計數標明範圍。觀察卡已有「受傷動作觀察」，不是完全沒區分。`src/pages/cases/[slug].astro:174`、`src/components/citations/ExternalSourceCitation.astro:43`、`src/components/atlas/InjuryCard.astro:41`、首頁／列表；約6–7檔 | 0.99 |
| P2-06 | 回場缺資料文案容易被讀成選手沒有復出；實際是本站未有符合驗證條件的日期 | 改「本站尚未收錄可核對的傷後出賽日期」，保留不推估、不等於首次復出的限制。`src/components/cases/ActualReturn.astro:55`；1檔 | 0.99 |
| P2-07 | 主站分享資訊連結只在首頁，深連結讀者需先繞回首頁；站名仍混用「職業運動傷害」 | 頁尾加返回主站內容頁連結，統一公開站名。不修改主站、不恢復頂部分類。`src/components/layout/SiteFooter.astro:36`、各頁title；約5–8檔 | 1.00 |
| P2-08 | 授權頁仍稱21筆「目前使用的照片」且說封面旁有署名連結；公開頁已無data-player-photo | 縮圖來源說明置前，歷史人物照片名錄明確標為歷史參考或只在review呈現；保存原registry，不把Commons授權套給YouTube縮圖。`src/pages/credits-notices.astro:15,50`、`src/pages/source-policy.astro:50`；2–3檔 | 1.00 |
| P2-09 | LaMelo 2023頁引用早期strain，標題分類為sprain；並非可直接認定分類錯誤，但欠缺後續正式更新的銜接 | 先整理球隊後續診斷證據供醫療複核，再依既有簽核流程更新，不能用模型意見直接改病例。`src/content/cases/lamelo-ball-ankle-sprain-2023.json:36`及相關來源／review；2–5檔 | 0.95 |

P2-09已查到[NBA最初報導](https://www.nba.com/news/hornets-lamelo-ball-out-right-ankle-strain)使用strain；[Hornets後續公告](https://www.nba.com/hornets/news/charlotte-hornets-injury-update-6)改述sprain。應補更新脈絡，不能依早期單字直接將案例改為肌腱拉傷。

## 不列為急迫缺陷的選項

- 更高解析度縮圖／響應式候選：目前480×360，詳頁會放大，但未量出明顯失真或必要流量收益。要改善仍使用同支影片預設封面，不回到人物肖像。`VideoThumbnail.astro:18`。
- 移除未用的四個Noto字型：合計424,704 bytes是部署資產，不是首屏流量；低優先清理。`src/styles/global.css:8`、`public/fonts/`。
- 行動選單只有首頁，與站名連結重複：可以精簡，但目前互動可用。`SiteHeader.astro:24`。
- NBA列表没有其他HTML的a[href]入鏈：可保留供直接連結，不必先刪路由；其表單問題已併P2-04。
- 卡片密度、統一「脚踝／踝關節」、免責段落位置、首頁案例／觀察分段，是編輯選項。保持短內容，不為分類增加大段說明。
- sitemap／社群meta可在主站入口確定後補；canonical已存在，robots公開允許。缺少隱私頁description屬低優先，404不需要SEO補強。沒有量測證據支持全面SEO／架構重寫。
- 觀察影片需更多一般回場導引可另做內容專案；不能只依「膝部」判成ACL，也不能把共用停止運動／保護部位文字直接判為醫療錯誤。

## 誤報與降級

- **排除AGY-3「Tatum／Haliburton是假資料」**：[NBA Tatum回歸報導](https://www.nba.com/news/jayson-tatum-expected-debut-vs-mavs)與[Pacers醫療公告](https://www.nba.com/pacers/news/indiana-pacers-medical-update-tyrese-haliburton-250623)可反證；本機也有正式來源與D20簽核投影。
- **排除AGY-4數字矛盾／ACL全空白**：7＋7＝14；ACL有PatientGuide。保留範圍標示與內容順序改善。
- **排除AGY-7未標運動與應補「休閒球友」**：兩頁已寫排球；不能猜身分、等級或上傳年份。
- **排除Grok-P1-01首頁顯示BROKE／Inversion來源片名**：它們是來源標題，不是首頁卡片標題；卡片已寫「受傷動作觀察」。
- **降級AGY篩選／enum的P0與Grok多項P1**：是P2產品用語與動線，沒有安全洩漏或全站故障。
- **拒絕照片名錄「只留7位」修法**：只有6名不同球員，且公開影片封面全已換YouTube；保留歷史追溯比錯删registry重要。
- **不以Axe零錯誤或整頁無溢位否定裁字／焦點問題**；人工與bounds實測已確認。

逐條28項的採用／合併判定見[Pass 2矩陣](./evidence/multi-llm-audit-2026-09-06/pass2.md)。

## 建議實作順序與驗收

1. **播放可靠性及無障礙**：P1-01～03＋P2-01～02，5項；預估4–5個功能檔、2個測試檔及1份發布manifest，共約7–8檔。驗收ready後onError能復原、鍵盤焦點可見、320px與最大字級不裁字、5個外部時間碼正確、無JS有可用入口；再確認14支影片。
2. **一般民眾閱讀體驗**：P2-03～08，6項；預估約10個功能檔，採小範圍顯示調整，原病例／核准值不動。驗收全部24公開頁沒有舊搜尋表單、白話觀察可見、計數及回場語氣準確、每頁有主站入口、授權說明符合實際封面。
3. **來源內容複核**：P2-09，1項；先形成可核對證據與更新稿，再走病例核准，不與版面修正混做。

每階段保留當前公開產物基線，完成type check、針對行為的測試、clean-Git `release:public`，再依既有發布流程檢查線上版本。此報告沒有執行以上修改。
