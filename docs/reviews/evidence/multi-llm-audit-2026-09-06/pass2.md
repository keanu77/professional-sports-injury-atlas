# Pass 2：原始模型論點的最終判定

独立驗證agent `/root/audit_pass2` 完整閱讀相關元件／函式及公開呼叫鏈；主agent另外核對正式瀏覽器、量化資料與官方來源。A=採用，M=合併／限縮，O=低優先選項，R=排除。信心是對此最終判定的信心，不等於原模型分數。

| 原項目 | 判定 | 最終對應／反證 | 信心 |
|---|---|---|---|
| Codex001 | A | P1-01；resolve後reject無效，瀏覽器ready後error仍不復原 | 1.00 |
| Codex002 | A | P1-03；只限案例播放器，CaseCard本來有內縮框 | 0.99 |
| Codex003 | A | P2-02；有焦點管理，但缺狀態通知 | 0.99 |
| Codex004 | A | P2-01；5個非零時間碼的外部入口未帶時間 | 1.00 |
| Codex005 | A | P2-02；無JS按鈕無效但原始anchor可用 | 1.00 |
| Codex006 | O | 固定480來源成立，未證明畫質或流量影響 | 0.98 |
| Codex007 | O | 424704bytes未用部署字型，並非首屏下載 | 1.00 |
| Codex008 | A | P1-02；從待驗證提升，主agent量到11.625px字形裁切 | 1.00 |
| AGY1 | A | P2-04；4頁各10欄，非P0；noscript段落並非一般JS畫面 | 1.00 |
| AGY2 | A | P2-05；enum在details，用語問題，非敏感資訊外洩 | 1.00 |
| AGY3 | R | 無「假資料」依據；球隊公告、NBA報導、D20投影可反證 | 0.99 |
| AGY4 | M | P2-04/05；14＝7＋7，ACL有衛教，拒絕把未知膝部影片分類為ACL | 1.00 |
| AGY5 | M | P2-03/06/09；Game3註記已存未顯示，未知回場是本站未收錄；LaMelo後續公告支持sprain，不直接改成strain類別 | 0.98 |
| AGY6 | M | P2-08；21筆「目前使用」語氣過時，但7案例只有6球員，且封面都改YouTube | 1.00 |
| AGY7 | R | sport排球已顯示，未知背景明示且有NHS連結，不得編休閒身分／年份 | 0.98 |
| Grok P1-01 | O | 卡片已有觀察CTA；來源BROKE／Inversion標題未顯示首頁，不能稱無區分 | 0.99 |
| Grok P1-02 | A | P2-03；general.whatIsVisible完全未render，不是只藏details | 1.00 |
| Grok P1-03 | R/O | 共用通用處理不證明醫療錯誤；新增回場導引是另查核內容選項，拒絕bodyPart直接診斷 | 0.98 |
| Grok P1-04 | M | P2-04；ACL無案例但有PatientGuide，可改衛教優先，非空白頁 | 1.00 |
| Grok P1-05 | M | 併AGY1／P2-04，降P2 | 1.00 |
| Grok P1-06 | M | 併AGY2/4／P2-05，降P2 | 0.99 |
| Grok P1-07 | A | P2-07；主站連結僅首頁，非P1功能故障 | 1.00 |
| Grok P2-01 | O | 資訊密度／卡片一致性為編輯選項，不是已證實失效 | 0.90 |
| Grok P2-02 | M | 併AGY2／P2-05 | 1.00 |
| Grok P2-03 | O | 腳踝／踝關節為同義呈現，不是錯誤診斷 | 0.95 |
| Grok P2-04 | O | 單項選單確重複，但Escape／焦點功能正常 | 1.00 |
| Grok P2-05 | O | 24頁a[href]無聯盟入鏈成立；可精簡留存，不必刪route | 1.00 |
| Grok P2-06 | M/O | 照片說明併P2-08；其他免責位置／最多3筆屬編輯選項 | 0.95 |

補充證據：browser-results.json共30組且Axe零項，只代表指定自動檢查；reproductions.json與裁字截圖捕捉自動掃描未抓到的問題。playback-original.json首次Kyrie有字幕偵測逾時，playback-kyrie-retry.json已重試成功，不能把整輪首測描述為全數無錯誤。
