# v0.1.0 · Search injury videos and follow the sources

Sports Injury Video Atlas is an educational video index curated by sports medicine physician Yi-Cheng Wu. Start with an athlete, sport, or body region, open an event, and follow the original sources and available return-to-sport context.

**[Open the website](https://injury.sportsmedicine.tw/)** · [繁體中文 README](https://github.com/keanu77/professional-sports-injury-atlas/blob/main/README.md) · [English README](https://github.com/keanu77/professional-sports-injury-atlas/blob/main/README.en.md)

## What you can do

- Browse 200 videos across 30 sports and 14 body regions, with 7 core cases and 193 observation pages as of 2026-10-20.
- Search English athlete names in a primarily Traditional Chinese interface, combine filters, and preserve the search when returning from a detail page.
- Read sources, event context, available follow-up, and related videos with article navigation, mobile layouts, dark mode, and adjustable text.
- Explore the Astro/TypeScript implementation with documented Node 24.14.0 setup, review-mode builds, and contributor checks. Linux setup includes `fonts-noto-cjk` for share images.

## Maintenance included

- Repair 13 source citations while preserving event facts and source-index bindings.
- Report source restrictions and incomplete video checks explicitly; metadata is not playback evidence.
- Verify the deployed commit at [`/version.json`](https://injury.sportsmedicine.tw/version.json).

## Reuse and limits

Original code and developer documentation use MIT. Medical editorial collections, review records, video, thumbnails, and other media have separate rights; read [LICENSE-SCOPE.md](https://github.com/keanu77/professional-sports-injury-atlas/blob/main/LICENSE-SCOPE.md) and the third-party notices before reuse.

This is an educational index, not a diagnostic tool or return-to-sport clearance system. The 200 entries are not equally validated clinical cases. Playback can vary by location and rights-holder settings. No adoption or educational-effectiveness claims are made.

The demo recording shows search and source navigation without playing the original third-party video. GIF, full MP4, short MP4, and the social preview image accompany this release.

## 中文

這次整理讓第一次進入 repository 的人能快速了解網站用途、查看操作示範，並依文件在本機啟動。公開網站可搜尋 200 支影片，對照事件來源與回場脈絡。自有程式碼採 MIT；影音與醫療內容另有授權範圍。歡迎改善文件、無障礙與搜尋，或提出附有來源的資料修正。
