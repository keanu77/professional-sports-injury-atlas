# NBA source policy (`nba-v3`)

This document freezes the human-readable source-discovery rules for the NBA launch batch. Its machine-readable companion is `source-policy.v3.json`. The rolling recent-case cutoff is `2016-08-06`. Events on or after that date are recent; an earlier event is only a proposed classic exception and cannot be self-approved by a researcher or agent.

`source-verified` means ready for later case authoring only. It does not mean medically reviewed, publicly releasable, legally licensed, private, or safe to index. This policy does not authorize medical content authoring, hosting, public release, deployment, or indexing.

Researchers and agents stop at `source-ready`. Only the named content owner may promote a root-audited row to `source-verified`, and only after issuing the exact durable source-review decision bound to the frozen candidate set and both policy digests. No researcher or agent may invent that identity or promote a row on its own.

`source-ready` is used only after every required source field passes. Every included diagnosis, event, and video source page must be opened on its original page; the ledger retains its canonical URL, publisher, and access date. A search-result snippet never substitutes for an opened original page.

No worker invents a source, URL, date, or diagnosis. Unavailable information remains explicitly unresolved or is recorded as not found.

This version inherits the complete clinical and event-video rules from immutable `nba-v2` without changing their meaning. The parent JSON SHA-256 is `6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07`; the parent Markdown SHA-256 is `b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570`. Existing cases, source manifests, source-review decisions, and clinical approvals remain bound to `nba-v2`. Only the Decision 7 static-player-photo annex below is new, and it has no authority to change medical content, event-video handling, public release, hosting, or indexing.

## Controlled tokens

- Injury code: `acl`, `ankle-sprain`, `achilles-rupture`.
- Embed status: `unchecked`, `verified`, `external-link-only`, `unavailable`.
- Caption status: `not-verified`, `available`, `unavailable`.
- Video provider: `youtube`, `nba`.
- Video content type: `in-game-injury-event`.
- Competition: `nba-preseason`, `nba-regular-season`, `nba-play-in`, `nba-playoffs`, `nba-all-star`.
- Diagnosis status: `unconfirmed`, `confirmed`, `conflicted`.
- First-party availability: `available`, `documented-unavailable`, `not-applicable`.
- Discovery status: `discovered`, `needs-source`, `source-ready`, `source-verified`, `excluded`.
- Diagnosis source type: empty, `diagnosis-first-party`, `diagnosis-secondary`.
- Uploader provenance: `league`, `team`, `broadcaster-rightsholder`, `official-player`, `unknown`.
- Provenance check status: `pending`, `verified`, `rejected`.

## Diagnosis hierarchy

For a recent candidate, an explicit diagnosis from a first-party source is required. The qualifying first-party classes are a league statement or report, a team statement or report, an official injury report, an official press release, or another directly responsible first-party page. A source supports only the facts it explicitly states. In particular, an NBA injury report does not establish an unstated grade, imaging result, surgery, rehabilitation length, prognosis, or return date.

The `diagnosis_claim` is a short factual paraphrase of the externally confirmed target category. Video observation, slow motion, broadcaster commentary, search-result snippets, social reposts, anonymous accounts, fan edits, compilations, and speculation never confirm diagnosis. Visible-event observations and diagnosis evidence remain separate.

The same first-party rule applies to classic candidates when the original is available. A classic candidate may use two explicit secondary diagnosis sources only when all of the following are true:

1. the event predates `2016-08-06` and has a non-empty teaching-value rationale;
2. `first_party_availability_status` is `documented-unavailable`;
3. the structured audit records a factual basis, named checker, date, official locations checked, attempted canonical or archived URLs, observed outcomes, and exact audit reference;
4. both sources explicitly support the target diagnosis category; and
5. the sources have different normalized `independence_group` values and do not share the same non-empty `origin_report_id`; an original report may leave that identifier empty.

Syndicated copies remain one source even if their domains or publisher names differ. A bare statement that an original is old or unavailable is insufficient. A credible source conflict sets `diagnosis_status=conflicted`; the row cannot become `source-ready` or `source-verified` until the conflict is resolved. Classic exception review proposes a candidate for later named approval; it is not approval itself.

## Event and video identity

The launch primary video content type is exactly `in-game-injury-event`. It must show the same athlete's injury event during the recorded NBA competition. The event source, original video title or context, and root audit must agree on athlete, event date, opponent, and competition. This establishes event identity only and never establishes a diagnosis.

For the primary video's event-date identity check, `video_published_at` must fall within the inclusive window from `event_date` through `event_date + 3 days`, or the video title must contain `event_date`. This window is asymmetric: publication before `event_date` is ineligible.

Official interviews, recaps, news or analysis packages, practices, warm-ups, rehabilitation, return footage, and compilations are excluded as primary videos even when an official channel uploaded them. Canonical video URLs point to the original platform page with tracking parameters removed.

## Provider and uploader acceptance

| Provider or provenance               | Discovery acceptance                                                                               | Embed boundary                                                                                               |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| YouTube + `league`                   | Accepted after original page, channel, event identity, provenance, captions, and embed checks pass | `verified` only after a manual privacy-enhanced embed check; otherwise `external-link-only` or `unavailable` |
| YouTube + `team`                     | Accepted after the same checks                                                                     | Same as league                                                                                               |
| YouTube + `broadcaster-rightsholder` | Accepted when the channel is recognizable and the rightsholder basis is recorded                   | Same as league                                                                                               |
| NBA.com + `league`                   | Accepted after original page, event identity, provenance, and caption checks pass                  | Provider `nba` is `external-link-only` or `unavailable`; never `verified`                                    |
| `official-player` or `unknown`       | Not accepted as verified provenance without separately documented authority                        | Cannot become an accepted embed merely because the account is official or unidentified                       |
| Fan, compilation, edit, or repost    | Rejected                                                                                           | No embed and no external-link fallback for inclusion                                                         |

A new provider or broadcaster host requires an explicit provider-registry policy revision and tests before use. The researcher records original platform URL, channel URL, uploader name, publication date, access date, provenance token, and a factual basis such as `league official channel`, `team official channel`, or `broadcast rightsholder channel`. `provenance_check_status=verified` confirms source provenance under this policy only; it is not a copyright license or public-release authorization.

## Embedding, captions, and media handling

The operational requirements in this and the following sections—including click-to-load, no-screenshot, and noindex-is-not-privacy—are Atlas policy controls. They are not quotations attributed to the official references below.

YouTube embeds use a privacy-enhanced `youtube-nocookie.com` player and click-to-load behavior without autoplay. Before the reader chooses to load a video, the page must not create the third-party player request. Manual browser review—not oEmbed alone—decides whether the player works. YouTube API metadata may corroborate title, uploader, and technical `embeddable` status, but it cannot prove permission, copyright ownership, regional availability, or public-release rights.

If an accepted original upload cannot be embedded but its original platform page remains usable, record `external-link-only`. NBA.com videos are always handled as `external-link-only` or `unavailable`. A deleted, private, or otherwise unreachable video is `unavailable` and is not counted in the launch manifest.

The original platform caption control must be checked. `not-verified` cannot reach `source-ready`. `available` permits later review-mode click-to-load presentation. `unavailable` may remain in source discovery with a visible accessibility limitation and the site's own written summary, but a later public build must degrade it to a clearly labeled original external link rather than an in-site embed. No transcript text is copied or stored.

No worker downloads, clips, records, reproduces, reuploads, or stores video, audio, screenshots, thumbnails, transcripts, article bodies, or other copyrighted media. No screenshot or custom thumbnail is made from game footage. Only short factual paraphrases, titles, publishers, dates, canonical URLs, uploader provenance, and verification outcomes are stored. Player branding, ads, title, and uploader identity must not be obscured, and platform media must not be placed behind a paid viewing gate.

Technical embedding is not legal permission. Public accessibility, oEmbed success, an API `embeddable` value, or an NBA.com page being reachable does not establish reuse rights. Rights and current platform terms must be reviewed again under a separately authorized public-release plan. If provenance is unacceptable, external linking does not rescue the candidate.

## Indexing, privacy, and access control

All discovery and review output remains non-public. A review build must fail closed with `noindex`, but `noindex` is an indexing directive, not privacy or access control. It does not make a URL confidential and does not prevent a person who knows the URL from requesting it. A genuinely private review environment requires hosting-layer authentication or authorization plus explicit unauthorized-request testing. This source policy neither selects a hosting provider nor authorizes hosting, publication, deployment, or indexing.

## Candidate decision table

| Condition                                                                                 | Candidate action                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------- |
| First-party diagnosis + accepted original uploader + verified embed                       | eligible for source review            |
| First-party diagnosis + accepted uploader + embed disabled                                | eligible as external-link-only        |
| Classic + two independent explicit secondary diagnoses + accepted video                   | eligible for classic exception review |
| Diagnosis based only on video/commentary                                                  | needs-source or excluded              |
| Fan/compilation/repost uploader                                                           | excluded                              |
| Official recap/interview/practice/warm-up/rehab clip rather than the in-game injury event | excluded as primary video             |
| Source conflict                                                                           | conflicted; not source-verified       |
| Video deleted but audit sources remain                                                    | unavailable; not counted in manifest  |
| Search snippet only                                                                       | not a source                          |

## Fixed reference locations

The following seven original pages were opened on `2026-08-06`. The authorized plan URL is retained for every reference, and each request returned that plan URL as the final URL. Canonical metadata was not observable for the two NBA pages. The four Google for Developers pages declared their plan URLs canonical; the YouTube Help page declared `https://support.google.com/youtube/answer/171780?hl=en` canonical while the exact plan URL remains the policy reference.

- NBA Official — NBA Injury Report: 2025-26 Season | NBA Official: <https://official.nba.com/nba-injury-report-2025-26-season/>
- NBA.com — Terms of Use | NBA.com: <https://www.nba.com/termsofuse>
- YouTube Help — Embed videos & playlists - YouTube Help: <https://support.google.com/youtube/answer/171780>
- Google for Developers (YouTube) — YouTube Embedded Players and Player Parameters | YouTube IFrame Player API | Google for Developers: <https://developers.google.com/youtube/player_parameters>
- Google for Developers (YouTube) — YouTube Player API Reference for iframe Embeds | YouTube IFrame Player API | Google for Developers: <https://developers.google.com/youtube/iframe_api_reference>
- Google for Developers (YouTube) — YouTube API Services - Developer Policies | Google for Developers: <https://developers.google.com/youtube/terms/developer-policies>
- Google for Developers (YouTube) — Videos: list | YouTube Data API | Google for Developers: <https://developers.google.com/youtube/v3/docs/videos/list>

## Version binding and change cycle

The bytes of this Markdown file and the canonical JSON companion are immutable for `nba-v3`; the JSON records this file's exact SHA-256. Tests expose both exact digests and require the declared version to map one-to-one to those bytes. Any substantive or editorial byte change requires a new source-policy version and the scope-specific change cycle below. Existing decisions and manifests remain bound to their original immutable policy bytes; a changed policy must not silently reuse them.

## Decision 7 static player-photo annex

This annex is authorized only for scope `decision-7-commons-player-photo-covers-only`. It permits local storage of an original Wikimedia Commons JPEG solely when it is a general basketball-court photograph of the exact athlete, its description page and original download are on the approved Commons hosts, and its license is an exact approved CC BY, CC BY-SA, CC0, or Public Domain token-and-terms-URL pair. The repository copy must remain byte-identical to the downloaded original; responsive format conversion and presentation crops are produced only by Astro at build time. No browser render may fetch the player image remotely.

The annex does not weaken the existing media rules. Source-event video, audio, screenshots, thumbnails, footage-derived stills, transcripts, and copyrighted article bodies remain prohibited from repository download, capture, reproduction, or re-upload.

Every accepted photo record must bind the exact athlete and case IDs, safe local path, upstream filename, canonical Commons description page, original upload URL, photographer, exact license name and terms URL, original dimensions, local byte length/dimensions/SHA-256, download date, alteration disclosure, identity evidence, source classification, focal position, validated 5:2 and 16:9 crops, and both `nba-v3` policy digests. Duplicate, unknown, uncovered, or multiply covered case mappings fail closed.

Every rendered licensed-photo use must visibly show the photographer, a linked exact license name, a link to the Commons description page, and the wording `球員球場資料照片；非本案例受傷當下影像`. A CC BY-SA presentation crop must additionally show `改作自原作`. Attribution links remain separate from case, video, and other overlay links.

The following remain prohibited regardless of an apparently free license: wrong-athlete images; official league or team headshots and photo-shoot/media-day portraits; Getty, AP, USA Today, Reuters, or equivalent commercial news-agency images; screenshots; thumbnails; footage-derived stills; unknown, all-rights-reserved, fair-use, CC-NC, or CC-ND licensing; non-JPEG input; non-Common sources; and ambiguous identity or provenance. A failed identity, provenance, license, visual, or technical check keeps the existing governed injury-theme cover.

Three upstream suggestions are frozen as explicit negative filenames:

- `Anthony_Edwards_Argentina_v_Egypt_7_July_2026-069_(cropped).jpg` is excluded because it is a FIFA-event/stadium photograph, outside the authorized basketball-court-photo class. Current Commons evidence identifies the NBA player Anthony Edwards; the planning-time namesake rationale is not repeated as fact.
- `Dwight_Powell.jpg` is a 480×480 Dallas Mavericks official photo-shoot image. CC0 does not override the official-headshot prohibition.
- `2025_C.J._McCollum_(cropped).jpg` is a posed Washington Wizards media-day portrait.

A later clinical or video-policy change still requires a new source-policy version and the complete existing verifier, root-audit, review-set, named-decision, and manifest cycle. A later change to this photo annex requires a new policy version, complete photo license/provenance verification, renderer review-set refresh, and private-dist-manifest refresh. Same-version byte drift is rejected.
