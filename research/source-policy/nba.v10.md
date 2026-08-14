# NBA source policy (`nba-v10`)

This immutable Decision 17 addendum is the append-only follow-up-reporting
successor to `nba-v9`. Its machine-readable companion is
`source-policy.v10.json`. It binds the exact predecessor bytes:

- `research/source-policy/nba.v9.md` — SHA-256
  `03f6a61ee6ef958cae2ae9b918d7b6a115ff0d346f63202efce8780744fbadf2`;
- `research/source-policy/source-policy.v9.json` — SHA-256
  `0ac3fecc04e12b88134ce97d11fbe1c742af1f21664a9c80eaf0d76ab7cfcfba`.

Historical policy versions remain byte-immutable. A correction to this
version requires `nba-v11`; `nba-v10`, `nba-v9`, and earlier versions are
never edited in place. This policy is a source-classification and pending-
draft contract. It sets `createsExecutionAuthorization=false` and does not
authorize any plan phase or approve any source, medical statement, review
decision, release, or service action. Only the separately owner-supplied,
strict Decision 17 execution authorization permits the bounded repository
work.

## Exact inherited policy

Every compatible `nba-v9` source-page, clinical/video, provider, privacy,
media-handling, player-photo, attribution, non-clearance, provenance,
fallback, and CC BY-SA composition control continues unchanged. Existing
case/source-manifest and video-provenance bindings remain on `nba-v2`; this
follow-up annex does not retag or stale them. The Decision 16 governed local-
rendition exception and the Decision 15 photo execution boundary also remain
byte-for-behavior unchanged.

The only inherited root-scope change is removal of
`medical-content-authoring` from `privacyAccessRules.closedScopes`, and only
for the exact Decision 17 pending follow-up authoring described below. This
does not open diagnosis, prognosis, rehabilitation, teaching, overview,
quarterly-update, prescriptive, or other medical content. It does not alter
the separate historical photo-policy boundary. All other inherited root
privacy/access fields and closed scopes remain unchanged.

## Exact execution boundary

The annex scope is `decision-17-case-filter-and-followup-notes-only`, further
restricted to `pending-follow-up-authoring-only`. It permits only sourced
drafts about the four controlled fact kinds in this annex. Research evidence
may reach at most `source-ready`; a new item may reach only
`pending-owner-signoff`. Neither state means source-reviewed, medically
approved, legally cleared, publicly releasable, or safe to index.

The following seven scopes remain closed:

1. `deployment`
2. `external-account-mutation`
3. `hosting-service-mutation`
4. `indexing`
5. `medical-review-decision`
6. `public-release`
7. `remote-repository-mutation`

Codex must not invent or reuse a reviewer identity, review time, owner
decision, approval digest, or medical signoff. Existing owner approval over
each unchanged clinical-core digest does not approve new follow-up text.
Every new item remains a separate draft pending physician signoff in the
editor.

## Source tiers

Each atomic item carries exactly one of these tokens and the corresponding
visible label:

| Token                     | Visible label      | Classification rule                                                                                                                     |
| ------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `team-or-league-official` | 球隊／聯盟官方公告 | A release or report directly controlled by the identified team or league; domain alone is insufficient without publisher identity.      |
| `mainstream-media-report` | 主流媒體報導       | A named mainstream outlet article, or an identifiable affiliated reporter article/post whose account and publisher facts are preserved. |
| `unverified-report`       | 未證實報導         | Another report, social post, anonymous claim, or claim not independently confirmed. It never appears visually as confirmed.             |

A reporter social post qualifies as `mainstream-media-report` only when the
named reporter/outlet affiliation is identifiable and preserved. Ambiguity
fails closed to `unverified-report`. Tier classification is a description of
the reporting source, not validation of medical correctness.

## Atomic item and source contract

The controlled fact kinds are exactly `treatment`, `surgery`, `injection`,
and `actual-return`. Each item represents one reported fact and carries its
own stable item ID, kind, short third-party-attributed factual paraphrase,
supported fact date when present, source tier, source title, publisher or
account, canonical HTTPS URL, source publication date, access date, medium,
exact `nba-v10` binding, payload digest, and independent pending-review
binding.

The payload digest covers all content and source fields but excludes review
metadata and the digest field itself, so it is never self-referential. Review
metadata is exactly
`{ status: "pending-owner-signoff", reviewedPayloadDigest: <item payload digest> }`.
It contains no reviewer identity, review timestamp, decision path, approval
digest, or free-form medical text. The aggregate sidecar digest is computed
externally and is never stored inside the sidecar or substituted for the
existing clinical-core approval digest.

Each item must be supported by its own opened original page. A paragraph-
level citation, one shared source list for several facts, search-result
snippet, source lacking a publication date, non-HTTPS target, or claim
assembled by inference from incomplete reports fails closed. Repeating an
item-level citation remains mandatory when multiple facts use the same page.
Treatment, surgery, and injection items record only the intervention and date
actually reported; they do not interpret appropriateness, efficacy,
causation, outcome, rehabilitation duration, prognosis, or return timing.

Every rendered follow-up block visibly states:

> 以下內容是第三方報導的整理，不是本站醫師的診斷、評估或建議。

Each item also visibly identifies the reporting third party, tier label,
title, publisher/account, publication date, and its own source target. Every
new item visibly remains “待醫師簽核”. The legacy approved diagnosis may be
projected only from the unchanged `general.confirmedUpdate` and one existing
source that explicitly supports it; that projection does not copy, rewrite,
or re-approve either record.

## Empty categories and no inference

All four category arrays are explicitly present. When no qualifying fact is
found, the corresponding array remains empty and the UI states exactly:

> 查無符合本政策且可逐條引用的紀錄；未據此推定未曾發生。

Empty means only that the bounded audit found no qualifying, individually
citable record. It never means the event did not occur. No placeholder,
likely treatment, typical operation, model-generated completion, unstated
surgery, unstated injection, rehabilitation duration, prognosis, estimated
date, or inferred return may fill an empty category.

## Strict retrospective actual return

An `actual-return` item is an already occurred historical participation fact,
never a projection. It requires an official team/league source documenting
actual participation and therefore accepts only the
`team-or-league-official` tier. Its supported occurrence date must already
have happened and must not be in the future. Neither
`mainstream-media-report` nor `unverified-report` can support
`actual-return`.

Expected, projected, target, recommended, forecast, estimated, or reusable
return fields and copy are forbidden. Every rendered actual-return section
expressly states:

> 實際回場紀錄只描述已發生的參賽事實，不是治療時長、預後、建議或可套用的回場時間表。

This retrospective record does not change the professional guidance that
treatment and return are individualized and are not a fixed return date.

## Source presentation and NBA zero-link rule

A valid non-NBA HTTPS target may render as a direct ordinary external source
link. An `nba.com` URL or subdomain URL renders only as its full literal,
non-navigable text. It must never become an anchor, redirect, iframe,
metadata target, JSON-LD URL, script target, client-side reconstructed link,
or any other navigation sink. The shared fail-closed NBA presentation rule
applies equally to legacy diagnosis projections and every new follow-up item.

## Release and review boundary

Pending follow-up drafts are review-build content only. Any public projection
must omit or reject them until a separately authorized owner decision binds
their exact digest. `medical-review-decision` remains closed; this policy
cannot create or apply one. Publication, deployment, indexing, hosting-
service mutation, external-account mutation, and remote-repository mutation
remain closed. `allowIndexing=false`, private access control, unauthorized-
request testing, all cover-byte protections, and the CC BY-SA composition
firewall remain mandatory.
