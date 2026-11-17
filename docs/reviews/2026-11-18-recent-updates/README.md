# 近兩年運動傷害與回場資料更新

使用者要求：「請你搜尋近兩年有哪些運動傷害影片或資料要更新的，如果有請更新」。搜尋範圍為 2024-11-18 至查核當下，優先比對現有選手頁的回場資訊。基底是 GitHub main `4bfef220e2f2e525717f6aeb4eede751983f8bc8`。

本輪更新 5 個事件、7 個資料檔，新增 9 個來源網址。影片目錄維持 200 筆（7 個核心案例、193 個觀察頁），原主影片、事件識別、醫療診斷與機轉段落均保留。

查核於臺北時間 2026-11-18 進行；當時 UTC 日期為 2026-11-17，因此資料的 `checkedAt` 使用 `2026-11-17`。只有本次更新的 5 個事件提高查核日期，其餘紀錄保留各自日期。這個日期代表新增後續消息的查核，沒有把歷史來源或影片播放一併宣告重新驗證。

## 更新內容與可追溯來源

| 事件                                   | 原資料缺口                       | 本次更新                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tyrese Haliburton，2025 右阿基里斯腱傷 | 未核得正式復賽日                 | [球隊賽後報導](https://www.nba.com/pacers/news/rewind-pacers-pelicans-261021)確認 2026-10-21 重返例行賽；[10 月 28 日另一份球隊報導](https://www.nba.com/pacers/news/rewind-pacers-76ers-261028)記載左腿後肌群拉傷，時間軸明確區分不同傷勢。                                                                                                                                                                                                                                                                                   |
| JuJu Watkins，2025 右膝傷              | 仍停留在缺席 2025–26 球季的公告  | [USC 賽後報導](https://usctrojans.com/news/2026/11/2/no-3-usc-womens-basketball-downs-unlv-100-68-during-season-opener)確認 2026-11-02 對 UNLV 正式出賽。文章標題與內文的團隊比分有出入，本次不引用比分。                                                                                                                                                                                                                                                                                                                      |
| Chloe Kim，2026 肩傷                   | 僅記備戰意願，尚未核定實際出賽   | [NBC 賽後報導](https://www.nbcolympics.com/news/chloe-kim-unfazed-injury-crushes-halfpipe-qualifier-roar-final-mastro-3rd)確認肩傷後首次參賽；與 [FIS 賽程](https://www.fis-ski.com/snowboard-park-and-pipe/news/2025-26/kim-begins-snowboard-halfpipe-three-peat-bid-facing-her-reflection-)交叉確認資格賽日期為 2026-02-11。受傷日不詳，維持 `eventDate` 與 `returnDate` 為 null，實際出賽日期記於時間軸。                                                                                                                   |
| Gabriel Medina，2025 胸大肌肌腱傷      | 只有回歸訪談，尚無比賽結果       | [SURFER 賽後報導](https://www.surfer.com/news/gabriel-medina-is-back-in-form-and-the-season-is-just-getting-started)確認 2026 年 4 月於 Bells Beach 晉級四強。仍未核得個人首場出賽日，時間軸只記月份，`returnDate` 維持 null。                                                                                                                                                                                                                                                                                                 |
| Federica Brignone，2025 左腿傷         | 時間軸停在 2026-01-20 世界盃復出 | 加入 FIS 的 [2 月 12 日超大曲道](https://www.fis-ski.com/alpine-skiing/news/2025-26/brignone-completes-emotional-comeback-with-home-olympic-super-g-gold)、[2 月 15 日大曲道](https://www.fis-ski.com/alpine-skiing/news/2025-26/brignone-gets-second-olympic-gold-in-incredible-giant-slalom)金牌紀錄，以及 [10 月 21 日術後復健與缺賽消息](https://www.fis-ski.com/alpine-skiing/news/2026-27/women-s-giant-slalom-preview-challengers-chase-scheib-as-season-begins-in-soelden)。保留首次回場日，避免將獎牌等同於完全康復。 |

以上 9 個新增來源均已直接開啟閱讀；Medina 使用具名作者的專項媒體賽後報導。WSL 網站受到 robots 存取限制，不宣稱已完成 WSL 官方成績頁驗證。NBC 資格賽文章未提供可直接確認的出版日期，來源的 `publishedAt` 保留 null。

本輪另找到 [Chiefs 官方的 Patrick Mahomes 2025 左膝 ACL 傷勢與手術公告](https://www.chiefs.com/news/injury-update-on-qb-patrick-mahomes)。這是可繼續蒐集的新事件線索；尚未取得符合本站要求且已實際播放驗證的主影片，因此未加入影片目錄，也未推定 LCL 傷勢或回場日。

## 實作與驗證邊界

- 更新公開報導資料及對應觀察頁的 `returnText`、`returnDate`、來源與時間軸。原有來源及時間軸採追加方式保留。
- [changes.json](./changes.json) 記錄每筆修改的原值、新值與追加來源／時間軸；歷史 review snapshots 不改寫。
- 目錄回歸測試先比對每筆修改的原值，再套用這份明列的更新；其餘欄位仍與歷史快照逐欄相等。新增斷言檢查 486／588 天、未知日期不計算天數、後續不同部位傷勢、引用索引及卡片與內文一致性。
- 沒有更改臨床核准簽章、來源政策、影片識別、播放證據、授權或 release input digest。沒有執行正式部署。
- 一般 `build:review` 不呈現所有公開觀察頁。工程測試與 review 建置不能宣稱已完成 200 支影片的播放、公開頁面或臨床審查。

重現時使用 Node 24.14.0 及完整 Git 歷史。`content:check`、完整測試與 build 的 provenance 規則需要乾淨提交；本次變更以獨立本機分支保存後執行，不修改這些規則。

```sh
npm run plan:verify
npm run check
npm run content:check
npm run test:unit
npm run build:review
npm run brand:verify
npm run verify:review-artifact
```

實際執行結果另見本次交班與未追蹤的 `output/recent-update-validation/` 紀錄；上列為重現指令，不代表每項已執行通過。
