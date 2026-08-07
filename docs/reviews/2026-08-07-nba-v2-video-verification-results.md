# NBA v2 video verification results — 2026-08-07

Status: browser verification complete; verified partial evidence absorbed; no source-ready promotion.

## Outcome

- ACL: 7 source-ready, 16 needs-source; target 12 is short by 5.
- Achilles rupture: 7 source-ready, 11 needs-source; target 12 is short by 5.
- The primary-video `+0` through `+3 day` window was applied exactly as written.
- The unchanged event-source publication/identity gate prevented the strongest next-day leads from becoming source-ready.

## Evidence retained in ledgers

| Candidate          | Retained evidence                                                                                                                       | Blocking contract condition                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Kristaps Porzingis | Verified ESPN event clip, ESPN channel provenance, unavailable captions, external-link-only embed result, and first-party NBA diagnosis | Event source is next-day and its exact title contains no event date.                                              |
| Klay Thompson      | Verified NBA Watch event page, caption/external-link state, and first-party NBA diagnosis                                               | Event source is next-day and its exact title contains no event date.                                              |
| Jamal Murray       | Verified NBA Watch event page, caption/external-link state, and first-party NBA diagnosis                                               | Event source is next-day and its exact title contains no event date.                                              |
| Wesley Matthews    | Verified NBA Watch event page, caption/external-link state, and first-party Portland diagnosis of a ruptured left Achilles              | Event source is next-day and its exact title contains no event date; classic approval is also a later human gate. |

All four remain `needs-source`. Rejected, unavailable, analysis-only, or identity-conflicted leads were documented in the injury discovery logs but were not written into accepted source fields.

## Search coverage and residual ceiling

NBA.com's Videos search was run athlete-by-athlete across every remaining ACL and Achilles `needs-source` row. No additional page satisfied all of the original-event, full-athlete identity, publication-date, uploader, availability, and diagnosis requirements. J.J. Barea's same-day event page was the nearest new NBA Watch result, but its exact title lacks the full athlete identity. Donte DiVincenzo was not added because the video and team diagnosis disagree on Game 4 versus Game 3.

The practical next path is not another pass over the same video queue. It is a new-event scan concentrated on 2021 and later, requiring a policy-compliant full-identity event source as well as the primary video and first-party diagnosis. Any proposal to change the event-source gate should be handled separately from this evidence audit.

## Evidence handling

Every retained original source page was opened in the Browser. Search snippets were discovery aids only. No video, audio, screenshot, thumbnail, transcript, or article body was downloaded, copied, or stored. Research stopped at `source-ready`; `reviewed_by` and `source-verified` remain untouched.
