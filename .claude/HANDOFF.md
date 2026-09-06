# 最新交接 — Decision 34，2026-09-06

已完成 78 → 101 支影片（新增 23：棒球 15、其他 8）；棒球共 30。11 部位、15 運動、7 情境；新增手部、軀幹、骨盆、足部及花式滑冰分類，首頁數字由資料動態產生。王建民 2008 洋基跑壘傷片已加入 /videos/chien-ming-wang-2008-foot/。熱門卡片只列「近 30 天播放第一名、第二名……」，後端仍依真實次數排序。

正式 https://sports-injury-atlas.pages.dev/；來源 12c0cfd7cfdc276713304f004e33e27e694f0958 已 commit/push。Production/main 部署 b91377ba-4534-4442-98e0-c232a91cba86，root dist 即正式產物。最終預覽 c55f1068 的 23 支新片在實際路由 native playback 全部通過；正式只作唯讀檢查，無合成播放紀錄。王建民首次傷後春訓出賽 2009-03-02，和後來肩傷分開；Hanyu 同日續賽不等於康復，Liu 未再回場，兩者日期 null。所有來源／字幕／預設縮圖規則保留。

實際 Grok 連網成功；Codex gpt-5.5 連網 479 秒後 context exhausted、exit 1，沒有最終報告，不宣稱兩外部模型皆完成。另完成獨立 14 筆棒球原文／MLB/MiLB 首場查核及主代理其他運動／王建民／畫面核對，整合 reviewer PASS。詳細資料見 docs/reviews/2026-09-06-decision-34-one-hundred-videos.md 與 evidence/decision-34。

84 檔 1,349 單元、四瀏覽器 100 回歸、Astro 0 errors／0 warnings（16 既有 hints）、變更格式全部通過。初次封面 manifest 缺兩新條目，補齊後完整單元通過。隔離與 root release:public 通過：144 HTML、2,167 內部連結、383 產物；原醫療凍結／核准不變，只重綁輸入 digest。

完整預覽 148 回應 hash、417 組頁面尺寸與無 JS 通過。正式 2026-09-06T11:49:29.868Z 唯讀 148 回應 hash 全部相符，87 組新增頁面與三尺寸 Axe／無溢位／無預先第三方連線、無 JS 通過。首頁正常手機與王建民頁已看圖；排名 mock 確認只顯示第一／第二名、空榜不造數、錯誤／競態正確。

本輪 100 支目標與追加要求已上線。影片遠端可用性仍可能改變，新增或跨日查核需重新證據；不得重標舊 checkedAt。保留 D33 preview／production DB 分離與正式寫入測試被拒絕的邊界；未繞過。收尾文件另提交推送，不需重新部署。

---

# 最新交接 — Decision 33，2026-09-06

依使用者明確要求加入受傷情境、精選影片與本站近 30 天實際播放熱門。78 影片、7 部位、14 運動不變；7 情境（18/17/22/6/5/1/9）各影片一個主要分類，未明不推論。精選 6 支跨 5 運動。首頁只有一份 78 卡 DOM，全部／精選／熱門按鈕切換；無 JS 保留全片及靜態情境頁。

來源 cbee90004662d18822302b8d2205985422b59859 已 commit/push；正式 Production/main 部署 883cbce1-1037-4ea0-a206-33e8e9df09d4，https://sports-injury-atlas.pages.dev/。

熱門依 YouTube IFrame API PLAYING 首次事件計入；同頁暫停／續播與重送不重算。兩個 Pages Functions：POST /api/plays、GET /api/popular；精確 30 天、伺服器時間、固定公開影片 allowlist、body/UUID/Origin 驗證、參數 SQL。D1 只存隨機事件 ID、影片 ID、時間。DNT/GPC 不送統計；排行榜快取 60 秒。新 functions/migrations/wrangler 設定均納入輸入 digest。

Cloudflare Pages 現行設定已下載比對後加入 wrangler.jsonc；Preview/local D1 atlas-playback-preview（14ebcfe3-b040-4726-b7e6-84c6c8c03f3d），Production atlas-playback-production（d7fae228-d624-4746-bfad-a00bc9ed7800）。新建資料表及索引 migration 已各套用。正式資料庫發布前 count=0，所有預覽播放測試獨立。原 4321 參考與原醫療來源核准不動。

獨立 reviewer 複核程式、分類及精選。P2 大量請求已部分緩解：每 isolate/IP 每分鐘 POST 30／GET 60、最多 4096 keys，記憶體資料於下一分鐘請求或 isolate 回收清除；沒有全域限流及防灌榜保證。Pages 官方／CLI 不支援 rate-limit binding。此限制已留內部報告；不建立跨頁訪客識別或持久 IP。隱私說明更新，不再聲稱完全沒有本站播放統計。

84 檔 1,348 單元、四瀏覽器 100 回歸、Astro 0 errors/0 warnings（16 既有 hints）、格式通過。root dirty 首輪三個治理測試拒絕，隔離 committed tree 全數通過。隔離及 root release:public 通過：116 HTML、1,722 內部連結、332 產物，與預覽逐檔相同。

預覽 https://49b4fe97.sports-injury-atlas.pages.dev/ 實際播放後記一筆、ready 不記、pause/resume／同 UUID 重送不重算、未知影片／跨來源拒絕，首頁排行連動通過。初版測試 harness 卡在 Playwright keepalive response.body，改以 status 與獨立 DB 查詢驗證後通過；未改播放器規則。UI 的精選／排序／空值／錯誤／競態、無 JS 與三尺寸／light-dark Axe 通過。正常手機桌面截圖已看過。

報告 docs/reviews/2026-09-06-decision-33-discovery-and-popularity.md；證據 docs/reviews/evidence/decision-33/。Node24.14.0／Wrangler4.129.0。未增加新影片，距100仍22。下次增加影片需同步查核情境與來源，未指定情境保守歸其他；播放白名單由公開 JSON 推導且建置會比對。跨日來源查核需求同 D32：不可重標舊 checkedAt。

完整預覽 120 回應 hash、111 頁 × 3 尺寸 = 333 組與無 JS 通過。正式唯讀驗證於 2026-09-06T11:00:25.987Z 通過：120 回應 hash 全部相符；首頁、七情境頁與隱私頁共 9 頁 × 3 尺寸 = 27 組，Axe、無溢位、精選／全部切換、零第三方預先連線及無 JS 分類導覽通過。

正式寫入測試被自動核准審查拒絕（未明確授權正式測試資料，清除不含於同一動作）；沒有繞過。已以正式 GET、部署設定與唯讀瀏覽驗證替代。真正播放寫入／去重只宣稱 preview 已驗證，正式資料庫沒有測試紀錄。正式 GET 空榜與 preview GET 3 筆不同，下載設定亦證明 DB 分離。

本輪使用者要求已上線。收尾證據／文件另 commit/push，不需再部署；不存在等候使用者才能實作的功能。

---

# 最新交接 — Decision 32，2026-09-06

已完成本輪三項指示：棒球再增 8 支、頁尾與四份使用說明重寫、首頁加入清楚介紹與動態收錄數字。全站 78 支 = 7 病例 + 71 動作觀察；棒球 7 → 15，仍為 14 運動、7 部位。首頁數字以實際可見影片與非空分類共用陣列計算，隨內容重新建置部署同步，無 JS 也能閱讀；不是遠端播放可用性即時探測。

正式 https://sports-injury-atlas.pages.dev/。功能來源 dad88c5615f924f1931546b67c269742955c79f7；格式後輸入綁定來源 d32951fa6fc76e2568d528bfc69413856010c4ab 已 commit/push。Production/main 部署 92ecacbc-2cf3-4e36-bcf5-39e62112e6c2。八支新增在最終預覽及正式頁面皆首次實播通過；最終預覽 113 回應 hash、104 頁 × 3 尺寸、來源／分類／縮圖／政策／Axe／零第三方預先連線／無 JS 全部通過。正式完整驗證於 2026-09-06T10:35:16.191Z 完成：113 個回應 hash 與 d32951f 產物相符，104 頁 × 3 尺寸 = 312 組；首頁三個統計、分類、來源展開、縮圖、四份政策、歷史照片署名展開、Axe、無水平溢位、零第三方預先連線及無 JS 全數通過。

新增 Schwarber、Harper 2017、Fowler、Eaton、Bassitt、Cobb、Stanton 2014、Morton 2021。傷勢與回場採獨立公開來源；Eaton 最早小聯盟出賽日不明，returnDate:null，不計天數。Cobb 採 2013-07-23 只投兩球的復健賽；Schwarber 採 AFL；其他春訓與例行賽分開。Bassitt／Stanton 臉部骨折未推定為腦震盪。Jeter 三候選因禁嵌、事件錯誤或純文字卡排除。

實際執行連網 Codex、Grok 加獨立 Pass 2。Codex 的 gpt-6-astra 不相容失敗保留，gpt-5.5 重跑成功；AGY／Qwen 未執行。原醫療來源與核准不改，僅重綁 inputTreeDigest。八張 YouTube 預設封面保存來源與雜湊。Morton 從 24 秒開始，其餘開頭。

頁尾與 /source-policy/、/credits-notices/、/privacy/、/about/ 改為一般人可讀的現況說明，涵蓋跨運動來源、AI 輔助與原文核對、未知回場日期、內嵌權利、預設縮圖、點擊後第三方連線與更正入口。歷史逐檔照片署名及原醫療提醒完整保留；沒有將歷史醫師核准擴大為全站新增內容的醫療簽核。

Astro 0 errors / 0 warnings，16 既有 hints；82 檔 1,322 單元全部通過，四瀏覽器 100 回歸通過，變更程式／資料格式通過。乾淨隔離版及 root release:public 通過：109 HTML、78 影片、1,525 內部連結。最後格式調整造成第一次 root inputTreeDigest 阻擋，重綁後通過，未放寬門檻；root 324 個產物與最終預覽逐檔相同。首頁手機／桌面、320 字體 150%、頁尾及政策畫面已檢視。

報告 docs/reviews/2026-09-06-decision-32-baseball-and-policies.md；證據 docs/reviews/evidence/decision-32/。Node 24.14.0。保留兩個匿名影片移除 redirects；舊 4321 參考未改。

後續距 100 支尚餘 22，未宣稱 100 已完成。新增每批仍需去重、HTTPS 實際頁面實播、原始來源核對；舊 70 支保持同日既有查核證據。未來跨日新增需先導入逐筆 checkedAt，不能重標舊來源日期。收尾文件另 commit/push，不需再次部署。

使用者最新詢問其他分類，建議新增「受傷情境／動作」分類，將「精選／最新加入／未來熱門」作為排序。尚未指示實作；目前沒有本站觀看統計，不應把 YouTube 累計觀看數冒稱本站熱門。

---

# 最新交接 — Decision 31，2026-09-06

依「好的，我們繼續補充」完成 52 → 70 第一批，新增 18 支（棒球 5、冰球 4、網球 3、足球 3、美式足球／自行車／體操各 1）。總數 70 = 7 病例 + 63 動作觀察，14 運動、7 部位；新增美式足球及手腕分類。沿用 YouTube 預設封面、無搜尋、頁內分類及主站設計。

正式 https://sports-injury-atlas.pages.dev/；來源 b3b4cb0ad681f177ea1fcb16a55715802d12cb9d 已 commit/push；Production/main 部署 3ba37ddc-5954-47ed-b609-36c9fb8f1b50。root dist 為正式 101 HTML、1,430 內部連結產物。新增 18 支正式頁面首次全部實播成功。正式驗證於 2026-09-06T09:53:52.477Z 完成：105 回應 hash 與 b3b4cb0 產物相符，92 頁 × 3 尺寸 = 276 組，以及來源展開、分類、縮圖、Axe、無水平溢位、零第三方預先連線與無 JS 全數通過。

實際執行連網 Codex、Grok 與獨立來源／程式 Pass 2。18 個事件及 17 組已知日期差均核對；Andrade 回場日期保留 null，只描述已確認 Baku 資格賽，不推算天數。Elliott 採較早閉門友誼賽，Bellerín 採 U23、Thiem 採 Challenger；棒球春訓、冰球季前與正式聯賽分開。Samir 片段在落地前切黑、數支 NFL 候選禁止內嵌，皆未採用。禁止依影片推定某次落地造成 Andrade 的 ACL 傷害。

資料 src/data/videos/batch-31.v1.json、event-batch-31.v1.json；原病例、醫療核准與歷史影片資料保留，只重綁公開建置 inputTreeDigest。18 張預設封面來源與雜湊已保存。Van Vleuten 統一頭頸部分類，正確顯示頭傷處置。字幕維持 not-verified，以播放器為準。

Astro 0 errors / 0 warnings、16 既有 hints；全單元初測 1,317/1,321，修正 fixture 計數後乾淨副本重跑四檔 33 項通過，原四個失敗已解除。四瀏覽器 88 項回歸通過，變更格式通過。乾淨隔離副本及 root release:public 通過。預覽 18 支首次實播成功，105 回應 hash、92 頁 × 3 尺寸 = 276 組，以及無 JS 全數通過；首頁／手腕／Thiem 手機與桌面截圖人工檢視。

報告 docs/reviews/2026-09-06-decision-31-seventy-videos.md；證據 docs/reviews/evidence/decision-31/。Node 24.14.0；舊 4321 參考未更動。保留兩個已移除匿名影片的 404 redirects。

後續：距 100 支尚餘 30，下一批可依 70 → 85 → 100 擴充；本批不代表已完成 100。每批仍需影片去重、HTTPS 真實頁面實播與來源核對。現有各批同日 checkedAt，跨日新增前需導入逐筆 checkedAt，不能重標舊查核日期。release:public 保留乾淨 Git、既有核准鏈、inputTreeDigest 和新增影片七天內實播證據要求。收尾文件另提交，不需重部署。

---

# 最新交接 — Decision 30，2026-09-06

已依「50 支以上」目標新增 30 支，正式網站共 52 支（7 病例、45 動作觀察），有 13 運動分類與 6 部位分類。首頁已移除「更多傷害與案例」整區；保留部位分類、无搜尋、YouTube 預設封面及 sportsmedicine.tw 視覺。

正式 https://sports-injury-atlas.pages.dev/；來源 d3a003fd1f8baedd8b4f77b6ee64ab397133a27d 已 commit/push；Production/main 部署 21d81956-cfef-4d02-b7e9-6f0d3e79063b。root dist 為正式 81 HTML、1,156 內部連結產物。30 支新增在預覽及正式各首次全部實播成功；原22支保留本日先前實播證據。

實際執行連網 Codex、Grok，加獨立來源／畫面／程式 Pass 2。LaVine 已換成第三節真正受傷片段；Cousins/Gomes 已換掉只見講評的原候選。Tamberi、Cavendish、Smith 等首次出賽修正，季前賽、U23、女雙與後續聯賽分開標示。Livingston 首次回場尚未核清，returnDate:null，只列已確認的2008-10-29出賽；不推估天數。NBA引用仍維持既有政策，WNBA網址不誤判成NBA。

資料 src/data/videos/batch-30.v1.json、event-batch-30.v1.json；原病例／醫療核准／歷史影片清單未改。縮圖新增30份並保存雜湊。新增明顯變形等立即就醫／叫救護車與不得自行扳正的NHS處置說明；頭頸部維持不得當天回場。字幕未查核為not-verified，明示以播放器為準。

Astro 0 errors / 0 warnings、16既有hints；1,320單元通過（初測13個socket受sandbox限制，相關三檔51項重跑全通過）、四瀏覽器88項回歸通過；變更程式／資料格式通過，全庫47份既有報告／證據格式警告未重寫。乾淨隔離副本及root release:public均通過。預覽85回應雜湊、72頁×3尺寸=216組、來源／分類／縮圖／Axe／零第三方预連線／無JS通過。正式驗證於2026-09-06T09:12:54.442Z完成：85回應hash全部吻合d3a003f；72頁×3尺寸=216組、來源／分類／縮圖／Axe／無水平溢位／零第三方預連線／無JS全數通過。

保留兩個已移除匿名影片的_redirects，三種舊URL形式最終404。去重改為videoId，不同網址形式不能重複計數；每支影片恰好進入一個部位與一個運動分類。各批目前同日查核；之後跨日新增需先導入逐筆checkedAt，loader會拒絕混合查核日期，不能重標舊資料。

報告 docs/reviews/2026-09-06-decision-30-fifty-videos.md；證據 docs/reviews/evidence/decision-30/；Node24.14.0。舊4321參考未更動；本輪所有要求已完成，無待辦；收尾文件另提交推送，不需再次部署。

---

# 最新交接 — Decision 29，2026-09-06

已移除首頁標題下的「22 支影片 · 點選後播放」，連同不用的計數變數與樣式；依追加要求刪除全站頁尾「傷種圖鑑」及 ACL／踝扭傷／阿基里斯腱三個連結，頁尾改為兩欄。

正式 https://sports-injury-atlas.pages.dev/；來源 `376898ea0a416729791a43326ba1fd3f1d11b50a`；Production/main `e60573d3-dfcc-43ad-97ff-6219381f3879`。首頁提交 7e87e3f、頁尾提交 376898e 均已 push；root dist 為正式產物。22 支影片、分類與來源資料不變。

Astro check 0 errors / 0 warnings、16 既有 hints；格式檢查、7 個既有醫療聲明測試與乾淨副本／正式 release:public 通過（38 HTML、483 內部連結）。2026-09-06T07:56:05.285Z 正式 38 HTML 雜湊逐頁匹配且頁尾皆無傷種圖鑑；首頁與 Crosby 頁於 320/390/1440 六組瀏覽檢查通過，首頁 22 卡、兩欄導覽、醫療聲明與無水平溢位。390/1440 截圖已人工檢视。證據 docs/reviews/evidence/decision-29/browser.production.json。收尾文件另 commit/push，不需重部署，無待辦。

---

# 最新交接 — Decision 28，2026-09-06

已依使用者要求移除兩支匿名球友影片，新增五支可內嵌的具名選手影片：Acuña（棒球）、Vonn／Svindal（高山滑雪）、Dupont（橄欖球）、Crosby（冰球、確認腦震盪）。公開總數 22，六個部位分類；新增頭頸部 2 支。YouTube 預設封面、無搜尋及既有主站版型保留。

正式 https://sports-injury-atlas.pages.dev/；來源 `edfa1809c7d204b54e31aa17fa7fc3f4e601f97a`；Production/main `c11df3ba-6213-48a0-a6a7-297b2d1c7cdd`。來源已 commit/push，root dist 為正式 38 HTML 頁、7 病例、15 觀察頁與 597 內部連結。收尾證據與文件另行提交，不需再次部署。

curation.v1.json 保存五支新增與兩個移除 slug；event-additions.v1.json 保存獨立公開來源摘要。原始病例、D18/D20/D21 醫療核准及舊影片 JSON 保留。頭頸處置引用 CDC/NHS，疑似腦震盪立即停止、不得當天回場。Crosby 五天後出賽僅是 2017 個案紀錄；Dupont 是臉部骨折，未推定腦震盪。Acuña 區分 3A 復健賽與 MLB 回歸，Vonn 保留途中再傷，Svindal 計算 314 天。

實際連網 Codex、Grok 加獨立 Pass 2 核對最終五筆。AGY 自身 read_url 權限拒絕而無輸出，未改權限；Qwen 未跑。Rodgers/Tua 的 NFL 禁止嵌入候選排除。五支採用影片已檢視事故畫面，預覽與正式各五支實播全部成功。原 17 支留用本日 D27 正式實播證據。

驗證：Astro check 0 errors/0 warnings、16 既有 hints；81 檔 1,315 單元通過；四瀏覽器 68 回歸通過；乾淨副本與正式 release:public 通過。預覽 42 回應 hash、29 頁 × 3 尺寸 = 87 組、來源展開／Axe／縮圖／分類／無溢位／零預先第三方請求／無 JS 通過。最終正式驗證結果下附。

注意 Cloudflare 移除檔案仍可能提供舊快取：第一輪正式兩個刪除 URL 回 200，但查詢參數與部署專用網址為 404。已在 check-artifact.ts 生成 `_redirects`，兩個舊 slug 的三種 URL 形式轉至不存在的 `/removed-video/`，最終 404；沒有改播放器或放寬檢查。第一次失敗證據保留。後續新增應保留此移除規則。

報告 `docs/reviews/2026-09-06-decision-28-curation-and-concussion.md`，證據 `docs/reviews/evidence/decision-28/`。Node 24.14.0；公開發布仍要求乾淨 Git、inputTreeDigest、既有核准鏈與新影片七天內實播證據。舊 4321 參考未更動。本批已授權實作無剩餘項目。

正式驗證 2026-09-06T07:32:27.203Z：42 個回應 hash 與 edfa180 產物一致，29 頁 × 3 尺寸共 87 組；來源展開、分類、縮圖、Axe、無水平溢位、零預先第三方請求及無 JS 全數通過。兩支移除影片的六種舊網址形式均最終回 404。

---

# Current handoff — Decision 27，2026-09-06

已完成影片擴充與使用者指定 multi-llm-audit 的傷勢／恢復比賽查核並上線。新增大谷翔平、Bolt、Salah、Giannis、Fultz 共 5 支，公開總數 19（7 原病例＋12 觀察影片）；首頁部位為肩部 2、腳踝 8、小腿與阿基里斯腱 4、膝蓋 3、大腿後側 2。維持 YouTube 預設封面、無搜尋、主站設計。Nadal 已研究，但候選未確認包含受傷當下，因此未發布。

正式 https://sports-injury-atlas.pages.dev/；網站來源 `c97192b15596ab75820d1968ac33298cced9ba5b`；Production/main `f15a755c-3a55-4224-994a-a43166862486`。root dist 為正式 34 頁產物。

實際執行 Codex、Grok、Antigravity 三 CLI（全部 exit 0），只傳公開頁面文字；Qwen 因白天 GPU 窗口未跑。獨立 Pass 2 驗 20 個候選事件，最終 19 筆來源摘要再複查。排除錯誤數字／網址與未支持醫療推論；Simons 首返 3/1、Durant 區分季前／正式、LaMelo 2023 後續 MRI 更新、Irving 非傷病缺賽因素、大谷指定打擊回歸與季後肩部手術、Foucher 後續正式成績皆已呈現。未知日期與匿名排球不推估。

`src/data/videos/additions.v1.json` 保存 D27 影片授權；`event-updates.v1.json` 是獨立公開報導摘要，19 筆 slug／影片 URL／事件日均綁定。公開頁顯示簡短傷勢與復賽脈絡、可展開來源。原病例、D18/D20 核准、衛教文字未改，沒有冒充醫療簽核。NBA 引用維持純文字 URL 政策。

Astro check 0 errors / 0 warnings、16 既有 hints；乾淨隔離副本 1,314 單元與四瀏覽器 68 項回歸通過。2026-09-06T03:54:15.020Z 正式 38 回應 hash、25 頁 × 3 尺寸 = 75 組、來源展開／Axe／縮圖／分类／無水平溢位／零預先第三方請求／無 JS 全過。19 支正式實播全部成功，原 5 支字幕亦通過，沒有重試。

報告 `docs/reviews/2026-09-06-decision-27-video-expansion-and-event-audit.md`；三模型原始輸出、接受／排除矩陣、影片與正式瀏覽證據在 `docs/reviews/evidence/decision-27/`。原始模型輸出含誤報，僅採 Pass 2 已核實結論。GitHub 為 keanu77 私有 ADMIN，來源提交已 push；收尾文件與證據另 commit/push 後，以 HEAD 與 origin/main 一致確認完成。文件 commit 不需再部署。

後續新增影片沿用 HTTPS 真實路徑實播與來源核對，release:public 仍要求乾淨已提交版本、inputTreeDigest、既有核准鏈及新增影片 7 天內證據。使用 Node 24.14.0。預覽分支 decision-27-preview 保留，舊 4321 參考未更動。沒有本輪未完成的已授權實作。

---

# Historical handoff — Decision 26，2026-09-06

首頁部位分類與使用者授權的稽核修正已實作並部署。首頁提供腳踝 8 支、小腿與阿基里斯腱 4 支、膝蓋 1 支、大腿後側 1 支，連到四個 `/body-parts/` 頁面；14 支影片各歸屬一處、無 JS 也能選取。維持 YouTube 預設封面、無搜尋、主站淡藍／珊瑚色設計。

正式 https://sports-injury-atlas.pages.dev/；來源 `ba2530166c281f89ab622009373bf765adb12712`；Production/main `be2b7389-679f-47d8-85eb-3d5844e5c8cb`。公開 build 已由 24 增至 28 頁；receipt 包含 bodyParts 與各分類精確影片路徑，release gate 驗證 14 支完整覆蓋一次。root dist 為正式產物。

三項 P1（late onError、手機播放字裁切、播放焦點框）及閱讀／播放 P2 已修正。案例直接顯示既有 whatIsVisible；4 個舊列表頁移除篩選、ACL 衛教提前、enum 中文顯示、未收錄回場資料用語、主站返回及歷史照片授權說明一併完成。沒有修改原始病例、醫療核准、影片綁定或時間碼。

Astro check 0 errors / 0 warnings，16 既有 hints；四瀏覽器 68 項回歸通過。預覽 32 回應 hash 與 19 頁 × 3 尺寸 = 57 組頁面檢查通過（320px 字級 150%、390、1440，Axe、縮圖、分類、零預先第三方請求）；額外 28 頁大字深色及元件裁字／焦點、重試、時間碼、無 JS 回歸通過。正式 14 支實播成功；LaMelo 2025 字幕首測逾時、單支重試成功，首次紀錄保留。2026-09-06T03:24:44.432Z 正式瀏覽器驗證 32 回應 hash、57 組頁面及無 JS 全部通過。

報告 `docs/reviews/2026-09-06-decision-26-body-parts-and-audit-fixes.md`，證據 `docs/reviews/evidence/decision-26/`。前次 audit 報告已在 `ad54447` 提交，D26 實作在 `ba25301`；遠端已核對為 keanu77 私有 ADMIN；收尾文件與證據提交後一併 push，完成後以 git HEAD 與 origin/main 相等為準。

待醫療複核：LaMelo 2023 後續來源新稿已整理於 `docs/reviews/2026-09-06-lamelo-source-update-draft.md`，不可直接重算既有核准冒充簽核。低優先 Noto 歷史字型清理本輪未做；不是首頁／播放功能阻礙。下方歷史紀錄中的「尚未提交／D25 正式」僅代表當時狀態。

---

# 前次紀錄 — 2026-09-06 multi-llm-audit

使用者要求以multi-llm-audit重新檢視全網站。本輪稽核已完成：Codex8項、Grok13項、Antigravity公開內容7項，共28條原始論點，經獨立Pass 2與正式瀏覽器逐條採用／降級／排除。未修改網站程式、未重新部署。

報告：`docs/reviews/2026-09-06-multi-llm-audit.md`；證據與Pass2矩陣：`docs/reviews/evidence/multi-llm-audit-2026-09-06/`。3項P1：ready後播放器錯誤未備援、320px最大字級播放文字裁11.625px、案例播放焦點外框裁切。P2包括5個外部起點遺失、無JS／读屏狀態、既有general.whatIsVisible未顯示、4頁舊篩選、審查語氣、回場缺資料表述、主站返回、21照片歷史名錄語氣與LaMelo2023初報／後續診斷脈絡。

14支影片今日均實播；Kyrie字幕首測逾時、單支重試開啟成功。24頁320px深色字級1.5，加6個手機桌面關鍵頁組合，共30組Axe無錯誤及整頁無水平溢位；人工另找到元件裁字與焦點問題，不能把Axe當全面無障礙通過。

Antigravity私有code傳送被auto-review拒絕，改成公開HTML文字注入完成，未變更任何CLI權限。Qwen可用但因skill的白天GPU窗口未跑。模型「Tatum/Haliburton是假資料」「ACL頁全空」「把未知膝部觀察歸ACL」等已排除。

下一步僅為報告中的待確認實作建議；先做3項P1及播放相關P2。既有主站配色、YouTube預設封面、首頁無搜尋及頁內分類不變。本次audit報告與證據尚未commit/push，先前網站修改已在main與origin/main同步至3b97e16。正式部署仍是下方D25。

---

# Decision 25 — 歷史正式部署

已完成並發布使用者要求：14支影片的卡片、主播放器、相關影片卡片改用各自YouTube預設封面；右上角傷害分類移除，首頁下方分類入口保留。人物照片與署名段落不再出現在公開影片卡片。搜尋移除與D24內容頁版型保留。

正式 https://sports-injury-atlas.pages.dev/；來源 `3e8cc75ed026d6a026ed2c07865adc3b0c4ac0be`；Production/main `07b8ac9a-0fd4-4fe7-aceb-f907b0cc635c`。2026-09-06T02:55:54.277Z正式驗證28回應hash、15頁手機/桌面Axe、縮圖解碼、導覽、無JS與零預先第三方請求通過。單元37項、相關四瀏覽器12項通過；Astro check無錯誤/警告。root dist為正式版本。

D25使用者明確指定YouTube圖片，取代先前不採縮圖的顯示限制。`src/assets/videos/provenance.json` 保存14個預設封面來源、ID與SHA256；`scripts/verify-video-thumbnails.ts` 檢查精確範圍。縮圖由本站提供；播放前仍無第三方請求。原病例、醫療核准、影片URL/時間碼及歷史審查照片不變。歷史review模式保留照片，公開模式才用D25封面。

詳見 `docs/reviews/2026-09-06-decision-25-video-covers.md`。無待辦，未修改主站專案。交接文件commit不需另行部署。發布協定仍見下方D23；公開瀏覽驗證涵蓋縮圖與分類。Node網路首次連線若逾時，可用 `node --network-family-autoselection-attempt-timeout=2000 scripts/public-launch/verify-browser.mjs https://sports-injury-atlas.pages.dev` 重試。

---

# Decision 24 — 內容頁設計

已完成使用者要求：依主站 /content/ 的淡藍標題區、麵包屑與卡片列表調整首頁；移除搜尋、傷害/運動篩選、先看影片標題說明及對應JS/CSS。14支影片直接顯示，影片/醫療/核准/播放器未改。主站內容頁未修改，使用者自行安排入口。

正式 https://sports-injury-atlas.pages.dev/；來源 `33cd45934b989eca7cf6f95ebfd72c6de039d8f0`；Production/main `30504fef-e3c2-4c79-bebf-8e49a9be21f8`。2026-09-06T02:45:43.594Z驗證28回應hash、15頁手機桌面Axe、無JS與零預先第三方請求通過。相關四瀏覽器12項通過；type check無錯誤/警告。root dist是正式版本。

首頁已沒有搜尋，後續驗證不要再執行D23的臨時搜尋腳本；現有 `scripts/public-launch/verify-browser.mjs` 已改檢查14卡片直接顯示、無searchbox/combobox、無先看影片h2。發布協定與影片實播工具仍見下方D23。無更多已授權待辦。

詳見 `docs/reviews/2026-09-06-decision-24-content-layout.md`。交接文件commit不需另行部署。

---

# Decision 23 — 既有影片與發布協定參考

使用者確認九支候選、字幕非必要及事件核對後加入，回覆「可以」。本次已完成並發布，沒有待確認項目。

## 正式狀態

- https://sports-injury-atlas.pages.dev/
- 公開影片由5增至14：7既有核准案例（新增Tatum、Haliburton）＋7動作觀察影片，涵蓋籃球、網球、田徑、體操、羽球、CrossFit、排球。
- 來源commit `9fa63393469ec67db9fbccdb772da0a3574e10ce`；Pages Production/main `7c0c00fc-32bb-4483-b25f-919027742b2a`。
- 正式驗證2026-09-06T02:12:15.884Z：28個HTML/JSON/robots回應雜湊匹配；15個首頁/案例/觀察頁手機桌面Axe與播放前零第三方請求通過；新增9支全部實播通過，包含時間碼。
- 單元1305、四瀏覽器256通過；Astro check 0 errors/0 warnings、16既有hints。320/390/1440篩選、搜尋、無JS內容驗證通過。無新依賴、無新環境變數。

## 實作與核准邊界

- `src/data/videos/expansion.v1.json` 與 `src/lib/videos/expansion.ts`：獨立D23授權，兩個原病例canonical digest＋七個observation clips。沒有新醫療簽核，不改原始26病例、D18/D20追蹤或既有三份衛教核准。
- 字幕例外只適用此次核准URL與 `ATLAS_PUBLIC_LAUNCH=decision-21` 公開協定；未解除provider/embed/region/clinical驗證。
- 新頁 `/videos/[slug]/` 明示動作觀察，不根據標題判定骨折/韌帶/分級。Zverev/Marín有來源支持個人正式復賽日期，其餘不虛構回場天數。
- 影片起点：Zverev1340、Redmond15、Strug0、Marín35、Foucher35、POV215、腳踝片0秒。無影片截圖或遠端縮圖進公開網站。

## 發布與重驗

- Node `/Users/ethanstudio/.local/share/mise/installs/node/24.14.0/bin`。
- `npm run release:public` 必須clean Git、inputTreeDigest、原病例/醫療/provenance/D20與D23證據通過，才建24頁/7案例/7觀察。
- `npm run deploy:public` 重跑release後更新既有Pages專案。未建立Git remote或push。
- D23證據為 `docs/reviews/evidence/decision-23/playback.preview.v1.json`，須7天內在本專案HTTPS網域實播。兩支Olympics在localhost不能播、HTTPS能播，不能以本機失敗推斷正式失效。
- `node scripts/public-launch/verify-expansion-playback.mjs <origin> <output> [slug]` 可驗9支或單支；正式版9支全部通過。POV預覽首輪緩衝逾時，獨立重測通過，保留first-attempt紀錄。
- `node scripts/public-launch/verify-browser.mjs <origin>` 比對root receipt與正式bytes/無障礙。root dist為正式產物。
- 完整說明 `docs/reviews/2026-09-06-decision-23-video-expansion.md`。

## 下一步

無更多已授權待辦。若使用者再要求擴充，沿用實播、事件核對、診斷與回場來源分明的標準；需要新增醫療主張時另外核對，不能借用D21衛教簽核。

Docs-only後續commit不改網站輸入，不需只為commit ID而重新發布。舊D21/D22交接保留於Git歷史e4d145d。暫存隔離副本 `/tmp/atlas23-checkout`，14324為本機預覽；舊4321參考未更動。
