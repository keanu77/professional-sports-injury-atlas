# Decision 23 — 已確認的九支影片擴充

使用者在九支候選、字幕非必要、完成事件核對後加入的明確問題後回覆「可以」。本次授權範圍為該九支公開原平台嵌入，沿用已上線品牌版型；不表示已簽署新診斷或新病程。來源原始資料、既有三份衛教核准、D18/D20 歷史均不改寫。

## 發布內容

- 原有五支加九支，共十四支。
- Tatum、Haliburton 使用既有 approved 病例、完整 canonical digest 與 D20 回場資料；另立 expansion manifest，沒有把新授權冒記到 D21 核准紀錄。
- 其餘七支使用獨立 observation schema 與 /videos/ 頁面，提供畫面觀察、NHS 一般停賽／保護／就醫提示、已確認個人回場資訊。沒有醫療簽核欄位，不推定韌帶、骨折、傷勢等級。
- 所有影片同一首頁、運動篩選、搜尋；新片可由「受傷動作觀察」選項找到，與具名診斷分清楚。
- 字幕例外僅對這九支 canonical URL 生效。保留 provider、region、verified embed 限制與既有案例診斷核准。
- 來源政策已反映字幕非必要。影片仍點擊後才載入；保留原始連結和無 JavaScript 文字。

## 事件與觀看位置

| 影片 | 開始秒數 | 核對結果 |
| --- | ---: | --- |
| Zverev / 7tpaxZTTi2w | 1340 | 22:20 受傷前最後回合；22:40 已倒地。Roland-Garros 官方 2022-06-03 事件報導；ATP 2022-12-31 United Cup 實際比賽，相隔211天，與個人恢復預測分開。 |
| Redmond / t2G8KVzTwfw | 15 | Olympics 官方片；0:30 已停下屈膝；父親協助走向終點不稱回場。 |
| Strug / Bwa5Bf656As | 0 | Olympics 官方短片；USA Gymnastics 1996 奧運團隊回顧支持事件；同場第二跳不稱回場。 |
| Marín / nfpXC98FLuE | 35 | BWF 官方片，0:50 落地重播；西班牙羽協與 RTVE 核對2019-09-11實際復賽，與1月27日相隔227天。 |
| Foucher / 4y-1D7jTW_4 | 35 | 0:45跳箱，0:50停止，0:55接受協助；CrossFit 2016 Mind Games 回顧支持2015 Central Regional事件，不推定回場日期。 |
| Volleyball POV 135 / tEHP_6GA6ZA | 215 | 3:35進入網前受傷段落，4:00球友倒地、5:00協助離場。標題 BROKE 不當骨折诊斷。 |
| 腳踝翻轉 / qwuEydc9qXQ | 0 | 18秒短片；可見排球動作與護膝、無球拍；0:12原片圈出腳踝。選手身分、賽事等級不推定。 |

所有回場日期與來源連結保存在 src/data/videos/expansion.v1.json。官方經典片是事件史料，保留較舊來源以對應當時事件。一般處理引用 https://www.nhs.uk/conditions/sprains-and-strains/，2026-09-06重開核對。內部瀏覽器截圖只用於核對，不進公開素材、Git 或網站。

## 驗證

- 隔離乾淨副本：1305單元、256四瀏覽器測試通過。第一次根目錄測試失敗源於D18乾淨Git條件和sandbox listen限制；相同程式在正確條件下通過。
- Astro check 0 errors / 0 warnings、16既有hints。
- 獨立唯讀檢查確認7既有公開案例核准與原始digest，修正籃球關鍵字找不到案例問題。
- 後續正式產物、實播與部署證據記錄於 evidence/decision-23/，完成後寫入 HANDOFF。

## 本機與 HTTPS 差異

兩支 Olympics 影片在 localhost 原平台顯示「無法播放這部影片」，其餘七支實播通過；未把本機失敗標成成功。改在真實 Cloudflare HTTPS 預覽版本重驗，guard改讀 playback.preview.v1.json。

預覽上傳曾被自動審查拒絕（目的地所有權未證）。唯讀 wrangler pages project list 證明既有圖鑑與使用者明示擁有的 sportsmedicine.tw 同在登入帳號管理，dist掃描無私密檔案；帶證據重試獲准。預覽 https://2bfdfcdc.sports-injury-atlas.pages.dev ，正式版仍待發布。

HTTPS預覽九支全部實播通過；POV一次緩衝逾時後獨立重測通過，原失敗與重測紀錄均保留。手機與桌面15個主頁/影片頁均通過Axe，28個公開HTML/JSON/robots回應雜湊匹配，播放前零第三方請求。
