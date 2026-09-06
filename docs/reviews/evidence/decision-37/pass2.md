# Decision 37：獨立對抗複核（Pass 2）

審查方式：唯讀完整檢視被標記的元件、前端腳本、後端處理與主站 contact 依賴；交叉閱讀根代理提供的離線函式測試與瀏覽器實測。未修改 repo、未呼叫正式站 POST、未寄信。信心指「本複核結論的證据充分度」，不沿用第一輪模型自評。低於 0.70 的缺陷主張剔除；產品機會與實際漏洞分開。本文不替代醫師對新增醫療內容的核定。

## Codex 原項

| 原項 | 處置 | 結論／依據 | 信心 |
|---|---|---|---|
| 1 Turnstile 可用性 | 降級 P2 待完成驗收 | `contribute.astro` 已有 role=status、可點且鍵盤可達主站備援；`contributions.ts` 有載入/逾期/失敗狀態。沒有證據證明一般鍵盤使用者無法提交。保留真實手機、鍵盤及真人 challenge 到信箱的端到端驗收，不能把尚未完成驗收稱已壞。 | .94 |
| 2 首頁選片成本 | 採納 P1 產品改善 | 首頁全部 101 卡與三組分類先行，390px 首張 top=2230.4375px，header177px。已有分類路由、skip link，不能報沒有篩選。採縮短前段、分類折疊或快速跳影片、漸進呈現；不直接恢復使用者已移除的搜尋。 | .99 |
| 3 A−/A＋等無明確名稱 | 剔除 | FontScaleControl 有「縮小字級／放大字級」aria-label；選單有主選單、ThemeToggle 有文字與 aria-pressed；ObservationCard ▶ aria-hidden，完整連結含人名；播放器按鈕明寫載入 YouTube，iframe title 含事件。沒有該缺陷。 | .99 |
| 4 網站欄位暴露 | 剔除 | `contribution-trap` 的 aria-hidden=true、input tabindex=-1、CSS 1px+clip-path；deep-browser 實測同。這是文字擷取包含 honeypot 的誤判。 | 1.00 |
| 5 播放器狀態不清 | 降級 P2 可選改善 | `video-player.ts` 已管理 idle/loading/ready/failed、aria-live 宣告、失敗訊息、重試與焦點返回。不可報「沒有失敗狀態」。可把目前 sr-only 的 loading/ready 亦做簡短可見狀態、字幕與外部來源區視覺整合。 | .95 |

## Grok 原項

| 原項 | 處置 | 結論／依據 | 信心 |
|---|---|---|---|
| 1 兩套卡片深度 | 部分採納 P1 | 7 full case+94 observation 正確；ObservationCard 只有 event/name/CTA，未一致呈现年份／部位／運動。補最少必要欄位有價值。剔除把前7張當「精選／熱門」的推論：那是全部模式的首7張，兩種模式由 JS 實際挑選。診斷只能顯示有來源確認者。 | .99 |
| 2 兩套衛教深度 | 採納 P1 產品改善 | 7 case 有 PatientGuide+文章；94 observation 只有頭頸/非頭頸兩套共通處置及事件追蹤。補符合部位的民眾參考與主站文章／就醫重點，分批核查。不可為了模板一致替所有傷種硬填一般人回場天數。 | .99 |
| 3 Haniger 14 天 | 採納 P1 呈現改善，非資料錯誤 | EventFollowUp 先顯示大字天數，其下完整呈現 returnSummary 和 context，含3A復健賽及8/19 MLB。改成「首次復健賽：14天」等明確里程碑标签比直接換日期更稳妥；不得把現有已核資料稱錯或强制只計大聯盟。 | .99 |
| 4 精選全NBA | 剔除 | `discovery.v1.json` 實際6支精選：Acuna、Zverev、Marin、Bassitt、Dupont、Vonn，含棒球、網球、羽球、橄欖球、滑雪。並非那7張NBA。可另討論全部預設排序多樣性，不能誤報精選缺陷。 | 1.00 |
| 5 影片頁無相關影片 | 採納 P2 | observation 頁完整模板只有返回首頁anchor，沒有同部位/同情境卡。可加入2–4支相關影片和返回原分類（2–4是設計建議數量不是測量結果）。不是死連結／完全無返回。 | .99 |
| 6 修正入口不一致 | 採納 P2 | about/source-policy 實際仍主站聯絡頁，header及contribute已是本站匿名入口。兩頁主CTA應導向本站表單，主站保留備援。 | 1.00 |
| 7 修正模式無頁面/必填 | 剔除 | `src/scripts/contributions.ts` change listener 會換為「需要修正的頁面網址」「需要修正的內容與建議」，required=true、note minlength5，並讀取page query預填；後端亦要求correction URL+note。模型僅讀初始video模式。 | 1.00 |
| 8 同名卡辨別 | 採納，併1 | Harper兩事件卡缺統一年份/部位；補欄位即可。不直接以LaMelo同部位再次受傷推定醫學上的復發機轉或因果。 | .97 |
| 9 About少第三軸 | 採納 P2 | about 確只寫部位或運動；可補情境與不同頁面資訊深度，與現況一致。 | 1.00 |
| 10 天數與一般人參考 | 採納，併2/3 | EventFollowUp 已有「出賽不等於完全康復；日期差不是個人的回場期限。」不能說未警示；應把里程碑語義靠近數字並補合適的民眾導讀，不必每頁增加無根據範圍。 | .98 |
| 11 免責重複/順序 | 降級 P2 選擇性版面調整 | case 模板確在heading前 MedicalNotice，後續 PatientGuide與footer另有提醒。可改位置/濃縮視覺；但不能沒檢視現有醫療/授權規則即删除核定文字，亦未證明導致實際跳出。 | .93 |
| 12 運動中文對應縮寫 | 採納，併1 | observation卡只event，部分event使用NFL/MLB。運動标签應來自現有taxonomy，改善一般讀者理解。非分類資料錯誤。 | .97 |

## agy 原項

| 原項 | 處置 | 結論／依據 | 信心 |
|---|---|---|---|
| 1 移除診斷/改cases URL | 剔除 | `cases/[slug].astro` 明示「外部來源確認診斷」，資料治理分離觀察與公告；有可靠報導的病名可以顯示。模型把「不憑畫面診斷」誤讀成「不能列報導診斷」。改既有URL和隱藏已確認病名無必要，且前7不是熱門。只採Grok1的卡片欄位一致。 | .99 |
| 2 查核日期未顯示 | 剔除 | EventFollowUp details內明確渲染 eventUpdates.checkedAt，來源項也有publishedAt；政策說「可展開」，正合現況。是關閉details文字擷取誤判。 | 1.00 |
| 3 Haliburton語句生硬 | 降級 P2 文案微調 | 可以把「下一季回歸展望不是已完成出賽」寫得自然；模型建议「將缺席2025–26」把已發生季賽改未來式，反而不正確，不能照抄。維持已缺席＋尚未核到實際復出，勿新增預測。 | .98 |
| 4 01–03落差 | 採納，併Grok2 | 模板落差屬實；不採「必須所有頁都提供時間範圍」，是否可加需傷種證據與醫療審查。 | .99 |

## Qwen 內容原項

| 原項 | 處置 | 結論／依據 | 信心 |
|---|---|---|---|
| 1 Crutiate拼錯P1 | 剔除缺陷；最多P3顯示譯名 | JSON第54行確為Crutiate，但是來源NHS原題、原URL亦同（根代理已上網核對）。凍結資料有contentDigest，不可直接改引文。搜尋引擎不能索引的影響未證實，嚴重度誇大。 | .98 |
| 2 首頁回場措詞 | 降級 P2，併里程碑顯示 | 「回場」不自動等於康復，現有首頁與每個EventFollowUp都說明差異。可精煉描述但非確認誤導事實。 | .91 |
| 3 Tavares季前賽 | 剔除資料／截斷缺陷；併Grok3 | returnSummary/context完整渲染，不截斷。靠近大字顯示季前賽是可採產品改善。「季前賽風險遠低於例行賽」沒有本次證據，不採。 | .99 |
| 4 Crosby五天 | 降級 P2，併Grok3 | 現有context已明言2017個人出賽不是五天回場規則，且頭頸模板不得當天回場／需醫療評估。可把高風險例外靠近天數。未核對新舊共識不能新增「現今更嚴格」比較。 | .97 |
| 5 Klay複合伤 | 部分採納 P2標籤；剔除建議文案 | context已完整说明中间第二次伤害。模型建议反轉ACL／Achilles側別（資料是2019左膝ACL、2020右阿基里斯）；不得照抄。可標「期间另有伤势，非单次ACL恢复期」。 | 1.00 |
| 6 兩匿名球友影片 | 剔除 | `event-updates.ts` 依 curation.removedSlugs 過濾，現有公開101無該2影片。保留歷史原始檔非仍公開；使用者先前要求已完成。 | 1.00 |
| 7 外部來源有效性 | 採納 P2維護建議 | 長期外部來源/YouTube可用性會漂移，可定期查HTTP+實際embed及回報入口。未逐條live讀證據，不可宣稱任何特定來源失效；Wang另有官方MLB備援。 | .96 |
| 8 一般人與選手分開 | 已有，併Grok2/3 | PatientGuide有「時間是參考範圍，不是回場許可。影片與球員紀錄無法判定你的傷勢。」無需再堆同義免責。可改善位置/模板一致性。 | .99 |
| 9 checkedAt一致 | 確認無缺陷 | 該事件集合的batch全部同日，程式强制一致；不能延伸成repo所有JSON都此日期。未來更新需逐條checkedAt，見維護建議。 | .99 |
| 10 Ohtani帶傷出賽 | 部分採納 P2標籤 | UI實際「再次出賽」，從未標「康復」。context完整說明打者與投手、後續手術。可靠近天數標「帶傷出賽/打者」，不能報日期錯或缺說明。 | .99 |

## Qwen 資安原項（原文無編號，按出現順序編S1–S8）

| 原項 | 處置 | 結論／依據 | 信心 |
|---|---|---|---|
| S1 action/hostname | 降級 P2防禦加強 | 主站verifyTurnstile確只檢success；atlas前端已action=atlas-contribution。可在後端依用途校验回應hostname/action，需顧主站原表單。不足以確認跨任意站點token可用；token單次使用也不等同可任意重用。不採模型「siteverify request加action即可」的錯誤修法，應校驗回應、伺服器決定預期值。 | .98 |
| S2 message CRLF報頭注入 | 剔除 | message只入Resend JSON的text/html body，html經escapeHtml；subject/name/email已有控制字元檢查。body換行合法，不能推定成SMTP header。刪除換行反會破壞正常內容。 | 1.00 |
| S3 Turnstile故障混成無效 | 採納 P2可靠性 | 主站verify catch→false→400；可區分invalid與verification-unavailable讓監測/使用者重試精準。目前atlas把400整合為502delivery，尚不是安全繞過。此更改涉及主站依賴而非只atlas。 | .98 |
| S4 publicUrl SSRF | 剔除 | atlas不抓投稿URL，只寄文字；publicUrl還拒绝純數字點IPv4，例舉10.0.0.1等已擋。假設未來自動抓取不構成現有SSRF。若未來建立抓取工作再做DNS/IP出站治理。 | 1.00 |
| S5 play並發重複 | 剔除 | event_id PRIMARY KEY+INSERT OR IGNORE保证同UUID去重，前端首次播放生成一次、重試同body；沒有該競態。另有真正新UUID可造播放之統計可信度問題，獨立列根代理R4。 | 1.00 |
| S6 HMAC旋轉 | 剔除目前缺陷，P3 runbook可選 | 無證據有自動/錯誤換key；穩定D1key為既有設計，模型原confidence.65亦低於門檻。可文件化不要中途無計畫換key，不必為此增加雙key複雜度。 | .98 |
| S7 reply_to未限域 | 剔除 | 主站公開聯絡表單預期讓訪客留下可回覆信箱，非只限内部使用。atlas代理固定no-reply且告知勿回覆；模型要求只准公司域名違反產品需求，無權限漏洞。 | 1.00 |
| S8 sources XSS | 剔除 | publicUrl只准http/https，拒javascript；主站escapeHtml(message)；body不是innerHTML。模型原confidence.5，不存在指出的脚本路徑。 | 1.00 |

## 根代理新增項目的獨立裁定

| 項目 | 裁定與範圍 | 信心 |
|---|---|---|
| 手機長header/分類 | 採納P1 UX。390px header177/首卡2230.44；320px 150%字級header391.56px。deep-browser測得scrollWidth=viewport、focusObscured=[]，不能宣稱已證WCAG reflow或焦點遮擋失敗。 | .99 |
| 94卡無部位/年份＋94頁無03文章 | 採納P1，與Grok1/2合併。數量由data-check+實際模板確認。完整事件來源101都有，不能稱94頁無後續資料。 | 1.00 |
| 里程碑語義 | 採納P1。returnDays大字在summary前，summary/context完整，無日期差計算衝突；靠近數字顯示復健／春訓／正式／帶傷，不改已查核日期。 | 1.00 |
| 熱門可由客戶端造新UUID | 採納P1統計可信度。離線mock測2個不同UUID均INSERT；server無實際播放證明。Origin不是bot身份證明，30/min仅instance防爆。可採短期可重放限制/分散式節流/異常監測，配合DNT/GPC及不建跨站追蹤。不能稱已發現正式站灌票，也不承諾任何方法可完美证明真实观看。 | .99 |
| 空投稿 | 採納P1低成本修正。type=video且URL/note/sources均空仍到upstream，mock證200；要求三欄至少一欄有有效內容，保持影片網址選填、匿名不收email。這不是繞過Turnstile。 | 1.00 |
| quota reserve在captcha前 | 降級P2韌性。主站明確4xx釋放global/duplicate，仍計IP；500/timeout保留是避免重寄的不確定結果保護。不可說任意無效token必然耗光50。可監測uncertain量及可信後台人工處理，勿直接釋放全部失敗額度。 | .99 |
| CSP unsafe-inline | 採納P2防禦加強。live/script-src與style-src存在；未指出注入sink，非確診XSS。可讓偏好初始化採hash並盤點樣式與Turnstile/YouTube相容，先report-only驗證再強制。 | .99 |
| npm兩high | 採納P1維護升版，降級實際站危害。fresh npm audit為fast-uri 3.0.0–3.1.5、nanoid<3.3.18；由根代理核依賴位置屬dev/build。不能稱訪客可利用live SSRF。升到已修補patch、重跑build/必要測試，勿major force。 | .96 |
| 分享/VideoObject/favicon | 採納P2。BaseLayout沒有OG/twitter輸出，crawl145頁missingOg；101影片頁未VideoObject；favicon404是品牌機會，不是站不可用。新VideoObject只填可验证資料（uploadDate不能用傷日冒充），不保證搜尋rich-result。 | .99 |
| case來源連結target-size | 採納P1可及性。deep-browser AxeWCAG22AA 2.5.8測236.7×16px，鄰summary間距18px，兩種合規路徑皆不足；CaseVideo CSS未賦此獨立link minheight。擴到44px友善而24px是該规则最低；不要把所有inline文字link都強設44。 | 1.00 |
| 首頁h1→h3 | 採納P2語意。LH實測heading-order首個case-card h3；跳級為best-practice警告，不單獨等同WCAG確定違規。補section h2與正確卡片層級。 | .99 |
| 關於/政策修正入口 | 採納P2，与Grok6/9合併。 | 1.00 |
| 字幕與非視覺理解 | 採納P2內容可及性優化。94 observation的caption unavailable12、available9、not-verified73（根代理data-check）；不能擴充成101全站比例。無字幕不自動判影片無法理解；補精簡文字動作觀察、關鍵時間點/有聲資訊摘要，逐片確認而非聲稱全站已符字幕標準。 | .97 |
| 單筆查核新鮮度 | 採納P2維護。event-updates.ts:112–121強制所有batch checkedAt一致，註解已要求未來採逐條日期。現在不是假日期；下次增量更新前引入per-entry review日期和過期提醒，避免把未重查舊筆一併更新。 | .99 |
| 實際寄達信箱未驗收 | 採納P2營運驗收。mock/preview限流及主站接口成功不是收件匣實收證明。既有未取得真人challenge/未實寄的限制應誠實保留；不要在此audit擅自寄送。 | .99 |

## 建議向使用者呈現的優先順序

P0：本次未驗出需立即停站的問題；這不等於完整滲透測試或所有101則病史原文重新逐篇核醫。

P1：1) 首頁手機更快到影片；2) 統一卡片必要欄位；3) 補94頁民眾導讀並分批醫療核查；4) 里程碑標籤緊鄰天數；5) 小觸控來源連結；6) 空內容表單；7) 熱門統計防造事件；8) 修補開發依賴。

P2：相關影片與返回分類、政策入口與說明、分享圖/favicon/VideoObject、文字替代/字幕查核、逐筆更新日期與失效監測、challenge回應綁定/CSP、寄達/失敗路徑驗收。

避免把全部改進一次做成長解說；符合使用者要「可看影片、一般人讀得懂、少說明」的偏好，以清楚標籤、漸進展開與相關連結為主。
