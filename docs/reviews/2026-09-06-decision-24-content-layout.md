# Decision 24 — 內容頁版型與直接瀏覽

使用者會將圖鑑放入主站內容頁，要求參考 https://sportsmedicine.tw/content/ 的設計，並刪除搜尋、「先看影片／選擇影片，了解受傷與回場」、傷害種類與運動項目下拉選單。

已實際開啟主站內容頁並核對其原始碼：淡藍漸層標題區、麵包屑、36/48px標題、18px短介紹、24px卡片間距。首頁採用同樣結構，加入返回「分享資訊」連結，直接展開14張影片卡片。刪除篩選表單、搜尋、重複標題/計數、篩選JS與CSS；保留原videos-heading錨點供影片詳頁返回。未修改主站專案；主站內容頁入口由使用者安排。

影片、醫療資料、案例核准、播放元件、權利與字幕規則不變。公開manifest只更新rendering inputTreeDigest。

驗證：Astro check 0 errors/0 warnings、16既有hints；相關患者瀏覽測試四瀏覽器共12項通過；完整release:public通過24頁/7案例/7觀察/474內部連結。正式28個HTML/JSON/robots回應hash匹配，15個首頁與影片頁手機/桌面Axe及點擊前零第三方請求通過，無JavaScript內容可讀。已目視390px、1440px正式首頁，搜尋/input/select數量皆0。

正式：https://sports-injury-atlas.pages.dev/
來源版本：33cd45934b989eca7cf6f95ebfd72c6de039d8f0
Production/main：30504fef-e3c2-4c79-bebf-8e49a9be21f8
驗證時間：2026-09-06T02:45:43.594Z（台灣10:45）
無待辦。Docs-only交接commit不改發布輸入，不必重發。
