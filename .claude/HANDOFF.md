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
