# Decision 15 Phase 2 supplemental photo search

- Checked: 2026-08-14
- Scope: `decision-15-photo-first-covers-only`
- Runtime: Node `v24.14.0`
- Mandatory Phase 1 input:
  `docs/reviews/2026-08-13-decision-15-p1-frozen-candidate-readjudication.md`
- Phase 1 SHA-256:
  `d2693d9dbba52d647cbad7759c86ab9891a21e4ac5e06d42b96032744606c26e`
- Phase 1 commit:
  `3a49507ae16f52a8113eee06322ac6319bca869b`
- Bound Phase 1 queue: `[]`
- Queue count: `0`
- Search-query count: `0`
- Captured-lead count: `0`
- Searched-athlete count: `0`
- Unsearched qualified-athlete count: `14`
- Result: **zero-row supplemental search; no search performed**
- Release state: private medical review; deployment, indexing, hosting-service
  mutation, external-account mutation, remote-repository mutation, and public
  release remain closed

Phase 1 independently qualified the frozen principal candidate for every one
of the 14 Decision 15 target slots. Decision 15 therefore requires Phase 2 to
freeze an empty supplemental-search result. This phase does not browse
Commons, Flickr, or any other external source, and it does not prefer or seek
an aesthetic replacement for a qualified Phase 1 candidate.

## Bound Phase 1 queue

The exact Phase 1 queue is:

```json
[]
```

The queue has zero athletes. No athlete is added because of occasion,
photographer identity, account control, self-publication, licensing-authority
uncertainty, washing signals, dispute history, or ambiguous court context;
those are removed v8 gates. No athlete lacks a retained v8 marker, fixed
source, original-binary, exact attribution/notice, mapping, or
different-injury-event fact.

## Exact supplemental query set

The predeclared instantiated Commons/Flickr query matrix is exactly:

```json
[]
```

Query count: `0`. With an empty roster, no Commons namespace query, web query,
Flickr query, work-page request, source observation, screenshot, thumbnail, or
original-file request was issued.

## Complete lead population

The complete Phase 2 returned-lead population is exactly:

```json
[]
```

Lead count: `0`. There are no Phase 2 work pages to adjudicate and therefore
no Phase 2 All Rights Reserved, missing/unknown/inconsistent, NC/ND,
wrong-work, same-injury-event, or binary-mismatch result. This is a zero-row
result caused only by the exact empty Phase 1 queue; it is not a claim that a
nonempty search returned no leads.

## Searched-athlete and selection result

| Measure                                 | Exact result |
| --------------------------------------- | -----------: |
| Phase 1 queue                           |            0 |
| Searched athletes                       |            0 |
| Instantiated queries                    |            0 |
| Captured leads                          |            0 |
| Plausible work pages opened             |            0 |
| Phase 2 candidate-adjudication rows     |            0 |
| Phase 2-selected replacement candidates |            0 |
| Phase 2 SVG outcomes                    |            0 |

No Phase 2 selection supersedes a Phase 1 result. Phase 3 must use exactly the
14 frozen candidates qualified in Phase 1, subject to its local-original,
retrieval-identity, MIME/dimension/byte, focal/crop, attribution, registry, and
composition checks.

## Exact unsearched roster

All 14 target athletes were deliberately unsearched because Phase 1 had
already frozen `qualified-from-frozen-evidence` for their exact principal
candidate:

| Athlete           | Phase 1 outcome                  | Frozen rights bucket                          | Phase 2 disposition                  |
| ----------------- | -------------------------------- | --------------------------------------------- | ------------------------------------ |
| Anfernee Simons   | `qualified-from-frozen-evidence` | CC BY-SA 4.0                                  | Unsearched; retain Phase 1 candidate |
| Anthony Edwards   | `qualified-from-frozen-evidence` | CC BY-SA 4.0                                  | Unsearched; retain Phase 1 candidate |
| Brandon Clarke    | `qualified-from-frozen-evidence` | CC BY 2.0                                     | Unsearched; retain Phase 1 candidate |
| Danny Green       | `qualified-from-frozen-evidence` | CC BY 2.0                                     | Unsearched; retain Phase 1 candidate |
| Dejounte Murray   | `qualified-from-frozen-evidence` | Public domain, exact `PD-USGov-Military-Navy` | Unsearched; retain Phase 1 candidate |
| Ja Morant         | `qualified-from-frozen-evidence` | CC BY 2.0                                     | Unsearched; retain Phase 1 candidate |
| Joe Ingles        | `qualified-from-frozen-evidence` | CC BY-SA 4.0                                  | Unsearched; retain Phase 1 candidate |
| LaMelo Ball       | `qualified-from-frozen-evidence` | CC BY 2.0                                     | Unsearched; retain Phase 1 candidate |
| Markelle Fultz    | `qualified-from-frozen-evidence` | CC BY-SA 2.0                                  | Unsearched; retain Phase 1 candidate |
| Moritz Wagner     | `qualified-from-frozen-evidence` | CC BY-SA 4.0                                  | Unsearched; retain Phase 1 candidate |
| Ricky Rubio       | `qualified-from-frozen-evidence` | CC BY 2.0                                     | Unsearched; retain Phase 1 candidate |
| Thomas Bryant     | `qualified-from-frozen-evidence` | CC BY-SA 4.0                                  | Unsearched; retain Phase 1 candidate |
| Trae Young        | `qualified-from-frozen-evidence` | CC BY 2.0                                     | Unsearched; retain Phase 1 candidate |
| Tyrese Haliburton | `qualified-from-frozen-evidence` | CC BY-SA 4.0                                  | Unsearched; retain Phase 1 candidate |

Unsearched count: `14`; qualified count: `14`; mismatch count: `0`.

## Rights partition and BY-SA composition firewall

Because Phase 2 adds no candidate, the Phase 1 partition is preserved exactly:

| Rights bucket | Athletes                                                                                      | Count | Mandatory treatment                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------- | ----: | ----------------------------------------------------------------------------------------------------------------- |
| CC BY 2.0     | Brandon Clarke; Danny Green; Ja Morant; LaMelo Ball; Ricky Rubio; Trae Young                  |     6 | Preserve exact credit/title/notices and disclose changes; no Adapter's License                                    |
| CC BY-SA 4.0  | Anfernee Simons; Anthony Edwards; Joe Ingles; Moritz Wagner; Thomas Bryant; Tyrese Haliburton |     6 | Placement/rendition-only; same-version crop-only Adapter's License; barred from baked compositions                |
| CC BY-SA 2.0  | Markelle Fultz                                                                                |     1 | Placement/rendition-only; same-version crop-only Adapter's License; barred from baked compositions                |
| Public domain | Dejounte Murray                                                                               |     1 | Preserve the exact Navy/US-government marker, source, credit, and notices; do not call it CC0 or invent a version |

All seven CC BY-SA works remain **placement/rendition-only**. Anfernee Simons,
Anthony Edwards, Joe Ingles, Markelle Fultz, Moritz Wagner, Thomas Bryant, and
Tyrese Haliburton may be used only as ordinary HTML/CSS image placement and
responsive rendition. They remain mechanically barred from site-composed
OG/social images, case-card composites, infographics, and every equivalent
baked design input. Each linked Adapter's License must match the exact BY-SA
version and cover only the site's crop contribution, never surrounding site
content.

## Owner-accepted residual risks and non-clearance boundary

Decision 15 retains the owner's informed acceptance of these exact three
unresolved residual risks:

1. **持證攝影記者授權自始無效的風險（Flickr-washing）**：持證記者與聯盟或媒體有契約，
   若無權授權，其標示的 CC 授權自始無效，下游使用者不因善意而免責
2. **封閉練習場地規範風險**：封閉練習照片可能違反球隊或場地的拍攝規範
3. **授權人身分無法追溯的風險**：帳號持有者未必是拍攝者，連授權人是誰都無法主張

This is informed acceptance of unresolved residual risk. It is not a finding
that any marker was validly applied, that the displayed account or credited
person owned the work or had licensing authority, or that downstream good
faith provides a defense.

CC addresses copyright permissions, and the public-domain marker addresses
copyright status. Neither provides personality, portrait, publicity, privacy,
endorsement, venue, league, team, contractual, medical, legal-use, or
public-release clearance. The Anthony Edwards and Moritz Wagner per-file
personality warnings remain explicit, and the same personality-rights
non-clearance applies to every selected photo whether or not Commons displays
a per-file warning.

## Phase boundary and negative proof

Phase 2 freezes only the empty query set, empty lead population, zero-row
search result, exact unsearched roster, and unchanged Phase 1 selection and
rights partition. It downloads or adopts no image and changes no registry,
existing photo, SVG, cover, resolver, product, review set, private manifest,
`dist`, service, policy, plan, authorization, clinical file, medical-review
decision, or release state. The seven current photo selections and their
assets remain protected inputs, and the 30-file clinical freeze remains
byte-identical.

No deployment, indexing, hosting-service mutation, listener/restart/reload,
credential change, external-account mutation, remote-repository mutation,
push, or public release occurred.
