# Final read-only event-updates.v1.json source audit

Checked 2026-09-06 after the implementation reached 19 entries (14 existing + 5 new; Nadal intentionally excluded).

No additional injury or return-date factual corrections found. Nineteen unique slugs and nineteen unique video URLs. Video bindings compared against additions.v1.json, expansion.v1.json and original cases.

## Required citation completion

- Simons context says March 10 was the second return, but its three current sources end March 3. Add the March 10 NBA game record https://www.nba.com/game/por-vs-phi-0022200998 . The NBA syndicated recap explicitly describes his absence before this game; the March 1 official gamebook remains the first-return evidence.
- Durant context mentions December 13 preseason, absent from its two linked sources. Add the primary team recap https://www.nba.com/nets/news/recap/2020/12/13/nets-119-wizards-114-kevin-durant-kyrie-irving-sharp-in-preseason-opener . Search retrieval gives December 13, 2020 10:06 PM EST and explicitly identifies the preseason return.

## Publication-date uncertainty

- Kyrie injury page now displays Updated September 21, 2022; Giannis injury page now displays Updated September 22, 2022. Their current publishedAt values June 13 and June 30, 2021 were not independently recovered as original page metadata. Embedded team tweet dates do not establish publication. Set null unless original metadata was independently obtained. Do not replace publication with updated dates without clarifying semantics.
- Fultz return article was already changed to publishedAt null in the final read, correctly avoiding March 1 inferred from the embedded tweet.
- LaMelo 2025 team URL hornets-injury-update-9 could not be parsed beyond an iframe. This is unresolved retrieval, not evidence of an invalid source or a false January 29 EST date. If the implementation has no separately retained page evidence, use https://www.nba.com/news/hornets-lamelo-ball-injury-update with publishedAt 2025-01-30, explicitly displayed 04:51. The official release supports MRI-confirmed left ankle sprain.

## Already resolved

- Zverev now has the AP June 7, 2022 report directly supporting his own account of three torn lateral ankle ligaments and surgery; no further change needed.
- The 19 injury/return narratives preserve uncertainty for Foucher, unnamed athletes and retirement cases, and correctly distinguish formal competition, preseason and playing while injured.

No repository source files were edited by this audit.
