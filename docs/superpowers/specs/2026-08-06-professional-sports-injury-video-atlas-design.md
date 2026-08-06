# 職業運動傷害影片圖鑑：產品與系統設計規格

- 日期：2026-08-06
- 工作名稱：職業運動傷害影片圖鑑
- 英文工作名稱：Pro Sports Injury Atlas
- 規格狀態：產品方向已核准；2026-08-06 紅隊釐清版尚未確認，因此任何 G0 實作仍封閉
- 首發策略：多運動底座，NBA 內容先行
- 本文件範圍：產品、內容、資料、審查、驗證與發布設計；不授權實作或部署

### 核准後紅隊釐清（尚未確認，未授權實作）

以下不改變已核准的產品方向，但會成為實作前的強制治理契約：

- repository/platform、案例來源研究、醫療內容撰寫、私人 hosting 與公開發布分別授權；任一關不推定下一關。
- 經典案例由具名內容負責人提出；醫療審查前允許核准欄為 `null`，但不能以此進入 `approved`。
- 三個傷種除了案例外，各有一份經證據連結、具名醫療審查的傷種教學總覽，但不複製完整 RTP 處方。
- 首版主影片必須是該球員、該比賽、該受傷事件的 in-game footage；訪談、新聞回顧、訓練、熱身、復健與 compilation 不得作主影片。
- 醫療審查綁定實際私人環境所提供的 canonical review-set digest；不只靠口頭或單份檔案狀態。
- 季度記錄以不可變的公開版本快照驗證，不用本季最新內容 digest 回寫或否定舊季歷史。
- 來源研究、醫療核准、影片權利、課程連結、網站公開／索引與實際部署各以對應的 durable decision/digest 驗證；inline 狀態或前一關核准不單獨成立。

## 1. 產品目的

建立一個獨立的職業運動傷害影片網站。讀者先依傷種進入，觀看公開原始比賽影片，再閱讀一般摘要或展開專業分析；需要深入學習時，連到既有的專業復健與回場（RTP）課程。

網站不是新聞即時追蹤器，也不依比賽畫面直接診斷。它是一個人工策展、可追溯來源、經醫療審查的案例圖鑑。

## 2. 已核准的產品方向

### 2.1 讀者

採雙層閱讀：

- 一般讀者先看到事件背景、可觀察機轉、已確認資訊及影片的判讀限制。
- 醫療與運動專業人員可展開機轉分析、鑑別脈絡、治療與回場意義、證據來源及 RTP 課程。

### 2.2 首版內容

首版只收 NBA 案例，包含三個傷種：

1. 前十字韌帶損傷（ACL injury）
2. 腳踝扭傷（ankle sprain）
3. 阿基里斯腱斷裂（Achilles tendon rupture）

每個傷種首版至少 10 個通過全部檢查的案例，總數至少 30 個。合格案例不設上限；若不足 10 個，不得以降低來源、診斷、影片權利或醫療審查標準補足數量。

案例以近十年為主，並收錄具明確教學價值的較早經典案例。經典案例必須保存收錄理由並顯示「經典案例」標籤。

### 2.3 後續擴充

資料模型從第一天支援多運動與多聯盟。未來可加入 MLB、足球及其他職業運動，但不在首版內容範圍內。導航只顯示已有合格內容的運動或聯盟，不建立空白的「即將推出」頁面。

### 2.4 更新節奏

每三個月執行一次人工策展，加入當季所有符合標準的新案例。自動搜尋可以在未來協助產生候選，但不得自動診斷、自動撰寫後直接發布，或繞過人工來源與醫療審查。

## 3. 品牌與視覺方向

網站獨立呈現，但沿用 `sportsmedicine.tw` 的個人品牌語言：

- 品牌主色：`#2288BB`
- 深色層級：`#002B3C`
- 頁面表面：`#F9FCFC`
- 資訊底色：`#EDF7FC`
- 品牌暖橘：`oklch(70% 0.15 45)`；mockup fallback 為 `#E77846`，用於播放、關鍵時間碼與重要提醒
- 字體與無障礙模式：沿用個人網站的繁體中文可讀性、字級調整與深色模式原則

網站不得使用 NBA、MLB、聯盟或球隊標誌作為自身品牌，也不得造成官方合作、授權或背書的印象。

討論用 mockup 保存在 `.superpowers/brainstorm/`。正式實作須重建可維護的元件與設計 token，不直接把 mockup HTML 當成產品程式碼。

## 4. 資訊架構

### 4.1 主要入口

首頁採「傷種圖鑑」：

- 三張首發傷種卡：ACL、腳踝扭傷、阿基里斯腱斷裂
- 最近一次季度更新
- 搜尋入口
- 醫療審查與來源政策簡述
- 既有 RTP 專業課程入口

運動與聯盟是第二層篩選，而非首版主導航的第一層。這可保留傷種教學的核心，同時讓未來的同一傷種頁整合 NBA、MLB 與足球案例。

### 4.2 路由

首版產生：

- `/`
- `/injuries/acl/`
- `/injuries/ankle-sprain/`
- `/injuries/achilles-rupture/`
- `/cases/<case-slug>/`
- `/leagues/nba/`
- `/updates/<year>-q<quarter>/`
- `/about/`
- `/source-policy/`

未來只有在存在合格內容時才產生：

- `/sports/baseball/`
- `/sports/football/`
- `/leagues/mlb/`
- 其他運動或聯盟頁

### 4.3 傷種頁

桌面版主要工作區採雙欄：

- 左側：單一影片播放器與原始來源入口
- 右側：一般重點／專業分析切換、診斷狀態、關鍵時間碼
- 下方：同傷種案例庫、搜尋與篩選、傷種教學、RTP 課程連結

行動版依序堆疊為影片、一般重點、關鍵時間碼、專業分析、其他案例。播放器不得遮住筆記或導覽。

### 4.4 大量案例瀏覽

首版至少 30 個案例，因此必須支援：

- 球員、球隊與關鍵字搜尋
- 年份／球季篩選
- 運動與聯盟篩選
- 傷種與機轉篩選
- 經典案例篩選
- 診斷確認與審查狀態篩選（私人審閱環境）
- 分頁或漸進載入

列表頁不得預先載入所有影片 iframe；只顯示中性預覽卡，使用者點擊後才載入播放器。

## 5. 技術架構

### 5.1 應用形式

建立獨立的 Astro 靜態網站。理由：

- 與 `sportsmedicine.tw` 現行技術與品牌系統一致。
- 適合資料驅動頁面、低 JavaScript、良好效能與靜態部署。
- 首版不需要帳號、資料庫、API 或內容管理後台。
- 可在未來保留移轉到 CMS 的資料契約，而不在首版承擔後台資安與維護成本。

實作時建議放在目前工作區的獨立子目錄 `professional-sports-injury-atlas/`；是否建立獨立 Git repository、遠端 owner 與部署專案，須在實作前另行確認，不能由本規格自動推定。

### 5.2 邏輯元件

1. `CaseRepository`：讀取並驗證案例資料。
2. `InjuryTaxonomy`：管理傷種、同義詞與 RTP 連結。
3. `SportLeagueTaxonomy`：管理運動、聯盟、賽事與球季。
4. `SourceRegistry`：保存診斷、影片與證據來源。
5. `ReviewGate`：驗證逐案例醫療審查與摘要指紋。
6. `IndexingGate`：把醫療核准與公開索引授權分開。
7. `VideoEmbed`：延遲載入、時間碼跳轉、外部連結與失效備援。
8. `CaseSearch`：在瀏覽器端搜尋與篩選已建置的索引。

各元件以明確資料介面溝通；畫面元件不得自行推論診斷狀態或來源可信度。

### 5.3 與 RTP 課程的邊界

影片圖鑑不複製完整 RTP 處方。它可從經 manifest/digest 驗證的 read-only catalog snapshot 保存穩定的名稱、slug、subtitle、適用範圍／排除條件／回場目標、taxonomy/search aliases、課程內容 digest，以及完整醫療審查與索引授權 provenance；另保存核准網址及其獨立 link-approval decision。這些摘要用來避免把案例誤連到不適用的課程，不成為第二份處方來源。不得匯入詳細 units、劑量／進階表、RTP 影片、課程 evidence body 或個別治療指示。圖鑑連到：

- 腳踝扭傷 RTP 課程
- ACL 重建與回場課程
- 阿基里斯腱修補與回場課程

目前已有的本機課程資料可用於驗證對應關係，但在正式網址尚未核准前，只能在私人預覽顯示本機或停用連結。不存在核准絕對網址時，不得在公開建置產生猜測網址。

## 6. 案例資料契約

每個案例是一份獨立、可雜湊、可審查的結構化文件。最低欄位如下。

### 6.1 身分與分類

- `schemaVersion`
- `id`
- `slug`
- `sourceManifestBinding`: 綁定候選 ID、不可變的原始 manifest batch ID／manifest digest／entry digest／source-review-decision digest、來源政策版本，以及可由 append-only registry 解析的原始 registry entry；後續季度新增 batch 不得改寫既有案例綁定
- `status`: `draft`、`source-verified`、`medical-review`、`approved`、`rejected`、`retired`
- `sport.code`
- `league.code`
- `competition`
- `athlete.displayName`
- `teamAtEvent`
- `season`
- `eventDate`
- `opponent`
- `injury.code`
- `injury.confirmedDiagnosis`
- `injury.confirmationStatus`: 正式傷種頁只接受 `confirmed`

來源 manifest 採不可變批次與 append-only registry。季度批次只能加入未重複的 active candidate／event／video identity；更正批次以一對一 `supersedes` 取代舊 entry。舊 binding 被取代後不得通過新的醫療／公開 selector，案例必須重綁並重新審查，或在季度紀錄中退役／標記失效；已發布的不可變歷史快照不回溯重算。

### 6.2 經典案例

- `isClassic`
- `classicReason`
- `classicProposedBy`
- `classicExceptionApprovedBy`

`isClassic=true` 時，`classicReason` 與 `classicProposedBy` 從建檔起必填；`classicExceptionApprovedBy` 在醫療審查完成前可為 `null`，但案例進入 `approved` 前必須由同一案例的具名醫療審查者填寫。近期案例不得為行銷目的濫用經典標籤。

經典例外由內容負責人提出，並由同一案例的具名醫療審查者在審查時確認其教學價值；兩個身分都必須保存在案例紀錄。

### 6.3 影片

- `provider`
- `contentType`: 首版只允許 `in-game-injury-event`
- `canonicalUrl`
- `uploaderName`
- `uploaderProvenance`
- `embedStatus`: `verified`、`external-link-only`、`unavailable`
- `embedCheckedAt`
- `durationSeconds`
- `startSeconds`
- `endSeconds`
- `fallbackUrl`
- `segments[]`: `startSeconds`、`endSeconds`、`labelZh`、`observation`

播放器 URL 由已驗證的 canonical URL 產生，不接受任意 iframe HTML。首版 `fallbackUrl` 只能是同一 canonical 原始頁的外連，不接受未另做完整事件／來源／權利契約的替代影片。時間碼必須遞增並落在影片長度內。事件來源與人工 root audit 必須確認主影片就是同一球員、同一日期、同一比賽的受傷事件；這個事件對應不等於由畫面診斷。

### 6.4 雙層內容

一般層：

- `whatHappened`
- `whatIsVisible`
- `whatVideoCannotProve`
- `confirmedUpdate`

專業層：

- `mechanismAnalysis`
- `clinicalLimitations`
- `differentialContext`
- `treatmentAndRtpMeaning`
- `evidenceIds[]`
- `rtpCourseKey`

專業內容是教育與案例分析，不提供個別病人處方或僅憑影片推定分級、手術方式、復原期或回場日期。

### 6.5 來源與審查

- `sources[]`: `id`、`type`、`title`、`publisher`、`url`、`publishedAt`、`accessedAt`、`supports[]`
- `review.status`
- `review.reviewerName`
- `review.reviewerQualification`
- `review.reviewedAt`
- `review.reviewedContentDigest`
- `audit.createdAt`
- `audit.updatedAt`

內容摘要包含所有具醫療意義的案例欄位、時間碼、來源及 frozen source-entry binding；排除審查者填寫欄、索引授權和純視覺 token。任何被摘要涵蓋的欄位變更，都使舊醫療核准失效。逐案例摘要避免新增一案時讓其他已核准案例全部失效；公開閘門仍須回查 frozen manifest 與 durable medical decision，不能只信案例內可改寫欄位。

### 6.6 傷種教學總覽

ACL、腳踝扭傷與阿基里斯腱斷裂各有一份 strict structured overview，至少包含：適用範圍、基礎解剖／定義、常見但非診斷性的可觀察機轉、影片不能證明什麼、診斷、治療與 RTP 高階脈絡、atomic evidence claims、來源及醫療審查 digest。

總覽是傷種教學，不提供個人處方，不把常見機轉當成個別案例的診斷，也不複製三門 RTP 課程的完整復健進階。公開與私人核准版都必須使用與當前內容一致的具名醫療審查 digest。

## 7. 來源、診斷與影片權利政策

### 7.1 診斷確認

案例進入正式傷種頁，必須符合其中一項：

1. 有聯盟、球隊或其他第一方正式資訊確認傷種；或
2. 對無法取得第一方原文的經典案例，有結構化的第一方官方位置／封存／搜尋查核紀錄、具名查核者與日期，證明原文目前不可得，並有至少兩個獨立、可信且明確引用正式診斷的來源。

NBA 傷病報告可支持球員狀態與報告中的傷病描述，但不能自動補足報告沒有揭露的分級、影像、手術細節或恢復期。轉播評論、慢動作畫面、社群推測與匿名帳號不能單獨確認診斷。

畫面觀察與外部診斷必須分開呈現。來源衝突時，案例返回 `medical-review`；在衝突解決前不得留在公開傷種頁。

### 7.2 影片政策

- 優先選擇聯盟、球隊、轉播商或其他可辨識權利來源公開上傳的影片。
- 只使用平台正式嵌入播放器或外部原始連結。
- 不下載、剪輯、重製、重新上傳或保存比賽影片。
- 不從比賽畫面製作自有截圖或縮圖。
- 不遮蔽播放器品牌、廣告、標題或上傳者資訊。
- 不把 YouTube 或其他平台影片放在付費觀看閘門後。
- 即使技術上可嵌入，上傳者來源不明或疑似未授權時仍應排除。

YouTube 影片採 privacy-enhanced 模式及點擊後載入。年齡限制、地區限制或禁止嵌入的影片改用原始平台連結；若外部連結本身的權利來源也不合格，案例不得發布。

公開網站只嵌入已驗證有字幕的預錄影片；字幕不可用或未驗證時，改為清楚標示的原始平台外部連結，並保留網站自身的書面案例摘要，不在站內播放無字幕媒體。

NBA.com 內容、標誌與站內媒體不得因為可公開瀏覽就視為可重用。正式公開前仍需執行權利檢查；本規格不是法律意見。

### 7.3 參考來源

- 參考課程庫：https://sono-intervention-course-production.up.railway.app/
- NBA 傷病報告：https://official.nba.com/nba-injury-report-2025-26-season/
- NBA 使用條款：https://www.nba.com/termsofuse
- YouTube 嵌入說明：https://support.google.com/youtube/answer/171780
- YouTube Player 參數：https://developers.google.com/youtube/player_parameters
- YouTube Developer Policies：https://developers.google.com/youtube/terms/developer-policies

## 8. 策展與審查流程

每季依下列順序執行：

1. 建立候選清單，不直接進入網站正式資料。
2. 去重同一傷害事件與重複影片。
3. 驗證上傳者、原始網址、嵌入狀態與備援來源。
4. 驗證診斷來源，建立「畫面觀察」與「已確認資訊」兩條紀錄。
5. 填寫一般摘要、專業分析、關鍵時間碼與限制。
6. 執行資料契約、來源與時間碼檢查。
7. 產生案例與傷種總覽的內容摘要，送交具名醫療審查者。
8. 產生包含案例與 frozen source binding、傷種總覽、當期季度記錄、stable content-authority subset、clean commit 與完整 renderer/supporting-data tree digest 的 canonical review-set manifest，並在存取控制的私人環境驗證服務中的同一份 manifest；後續 hosting/public plan binding 不回溯改變此集合。
9. 經核准的案例進入下一次私人版本；公開發布仍須獨立授權。
10. 保存本季新增、更新、退役與失效案例紀錄；已公開季度以不可變、可驗證 hash chain 的 release snapshot 保存。

## 9. 失敗與降級行為

### 9.1 影片失效

- 禁止嵌入但原始來源仍合格：顯示 `external-link-only`，不顯示空白播放器。
- 影片被刪除或原始來源失效：標記 `unavailable`，從一般案例列表隱藏播放器，保留稽核紀錄並排入替換清單。
- 外部驗證服務暫時失敗：私人建置可標示未取得；公開 release check 應 fail closed。

### 9.2 診斷或內容衝突

- 新來源推翻或質疑既有診斷：立即使該案例核准失效並返回私人審閱。
- 專業主張缺少對應證據：資料驗證失敗，不得渲染為已核准內容。
- RTP 連結缺少核准網址：隱藏 CTA 或顯示私人本機入口，不猜測公開網址。

### 9.3 搜尋與介面

- 無篩選結果：顯示清楚的空狀態與清除篩選操作。
- JavaScript 不可用：核心傷種頁、案例內容與原始來源仍可閱讀；進階篩選可降級。
- 小螢幕：影片與筆記改為單欄，不使用水平捲動承載主要內容。

## 10. 私人審閱與發布閘門

### 10.1 私人審閱

首版先在真正受存取控制的環境審閱，並同時使用：

- 登入或存取控制
- `noindex,nofollow,noarchive,nosnippet,noimageindex`
- 一致的 `X-Robots-Tag`
- robots 封鎖
- 不提交 sitemap 至搜尋引擎

`noindex` 本身不是隱私機制。私人 hosting 平台與帳號須在部署前另行授權；本文件不授權 Cloudflare、Railway、DNS 或任何第三方設定。

醫療審查者看到的 review UI 必須顯示案例 ID 與完整內容 digest，並提供 review-set manifest。Hosting 驗證必須證明實際私人 URL 傳回與本機預期完全相同的 manifest bytes；具名醫療審查決定必須綁定該 review-set digest，不可由 agent 代填。

### 10.2 公開條件

公開版本必須同時滿足：

- 每個公開案例為 `approved`
- 具名審查者、資格、日期與內容摘要完整，且完全匹配 durable review-set/medical-review decision
- 影片與來源驗證通過
- 三個首發傷種各至少 10 個合格案例
- 三個傷種教學總覽都具有 matching approved digest
- 首頁會連到至少一份與本版核准案例 clinical/video digest pairs 一致、具有不可變公開時間的當期 approved update
- 網站層級 `allowIndexing=true`
- 非空白且可追溯的 `indexingAuthorization`，並有綁 exact site digest、public URL hash、`allowPublic=true` 與 `allowIndexing=true` 的 strict site-publication decision
- 公開網址、隱私政策、權利政策與課程連結已核准

醫療審查、成功建置、私人部署、公開／搜尋索引授權與每次實際 deploy 指令是不同決策，彼此不得推定。

## 11. 驗證與測試

### 11.1 資料與單元測試

- JSON Schema 全量驗證
- ID、slug 與來源 ID 唯一性
- 日期、球季、運動、聯盟與傷種交叉一致性
- 經典案例必填理由與核准者
- 時間碼遞增、位於影片長度內且無重疊錯誤
- 每個專業主張都有來源或 evidence ID
- 診斷未確認的案例不能出現在正式傷種頁
- 內容摘要變更會使舊核准失效

### 11.2 外部驗證

- 原始 URL 可達
- YouTube oEmbed 或平台等效檢查
- 嵌入狀態、上傳者與影片標題一致
- 備援來源可達
- RTP 連結為核准 HTTPS 網址

外部檢查應低併發並支援重試，以區分暫時性網路失敗與真正下架。

### 11.3 介面與無障礙

- 首頁、三個傷種頁、案例頁、季度頁與來源政策頁
- 搜尋、複合篩選、清除篩選、分頁或漸進載入
- 鍵盤操作、可見焦點、skip link、ARIA 狀態與字幕入口
- 文字放大至 200%、深色模式與 reduced motion
- 手機、平板與桌面版
- 播放器失效、外部連結與無 JavaScript 降級

### 11.4 效能與隱私

- 首屏不得載入 YouTube iframe
- 圖片與非首屏內容延遲載入
- 私人版不加入廣告、追蹤或未核准 analytics
- 目標 Lighthouse Accessibility 不低於 95
- 目標行動版 LCP 不高於 2.5 秒；私人環境差異須另行標註

### 11.5 發布負向測試

下列任一情況必須讓公開 release check 失敗：

- 未審查案例被納入公開清單
- 內容摘要與審查摘要不符
- 缺少索引授權
- `allowIndexing=false`
- 公開頁仍含 draft／medical-review 標記案例
- 三個首發傷種任一少於 10 個合格案例
- robots、HTML meta 與 HTTP header 的索引政策不一致

## 12. 實作階段輪廓

詳細實作計畫要在本規格書面審閱後另行撰寫。預定階段為：

1. 確認 repo、owner、私人 hosting 與審查角色。
2. 建立獨立 Astro 應用、設計 token 與資料契約。
3. 建立來源、影片、逐案例摘要與發布閘門。
4. 完成傷種圖鑑、案例頁、搜尋與篩選。
5. 策展至少 30 個 NBA 案例並完成來源查核。
6. 執行具名醫療審查與私人預覽 QA。
7. 建立每季更新手冊與失效影片維護流程。
8. 是否公開、部署或索引，另行決策。

## 13. 首版不做

- MLB、足球或其他運動的正式內容
- 自動診斷或從影片推測分級
- 自動抓取後直接發布
- 影片下載、剪輯、重新上傳或自製比賽截圖
- 使用聯盟與球隊標誌作為站方品牌
- 使用者帳號、收藏、留言、付費或訂閱
- CMS 後台、資料庫與即時通知
- 個別病人治療或回場處方
- 未經另行授權的 GitHub、DNS、Cloudflare、Railway 或公開索引變更

## 14. 成功標準

私人首版完成時應符合：

- 三個 NBA 傷種頁均可使用
- 每個傷種至少 10 個、全站至少 30 個核准案例
- 三個傷種教學總覽都有 atomic evidence 與 matching approved digest
- 每個案例都有合格影片來源、確診來源、雙層摘要、時間碼、限制與逐案例審查摘要
- 首頁與季度頁會連到一份與當前核准案例快照一致的 approved update
- 可搜尋並依年份、球員、球隊、機轉與經典案例篩選
- 影片下架與禁止嵌入有清楚備援，不出現空白播放器
- 手機、鍵盤、文字放大與深色模式通過驗證
- 私人存取與三層 noindex 防護有效
- 具名醫療審查決定綁定實際私人環境所服務的 review-set digest
- 公開 release check 在未取得公開授權前按設計失敗
- 三門 RTP 課程只透過核准連結開啟，臨床內容不重複維護

## 15. 後續決策閘門

以下項目刻意不由本規格推定，必須在相應階段取得明確決定：

- Git repository owner、visibility 與預設分支
- local platform implementation、NBA 來源研究與真實醫療 authoring 的分階段授權
- 內容負責人與具名醫療審查者
- 私人 hosting 平台、存取控制管理者與部署權限
- 三門 RTP 課程的核准公開網址
- 是否公開網站及是否允許搜尋索引
- MLB、足球與其他聯盟的個別來源／權利政策

取得相應實作授權後，可以在尚未決定 hosting／公開狀態時先建立本地架構與待審資料；但不得把上一階段授權擴張為下一階段，也不得猜測帳號、網址、審查身分或發布授權。
