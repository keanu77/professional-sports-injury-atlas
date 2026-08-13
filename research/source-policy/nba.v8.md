# NBA source policy (`nba-v8`)

This immutable Decision 15 addendum is the append-only photo-first successor
to `nba-v7`. Its machine-readable companion is `source-policy.v8.json`. It
binds the exact predecessor bytes:

- `research/source-policy/nba.v7.md` — SHA-256
  `61ed88f92d80b77cd2c1410d03305215eedbb391356c073fb19fac944dea2fd1`;
- `research/source-policy/source-policy.v7.json` — SHA-256
  `d1062c1ffa045397d13489319534acbfe24653615df5ce83aac40e40539a8b15`.

Historical policy versions remain byte-immutable. A correction to this
version requires `nba-v9`; `nba-v8` is never edited in place. This policy
defines the future eligibility contract only. It does not authorize any plan
phase, registry promotion, asset download or adoption, cover generation,
artifact build, publication, deployment, indexing, hosting-service mutation,
external-account mutation, remote-repository mutation, medical-content
change, or medical-review decision.

## Decision 15 governing rule

吳易澄醫師在 Decision 14 收尾並檢視逐格否決理由後，決定放寬封面照片
標準，改以球員照片為主。只要 Wikimedia Commons 或 Flickr 的來源頁面
對該作品掛有明示、可精確記錄的既有支援 Creative Commons 授權標示，
或明示公有領域／美國政府作品標示，即可進入採用流程；不再要求證明
拍攝場合、攝影者身分、帳號控制權、自我發表，或標示授權者實際具有
授權能力。

The photo-first target is all 21 current athlete cover slots. An original SVG
fallback remains permitted only when the governed review has exhausted the
frozen evidence first and then any authorized supplemental search, and still
finds no candidate carrying a qualifying explicit CC or public-domain marker
that clears every retained gate below. A photo count is a target, never a
reason to invent a marker, omit an obligation, or waive a retained gate.

The exact active expression is:

```text
exact athlete/case mapping
AND explicit supported CC marker or explicit PD/US-government marker
AND exact rights facts and all applicable obligations recorded
AND fixed source observation and original binary facts recorded
AND different-from-governed-injury-event verified
= eligible player photo

otherwise = original SVG fallback
```

## Explicit rights-marker gate

A source page must itself display an affirmative rights marker for the exact
work. The existing supported CC set remains CC BY 2.0, 3.0, and 4.0; CC BY-SA
2.0, 3.0, and 4.0; and CC0 1.0. The exact displayed license name, version,
terms link, credited name as displayed, supplied-title state, alteration
state, and all supplied copyright, disclaimer, or other notices are recorded
per work. Every applicable attribution obligation must be fulfilled; CC
attribution is a condition of the license, not optional presentation copy.

All Rights Reserved, no rights marker, an unknown or internally inconsistent
marker, and a marker that cannot be tied to the exact work all fail closed.
The existing unsupported CC NC and CC ND families remain outside the supported
set. A filename, category, search snippet, uploader label, API guess, or
third-party description does not substitute for the marker on the opened
Commons or Flickr work page.

Public Domain Mark, a platform-displayed public-domain statement, and a
platform-displayed United States government-work statement are allowed in a
distinct `public-domain` bucket. This expressly includes agency-specific
`PD-USGov-*` statements such as `PD-USGov-Military-Navy` and corrects the v7
technical exclusion of the Dejounte Murray candidate. Public domain is a
rights status, not a Creative Commons license; it therefore does not receive
an invented license version or attribution condition. Because a qualifying
public-domain work has no copyright restriction to rely on, its copyright
risk is lower than a CC-marked work whose purported licensor may lack
authority. The exact displayed
status token, statement, link, source, supplied credit, and supplied notices
are still preserved as factual provenance. CC0 remains separately recorded as
the exact CC0 1.0 dedication.

## Decision 14 gates removed from active eligibility

None of the following may reject an otherwise complete candidate under
`nba-v8`:

- occasion, including game action, pregame, warm-up, All-Star, postseason,
  preseason, international competition, closed practice, `other`, unknown,
  unresolved, or `ambiguous-credentialed-court-context`;
- absence from a named-photographer allowlist; the v7 allowlist mechanism is
  abolished rather than expanded;
- inability to prove the photographer's identity, the uploader's identity,
  account control, an uploader-to-maker relationship, photographer-owned
  self-publication, or an upstream photographer-owned original;
- inability to verify licensing authority or prove that the person or account
  displaying the marker actually had the right to grant it;
- a washing signal, the absence of EXIF/series/native-resolution/account
  continuity proof, or the absence/result of an authorship, license,
  takedown, or dispute search; or
- an ambiguous credentialed-court context.

Occasion, maker, uploader, account, and upstream strings may still be recorded
exactly as displayed for factual description and attribution. They must not be
promoted to verified identity, ownership, control, or licensing authority and
must not be used to claim clearance. The v7 conditional event exception,
empty allowlist join, numeric history floors, dispute search, and washing
contract are historical predecessor facts, not active v8 gates.

## Fixed source and original-binary record

Every adopted work remains traceable to a fixed observation of the exact
source page and to the original downloaded binary. For Commons, record the
description URL, source-native revision ID, immutable revision permalink,
revision timestamp, and original-file URL. For Flickr, which does not expose a
Commons-style immutable page revision, freeze a canonical evidence record
before adoption containing the photo ID, page URL, observed-at/by values,
displayed rights marker and link, displayed credit/title/notices, original
download identity, and the evidence record's own path and SHA-256. That frozen
observation is required for traceability and must never be represented as a
source-native immutable Flickr revision.

For either platform, retain the original filename or platform asset ID,
original MIME type and dimensions, original download URL or exact retrieval
identity, download date, local repository path, byte length, dimensions, and
SHA-256. Thumbnail-only or screenshot-only evidence cannot satisfy the
original-binary gate. Runtime remote fetching remains forbidden. Stored
originals may be presented with the existing CSS crop; focal position and
both 5:2 and 16:9 subject-safety checks remain required.

Every selection binds the exact `nba-v8` Markdown and canonical-JSON digests,
the exact predecessor registry bytes, its 21-athlete/26-case mapping, and its
supersession facts. Historical policy, registry, evidence, and asset bytes are
never rewritten in place.

## Attribution and CC BY-SA composition firewall

All existing license-specific title, credit, exact terms-link, notice,
alteration, and Adapter's License obligations continue. A CC BY-SA
presentation crop must link the same CC BY-SA version and limit the Adapter's
License to the crop contribution. Ordinary local HTML/CSS placement and
ordinary responsive rendition remain distinct from site composition.

CC BY-SA material remains forbidden as an input to every site-composed or
baked design, including OG images, social images, case cards, infographics,
and equivalent composite outputs. G6 rights review found that such a
composition may be an adaptation and could require the site's own design to
be released under CC BY-SA without charge and irrevocably. Decision 15 does
not change that conclusion. Because photo-first adoption may increase the
number of BY-SA works, the existing mechanical firewall must remain enabled
and pass before promotion.

## Injury-event and personality-rights boundary

Occasion is no longer an eligibility gate, but the relationship to the
governed injury event remains one. Every photo must be verified as different
from the governed injury event. A same-injury-event or unresolved relationship
fails closed. The public factual caption must continue to state that the photo
does not depict the case's injury moment, with any asset-specific event facts
kept accurate and separate.

Creative Commons licenses address copyright permissions only; public-domain
status addresses the absence of copyright in the marked work. Neither grants
personality, portrait, publicity, privacy, endorsement, venue-access, league,
team, or contractual rights. Adopting a photo therefore never asserts that
personality or portrait rights were obtained and never creates legal-use,
medical, or public-release clearance.

## Owner's named residual-risk acceptance

吳易澄醫師在被明確告知後，具名接受以下三項殘餘風險：

1. **持證攝影記者授權自始無效的風險（Flickr-washing）**：持證記者與聯盟或媒體有契約，
   若無權授權，其標示的 CC 授權自始無效，下游使用者不因善意而免責
2. **封閉練習場地規範風險**：封閉練習照片可能違反球隊或場地的拍攝規範
3. **授權人身分無法追溯的風險**：帳號持有者未必是拍攝者，連授權人是誰都無法主張

This named acceptance is an informed acceptance of unresolved risk, not a
finding that any displayed marker is valid, that any licensor had authority,
or that downstream good faith creates a defense. It is not copyright,
personality-rights, venue, contractual, medical, or public-release clearance.
The three risks must remain visible in the policy, candidate-adjudication
evidence, registry successor contract, and final validation; they may not be
collapsed into `low-risk`, `rights-cleared`, `licensed-for-public-use`, or any
equivalent affirmative statement.

## Frozen evidence priority and execution boundary

The first execution input is the immutable Decision 14 candidate ledger at
`docs/reviews/2026-08-13-decision-14-p2-photo-candidate-evidence.md`, SHA-256
`b5a1f207323125170c96a03f63f8643694d70fad4f01e42dd33d1ec1f73fd00b`.
Its first-fatal-reason rows must be re-adjudicated under this policy before any
new search. A supplemental Commons/Flickr search is allowed only for an
athlete who still has no qualifying CC/PD candidate after that re-review.

Medical content, medical-review decisions, publication, public release,
deployment, indexing, hosting-service mutation, external-account mutation,
and remote-repository mutation remain closed. The private site remains
noindex. No service restart, reload, configuration, credential, listener, or
exposure change is implied. A separate strict owner-supplied execution
decision bound to the exact Decision 15 plan path and SHA-256 is required
before Phase 0 or any later phase may run.
