# License scope / 授權範圍

The MIT license in [LICENSE](LICENSE) applies to original software code and developer documentation authored for this project. It does not grant rights to every item stored in this repository. Existing third-party notices take precedence for their respective materials.

## Included in the MIT grant

Original application logic, components and styles, build and validation tools, tests, infrastructure configuration, and documentation explaining how to develop or contribute to the software. For mixed files, the grant covers the original software implementation, not embedded editorial content or third-party material.

The original synthetic text in [`examples/fork-demo/`](examples/fork-demo/) is also MIT-licensed. It was written for software onboarding, contains no real case or clinical guidance, and does not import the editorial collection or its approvals. This explicit inclusion applies only to those original demonstration files.

## Outside the MIT grant

| Material                                                                                           | Where to check                                                                                                      |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Medical explanations, patient-facing guidance, event narratives, and curated record collections    | `src/content/`, editorial portions of `src/data/`, `src/lib/patient/`, and other files containing these materials   |
| Research, clinical review records, approval statements, and historical decision snapshots          | `research/`, `docs/reviews/`, `docs/decisions/`, `docs/superpowers/`                                                |
| Videos, video thumbnails, photographs, illustrations, generated artwork, logos, and identity marks | [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), asset provenance records, and the original provider               |
| Dependencies and bundled fonts                                                                     | Each upstream package's license and notices                                                                         |
| Screenshots and demonstration recordings                                                           | The underlying interface, media, and content retain their respective rights; recording them does not relicense them |

These exclusions apply by material type, including when editorial records are stored as TypeScript literals or JSON. No new blanket license for the excluded editorial collection or assets is granted here. Individually licensed assets retain their stated license. Contact the maintainer through [sportsmedicine.tw/contact](https://sportsmedicine.tw/contact/) for reuse requests outside the software grant.

Public accessibility and embedding permission do not establish permission to download, redistribute, train models on, or commercially reuse third-party media. Review records certify only the specific content and version they identify. A fork or modified record must not claim the maintainer's clinical approval, endorsement, or affiliation.

## 中文說明

自有程式碼與開發文件採 MIT，保留授權與著作權聲明後可依該授權使用、修改與散布。醫療編輯內容、收錄資料集合、研究與審閱紀錄、影音、縮圖、照片、插畫、品牌識別及第三方套件不因此變成 MIT 素材。各素材原有授權仍適用；未標示開放授權者，不因放在 GitHub 就取得新的再利用許可。

本次只授權自有程式碼，沒有替醫療內容另訂 Creative Commons 授權。改作網站應使用自己的內容權利與審閱機制，不能沿用既有簽章宣稱新內容已獲核可。
