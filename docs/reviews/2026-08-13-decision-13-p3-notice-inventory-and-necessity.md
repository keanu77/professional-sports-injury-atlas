# Decision 13 Phase 3 Notice Inventory and Necessity Matrix

Date: 2026-08-13

Phase product-byte input commit: `d625989de94969ecb9c248038fb00e0890f1f51b`

Intervening validation-only commit: `2398deb9cae84ecf3ea28769eb93cb1da29145d3`

Execution scope: `decision-13-named-covers-and-notice-consolidation-only`

## Result and gate status

The before-state inventory and reproducible evidence capture are complete. The current review build has 41 HTML routes: 36 public-content templates and five review-only routes. Every selected statement-like sink is mapped one-to-one to a machine occurrence, a unique normalized-text definition, a source binding, a route and DOM location, a build mode, and a necessity class. No license-required or other required field is proposed for deletion. Every `redundant-or-editorial` definition is bound either to its unchanged same-route location or to an explicit surviving canonical location.

吳易澄醫師以本站 owner、執業復健科醫師身分於 `2026-08-13T10:28:18Z` 具名核定完整的 bounded owner/legal disposition，並明確綁定 product-byte input commit `d625989de94969ecb9c248038fb00e0890f1f51b`。核定只涵蓋 notice treatment，不開啟一般 `medical-review-decision` scope，也不授權改寫任何核准臨床內容。重跑 fail-closed machine gate 後：**Phase 3 accepted；Phase 4 unblocked**。Machine inventory 記錄：

- `ownerLegalDisposition.status = confirmed`;
- `dispositionGate.implementationAuthorized = true`;
- `dispositionGate.phase3AcceptanceComplete = true`;
- `dispositionGate.phase4Blocked = false`.

This report records the supplied disposition and releases only the Phase 3 implementation gate. It does not independently make a medical or legal decision, change approved clinical wording, or alter a product byte. The separate append-only photo-policy correction that established the product-byte input is recorded in `2026-08-13-decision-13-photo-policy-forward-correction.md`. During final validation, commit `2398deb9cae84ecf3ea28769eb93cb1da29145d3` corrected only stale Playwright expectations to consume current registry v5; it changed no source, public asset, package, build, clinical, policy, registry, or evidence byte. The generator deliberately continues to bind the exact product-byte input above while requiring it to remain an ancestor and rejecting drift in every build input.

## Reproducible evidence set

The canonical machine inventory is [`evidence/decision-13/notices-before/notice-inventory.v1.json`](evidence/decision-13/notices-before/notice-inventory.v1.json), SHA-256 `b9e203b9320155712a9cc6222ec74264e3702513613277b649715caa585ffcd0`. It contains the full 41-route ledger, all 450 review-build file hashes, 274 definitions, 1,273 logical occurrence rows, source bindings, exact normalized text and hashes, links, true landmarks, nearest semantic containers, ancestor-aware visibility/clipping results, family-specific consumption-point criteria, viewport behavior, classifications, the governed 30-file clinical ledger, authority references, gaps, and the complete confirmed owner/legal disposition.

The evidence manifest is [`evidence/decision-13/notices-before/evidence-manifest.v1.json`](evidence/decision-13/notices-before/evidence-manifest.v1.json), SHA-256 `b466192bafbd4e8c31772bb03ba4a621d06e599a3c191ba7b618776294da0a2c`. It binds 92 evidence files totaling 11,160,536 bytes. The runtime-state record is [`evidence/decision-13/notices-before/runtime/runtime-states.v1.json`](evidence/decision-13/notices-before/runtime/runtime-states.v1.json), SHA-256 `e457ea29db8d0743418d6e348f374cae320156306365039b6de503b826f3144c`.

The generator is `scripts/generate-decision-13-notice-before-evidence.ts`. It fails closed unless:

- Node is exactly `v24.14.0`;
- corrective input commit `d625989de94969ecb9c248038fb00e0890f1f51b` is an ancestor;
- `src/`, `public/`, `astro.config.mjs`, `package.json`, and `package-lock.json` have no drift from that commit;
- the existing review build has exactly 41 unique routes;
- the exact pre-Phase-3 review-build aggregate is `cd8c82377f4e7658522fa268319cc2b4a9789201e0e828940ea7fce157646171`;
- expected family counts and desktop/mobile notice-text shape parity hold, with every visibility delta separately recorded;
- no initial or no-JavaScript capture attempts any third-party request, and no runtime external request completes;
- no-JavaScript notices and complete static fallback listings satisfy the contract at both fixed viewports on the four filter routes;
- filter success/more/reset/failure and video failure satisfy the full structure, visibility, link, focus, and fallback contract at both fixed viewports;
- occurrence IDs are unique and every redundant definition has a surviving location.

Three complete consecutive regenerations produced identical SHA-256 ledgers for all 93 files in the evidence directory, including the manifest. Local links are origin-normalized, web fonts are settled before capture, service workers are blocked, and the controlled video fixture deterministically aborts both expected third-party requests so ephemeral localhost ports or request races cannot enter the evidence.

The final validation-only browser correction is documented in `2026-08-13-decision-13-p2-playwright-forward-correction.md`. After that correction, the complete Playwright suite passed 196/196 across Chromium, Firefox, WebKit, and mobile Chromium; the preceding complete coverage run passed 917/917 unit tests.

## Review-build identity and route coverage

| Measure                   |                                                             Result |
| ------------------------- | -----------------------------------------------------------------: |
| Build mode                |                                                           `review` |
| Node                      |                                                         `v24.14.0` |
| HTML routes               |                                                                 41 |
| Public-content templates  |                                                                 36 |
| Review-only routes        |                                                                  5 |
| HTML bytes                |                                                          2,126,816 |
| All build files           |                                                                450 |
| Build-file ledger SHA-256 | `cd8c82377f4e7658522fa268319cc2b4a9789201e0e828940ea7fce157646171` |
| Canonical links           |                                                                  0 |
| JSON-LD blocks            |                                                                  0 |

Route classes are one home route, one About route, one source-policy route, three league listings, three injury listings/overviews, 26 case details, one quarterly update, four review fixtures, and one component lab. Each route's exact built HTML SHA-256 and byte length is recorded in `routeInventory`; the 41 desktop, 41 mobile, four desktop no-JavaScript, and four mobile no-JavaScript semantic snapshots are under `evidence/decision-13/notices-before/dom/`.

## Inventory cardinality

The inventory hash rule is NFC normalization, consecutive-whitespace collapse to one space, trim, then SHA-256 over UTF-8. Exact raw text and exact `outerHTML` remain in the per-route snapshots; normalized text and its digest are in each definition.

| Necessity class                 | Unique definitions | Rendered occurrences |
| ------------------------------- | -----------------: | -------------------: |
| `license-required`              |                  5 |                   46 |
| `medical-legal-review-required` |                  3 |                   83 |
| `evidence-or-policy-required`   |                227 |                1,073 |
| `redundant-or-editorial`        |                 39 |                   71 |
| **Total**                       |            **274** |            **1,273** |

The 1,273 logical occurrences comprise 1,263 initial JavaScript-enabled rows, four distinct no-JavaScript degradation rows, and six distinct runtime notice states. Mobile observations of those same logical rows are linked through `viewportObservations`/`viewportBehavior` rather than double-counted as new content occurrences. The six runtime rows are filter success, initial “show more,” post-activation “show more,” reset, controlled index failure, and controlled video-load failure.

## Complete necessity matrix by sink family

The machine inventory is the row-level source of truth. This human matrix summarizes every family without dropping its per-definition distinctions. CSS visibility, initial viewport intersection, and family-specific consumption-point satisfaction are separate facts. In particular, a visible footer is not treated as a clinical main-content consumption point. Metadata and intentionally dormant failure states are recorded but are not falsely labeled visual.

| Family                                 | Class                                              | Definitions | Occurrences / routes | Current disposition or surviving location                                          |
| -------------------------------------- | -------------------------------------------------- | ----------: | -------------------: | ---------------------------------------------------------------------------------- |
| `about-medical-purpose`                | medical/legal                                      |           1 |                1 / 1 | Preserve exactly; About receives no added consumption-point notice                 |
| `footer-medical-short`                 | medical/legal                                      |           1 |              41 / 41 | Replace with the exact approved sentence                                           |
| `footer-medical-long`                  | medical/legal                                      |           1 |              41 / 41 | Canonicalize into the one approved footer sentence                                 |
| `licensed-photo-attribution`           | license + policy compound                          |           5 |              46 / 27 | Retain every asset-specific CC field; policy segment remains separately identified |
| `original-svg-cover-clarification`     | evidence/policy                                    |           1 |             138 / 31 | Retain original-artwork and non-event clarification                                |
| `footer-independent-site`              | evidence/policy                                    |           1 |              41 / 41 | Retain independence/non-affiliation fact                                           |
| `footer-source-rights-posture`         | evidence/policy                                    |           1 |              41 / 41 | Retain source-link/rights-review boundary                                          |
| `footer-site-copyright`                | evidence/policy                                    |           1 |              41 / 41 | No deletion proposed                                                               |
| `review-robots-meta`                   | evidence/policy                                    |           1 |              41 / 41 | Retain fail-closed review noindex metadata                                         |
| `review-artifact-identity-meta`        | evidence/policy                                    |          41 |              41 / 41 | Retain per-route review-artifact identity                                          |
| `review-banner`                        | evidence/policy                                    |           1 |              41 / 41 | Retain review/no-redistribution/no-index warning; review-only                      |
| `review-workflow-state`                | evidence/policy                                    |           2 |             163 / 34 | Retain internal workflow/diagnosis distinction; review-only                        |
| `review-digest-panel`                  | evidence/policy                                    |          28 |              29 / 29 | Retain review identifiers/digests; review-only                                     |
| `review-fixture-marker`                | evidence/policy                                    |           1 |                4 / 4 | Retain fictional/review-only marker                                                |
| `component-lab-fictional-marker`       | evidence/policy                                    |           1 |                1 / 1 | Retain fictional/review-only marker                                                |
| `case-card-diagnosis-confirmation`     | evidence/policy                                    |           1 |             136 / 34 | Retain external-source confirmation state                                          |
| `case-diagnosis-confirmation`          | evidence/policy; governed values on content routes |          18 |              27 / 27 | 26 governed content occurrences retained; one fictional fixture is non-governed    |
| `observed-mechanism-not-diagnosis`     | evidence/policy; governed values on content routes |           2 |              27 / 27 | 26 governed content occurrences retained; one fictional fixture is non-governed    |
| `home-observation-diagnosis-boundary`  | evidence/policy                                    |           1 |                1 / 1 | Retain homepage teaching/source boundary                                           |
| `external-source-citation`             | evidence/policy                                    |          89 |             136 / 28 | Retain per-source citation and NBA plain-text distinction                          |
| `video-caption-status`                 | evidence/policy                                    |           3 |              33 / 28 | Retain source caption status                                                       |
| `video-caption-warning`                | evidence/policy                                    |           3 |              27 / 23 | Retain accessibility degradation warning                                           |
| `video-region-warning`                 | evidence/policy                                    |           1 |                1 / 1 | Retain playback/no-embed warning                                                   |
| `video-region-fallback`                | evidence/policy                                    |           1 |                1 / 1 | Retain adjacent fallback                                                           |
| `video-review-state`                   | evidence/policy                                    |           6 |              31 / 28 | Retain review-only machine state                                                   |
| `video-load-failure`                   | evidence/policy                                    |           1 |               10 / 9 | Initially hidden; controlled failure proves visible fallback                       |
| `video-unavailable`                    | evidence/policy                                    |           1 |                1 / 1 | Retain unavailable-source fallback                                                 |
| `video-privacy-connection-notice`      | evidence/policy                                    |           1 |               10 / 9 | Must remain visible before connection; current mobile CSS gap recorded             |
| `video-plain-citation-facade`          | evidence/policy                                    |           1 |              20 / 20 | Retain reason for non-clickable NBA citation                                       |
| `video-source-link`                    | evidence/policy                                    |           3 |              12 / 10 | Retain explicit external-source action                                             |
| `filter-no-javascript-degradation`     | evidence/policy                                    |           1 |                4 / 4 | Retain; proved with complete static fallback at both viewports                     |
| `runtime-filter-success`               | evidence/policy                                    |           1 |                1 / 1 | Retain live-region result count; both viewports proved                             |
| `runtime-filter-more-initial`          | evidence/policy                                    |           1 |                1 / 1 | Retain 12/26 progressive-result status; both viewports proved                      |
| `runtime-filter-more-after-activation` | evidence/policy                                    |           1 |                1 / 1 | Retain 24/26 progressive-result status; both viewports proved                      |
| `runtime-filter-reset`                 | evidence/policy                                    |           1 |                1 / 1 | Retain reset/static-fallback status; both viewports proved                         |
| `runtime-filter-index-failure`         | evidence/policy                                    |           1 |                1 / 1 | Retain failure plus complete static fallback; both viewports proved                |
| `runtime-video-load-failure`           | evidence/policy                                    |           1 |                1 / 1 | Retain visible failure/facade/source/timeline fallback; both viewports proved      |
| `about-policy-section`                 | evidence/policy                                    |           3 |                3 / 1 | Retain workflow/layer/noindex distinctions                                         |
| `source-policy-section`                | evidence/policy                                    |           6 |                6 / 1 | Retain; reader-facing photo paragraph must later match governed v6/v5 facts        |
| `page-description-meta`                | redundant/editorial                                |          35 |              41 / 41 | Retain unchanged at same-route `meta[name="description"]`                          |
| `injury-page-scope`                    | redundant/editorial                                |           3 |                3 / 3 | Retain unchanged at same-route `[data-injury-scope]`                               |
| `layer-switch-explainer`               | redundant/editorial                                |           1 |              27 / 27 | Candidate only after the fact survives at `/about/#layers-heading`                 |

There are no uncategorized selected sinks. The classification is a necessity analysis, not an instruction to delete a row. In particular, `redundant-or-editorial` means eligible for later consolidation only after its mapped fact is proven to survive.

## License-required row

Five current photo definitions render 46 times on 27 routes. Each definition contains a field-level `attributionSegments` ledger rather than treating the whole caption as one generic legal obligation. Creator, exact license/version, fixed source URI, and change indication are `license-required`; an upstream-supplied title and upstream-supplied copyright/disclaimer notices are retain-if-supplied license fields; a compatible Adapter's License applies only to a BY-SA crop. The explicit `not-supplied` title state, personality/other source warnings, and non-event occasion/risk explanation are `evidence-or-policy-required`. This distinction prevents both deletion of required facts and overstatement of what a CC license itself mandates.

| Athlete/photo identity                       | License bucket            | Title state    | Adapter's License | Occurrences |
| -------------------------------------------- | ------------------------- | -------------- | ----------------- | ----------: |
| Kyrie Irving / Erik Drost                    | CC BY 2.0 / `cc-by`       | supplied       | not applicable    |          15 |
| LeBron James / David Shankbone               | CC BY 3.0 / `cc-by`       | `not-supplied` | not applicable    |           4 |
| Dwight Powell / Sandro Halank                | CC BY-SA 4.0 / `cc-by-sa` | supplied       | CC BY-SA 4.0      |           4 |
| C.J. McCollum / All-Pro Reels (Joe Glorioso) | CC BY-SA 4.0 / `cc-by-sa` | supplied       | CC BY-SA 4.0      |           4 |
| Kevin Durant / Hameltion                     | CC BY-SA 4.0 / `cc-by-sa` | `not-supplied` | CC BY-SA 4.0      |          19 |

Current inline rendering suppresses the explicit `not-supplied` title status for Kevin Durant and LeBron James even though registry v5 retains that structured fact. Surfacing those two states is a Decision 13 provenance-policy requirement, not a claim that BY 3.0 or BY-SA 4.0 universally requires a missing title to be announced. Phase 4, if later authorized by the required disposition, must visibly surface those states in the central credits/notices route without inventing a title. The three BY-SA photos may continue only as ordinary HTML/CSS image placements and ordinary format/resizing outputs; they remain mechanically excluded from site-composed OG, social, case-card, infographic, or other baked raster compositions.

The controlling Creative Commons legal-code references checked on 2026-08-13 are:

- CC BY 2.0: <https://creativecommons.org/licenses/by/2.0/legalcode.en>;
- CC BY 3.0: <https://creativecommons.org/licenses/by/3.0/legalcode.en>;
- CC BY-SA 4.0: <https://creativecommons.org/licenses/by-sa/4.0/legalcode.en>.

The classification preserves every applicable title, creator, source, license, change, notice, and ShareAlike/Adapter's License fact, while retaining explicit unknown/not-supplied policy state separately. It does not infer that the phrase “educational use” grants copyright permission. Educational purpose is only a purpose description and cannot replace CC compliance, other rights review, or medical/legal review.

## Confirmed medical/legal disposition

The current build has three exact medical-purpose strings and 83 occurrences:

| Source                                      | Exact normalized text                                                                                                                                                  | SHA-256                                                            | Occurrences |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------: |
| `src/pages/about.astro:14-18`               | `職業運動傷害影片圖鑑以公開比賽影片的觀察為基礎，整理職業運動常見傷害的 教學案例。本站是教學資源，不是醫療建議；任何傷害的診斷與處置都需要具 資格的臨床專業人員評估。` | `c2246582cf82c2cb7f419bd79d4cef44dc1556d6136da1336f9e107315c0645d` |           1 |
| `src/components/layout/SiteFooter.astro:48` | `本站內容僅供教育參考，不構成醫療建議。`                                                                                                                               | `27ff0c9909e3969bc3e7dc9256144efa9f5715d98a6521e81c9b982de1726f86` |          41 |
| `src/components/layout/SiteFooter.astro:50` | `本站為教學用途之衛教內容，不構成醫療建議，亦不能取代醫師診察`                                                                                                         | `6401c9055553fdc59598c4fd4bfce0e055fd5eae580f93cd3939077cf01b5831` |          41 |

All three are CSS-visible on desktop and mobile and have no ancestor, horizontal, or vertical clipping. The About string is in main content and initially in view, so it satisfies the inventory's `clinical-main-content` criterion on its one route. Both footer strings are present on all 41 routes but are outside main content and below the initial 1440×900 and 390×844 viewport on every route; therefore each records 0/41 consumption-point criterion satisfaction. This is a current-state measurement, not a legal or clinical sufficiency conclusion.

The official Taiwan Ministry of Justice Laws & Regulations Database was checked on 2026-08-13. The current Physicians Act page reports amendment date 2022-06-22 and database compilation cutoff 2026-08-07. Article 25's exact normalized text and SHA-256 `7f3b73daf2bec4b1cf76158999cb1d7eb75bf4f29e37b2eedda9bf7e58a30b78` are recorded in the machine inventory. The surrounding official HTML contains dynamic counters, so response bytes are deliberately not presented as a reproducible authority invariant; URL, check date, official metadata, normalized statutory text, and its digest are the durable evidence fields.

- Official Article 25: <https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=L0020001&flno=25>
- Official Article 11: <https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=L0020001&flno=11>
- Full Physicians Act: <https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=L0020001>

Engineering observation only: Article 25 enumerates physician disciplinary-referral grounds; it does not specify website-disclaimer wording, placement, or sufficiency. Engineering did not infer those conclusions. The named owner/legal disposition below supplies the bounded applicability, wording, minimum-clause, and placement decision.

## Recorded owner/legal disposition fields

The following owner/legal disposition is recorded field-for-field in the canonical machine inventory and tied to corrective input commit `d625989de94969ecb9c248038fb00e0890f1f51b`:

| Field                                               | Recorded value                                                                                                                                                                                                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `confirmedBy`                                       | 吳易澄醫師（本站 owner、執業復健科醫師，具名核定）                                                                                                                                                                                                   |
| `confirmedAtUtc`                                    | `2026-08-13T10:28:18Z`                                                                                                                                                                                                                               |
| `reviewedCommitSha`                                 | `d625989de94969ecb9c248038fb00e0890f1f51b`                                                                                                                                                                                                           |
| `exactZhHantText`                                   | 本站為教學用途的衛教內容，不構成醫療建議，也無法取代醫師診察。症狀持續或惡化請就醫。                                                                                                                                                                 |
| `minimumVisibleClauses`                             | 1) 教學用途 2) 不構成醫療建議 3) 無法取代醫師診察 4) 症狀持續或惡化請就醫（即核定文字整句可見；不得拆刪任一子句）                                                                                                                                    |
| `placement`                                         | 消費點＋footer——26 個案例頁、3 個傷種總覽、季度更新頁：臨床內容開頭放單行 compact notice（初始 viewport 內可見，桌機與 390px 手機皆然）；全站 footer 保留核定文字單一句；完整授權與說明集中到 central credits/notices 專頁，內容頁以一行連結指過去。 |
| `existingStringDisposition.aboutStatement`          | preserve（About 主文說明保留原字，不改）                                                                                                                                                                                                             |
| `existingStringDisposition.footerShort`             | replace——由核定文字取代                                                                                                                                                                                                                              |
| `existingStringDisposition.footerLong`              | canonicalize——刪除，與 footerShort 合併為核定文字單一句（消除 41 路由的相鄰重複）                                                                                                                                                                    |
| `routeClassDisposition.about`                       | 保留主文說明＋footer 核定句；不另加消費點聲明                                                                                                                                                                                                        |
| `routeClassDisposition.home`                        | footer 核定句即可，不加消費點聲明                                                                                                                                                                                                                    |
| `routeClassDisposition.leagueListings`              | footer 核定句即可，不加消費點聲明                                                                                                                                                                                                                    |
| `routeClassDisposition.caseDetail26`                | 消費點 compact notice＋footer 核定句                                                                                                                                                                                                                 |
| `routeClassDisposition.injuryOverview3`             | 同案例頁處理                                                                                                                                                                                                                                         |
| `routeClassDisposition.quarterlyUpdate`             | 同案例頁處理                                                                                                                                                                                                                                         |
| `routeClassDisposition.reviewFixtures`              | 維持 fixture 現狀，不納入（非核准臨床內容）                                                                                                                                                                                                          |
| `legalAuthorityRelationship.physiciansActArticle25` | 適用為風險脈絡。本站維持教學觀察定位，不對未親自診察之個人作診斷或處置建議；醫療聲明於內容消費點可見，明示教學用途與不取代醫師診察。                                                                                                                 |
| `legalAuthorityRelationship.physiciansActArticle11` | 本站不對個人提供診療，不直接適用；其親自診察原則支持本站不做遠距個別診斷之立場。                                                                                                                                                                     |
| `legalAuthorityRelationship.additionalAuthorities`  | 醫療法第 85、86 條（醫療廣告規範）列為備註——本站為非商業教學衛教內容，不涉醫療業務招徠；此外無其他適用法源。                                                                                                                                         |

This confirmation is limited to notice treatment. It cannot rewrite case, overview, update, diagnosis, observation, management, or return-to-play prose and is not authority to open the closed `medical-review-decision` scope generally.

## Responsive, no-JavaScript, and runtime findings

Semantic DOM snapshots were captured at 1440×900 and 390×844 for all 41 routes. Notice text/identity shape is equal across viewports; all 44 viewport visibility deltas are recorded rather than hidden under a generic “parity” result. True ARIA/native landmarks and nearest semantic containers are separate fields. Ancestor `hidden`/`aria-hidden`/`inert`/display/visibility/opacity, ancestor clipping, viewport intersection, and element geometry are evaluated independently. There is no page-level horizontal overflow and no matched visible element is horizontally or vertically clipped.

- Desktop: 1,263 selected sinks; 1,130 CSS-visible; 197 initially in viewport.
- Mobile: 1,263 selected sinks; 1,120 CSS-visible; 161 initially in viewport.
- The 123 nonvisual metadata sinks per viewport are the robots, artifact-identity, and description meta tags.
- Ten video-failure notices are intentionally hidden until failure; the controlled runtime fixture proves the notice becomes visible.
- The ten YouTube connection notices are visible on desktop but CSS-hidden at 390px. Their disclosure must be preserved visibly in any later implementation.
- Four JavaScript-disabled routes at both viewports each show exactly one degradation notice, keep the complete static listing visible (Achilles 7, ACL 7, ankle 12, NBA 12 cards), keep dynamic results/status hidden, and record the still-visible but non-operational controls.
- Filter initial/success, “show more” 12/26→24/26, reset, and controlled index-failure states were captured at both viewports. Assertions cover static/dynamic listing exchange, result counts, live-region text, and failure fallback.
- Controlled video failure was captured at both viewports. The iframe is removed, local facade and failure message are restored, focus returns to the load button, and the source/timeline links remain present and usable.
- Initial desktop, mobile, and both no-JavaScript captures completed with zero third-party attempts. Each runtime viewport deterministically attempted and aborted the expected `youtube-nocookie.com` iframe and YouTube IFrame API requests; completed and unaccounted external requests remained zero.

Representative screenshots were optional and were not retained. Semantic DOM, exact HTML/text hashes, normalized link targets, bounding boxes, true landmarks, semantic containers, ancestor-aware visibility/clipping, runtime structures, and network results provide the reproducible comparison set without reproducing third-party imagery.

The caption-policy classification references WCAG 2.2 SC 1.2.2 guidance checked on 2026-08-13: <https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html>.

## Frozen clinical-content boundary

The inventory explicitly excludes four approved content families from notice editing:

| Frozen family             | Instances |
| ------------------------- | --------: |
| General-reader case notes |        26 |
| Professional case notes   |        26 |
| Injury overview content   |         3 |
| Quarterly-update content  |         1 |

The byte authority is the exact 30-file governed JSON ledger—26 cases, three injury overviews, and one quarterly update—with aggregate SHA-256 `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`. Presentation shells are editable only for later notice placement; governed clinical strings remain immutable. Case-confirmation and observed-mechanism sinks are governed on the 26 content routes, while their one fictional review-fixture occurrence is explicitly non-governed. Review fixtures are never counted as approved clinical content.

## Duplication and policy gaps

Four concrete gaps are frozen for a later authorized implementation:

1. `src/pages/source-policy.astro:52-57` describes only Commons court photos, generic public-domain material, and an injury-theme fallback. That reader-facing paragraph is stale against source policy v6 and registry v5, which govern qualified non-event CC photos and original SVG fallbacks. The underlying v5/v4 lineage contradiction discovered during audit was separately corrected forward without changing its historical bytes.
2. Kevin Durant and LeBron James have `workTitle.status = not-supplied` in registry v5, but the current inline renderer suppresses that policy state. A future central credits row must surface it without inventing a title.
3. The two footer medical-purpose strings repeat adjacently on all 41 routes and remain footer-only at clinical consumption routes. Their consolidation, exact surviving text, and placement require the named disposition above.
4. The YouTube connection notice exists but is CSS-hidden at the 390px viewport. Any later density reduction must preserve this disclosure visibly before activation.

No Phase 4 fix is implemented in this Phase 3 commit. The disposition now decides that the exact approved sentence appears at the 30 clinical consumption points and once in the footer, while complete authorization and explanatory material is consolidated on the central credits/notices route. Phase 4 must implement that matrix without changing frozen clinical prose.

## Closed-scope and negative assertions

During Phase 3 inventory work:

- no repository remote was mutated and nothing was pushed;
- no deployment, public release, or indexing action occurred;
- no external account or hosting configuration was changed;
- no private review service was restarted;
- no medical content was authored and no medical-review decision was made;
- no product source, approved clinical content, bound plan, authorization JSON, or previously bound governance document was edited;
- no license-required statement or field was deleted;
- Phase 4 consolidation did not begin.

The bounded named owner/legal disposition is complete, the regenerated machine gate reports **Phase 3 accepted** and **Phase 4 unblocked**, and the next permissible action is Phase 4 implementation exactly within that approved matrix.
