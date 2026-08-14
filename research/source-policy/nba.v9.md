# NBA source policy (`nba-v9`)

This immutable Decision 16 addendum is the append-only governed-rendition
successor to `nba-v8`. Its machine-readable companion is
`source-policy.v9.json`. It binds the exact predecessor bytes:

- `research/source-policy/nba.v8.md` — SHA-256
  `20a9209bd523604efe3251f6ef159e6432fa9280951ea16d630ee02cc347557d`;
- `research/source-policy/source-policy.v8.json` — SHA-256
  `30a27633e7923f5331d7098226d5773faf2fe5d203e01e41705e03fe47ee318e`.

Historical policy versions remain byte-immutable. A correction to this
version requires `nba-v10`; `nba-v9` is never edited in place. This policy is
a provenance contract, not execution authority. It does not itself authorize
an image mutation, registry promotion, artifact build, publication,
deployment, indexing, service mutation, external-account mutation,
remote-repository mutation, medical-content change, or medical-review
decision.

## Exact inherited policy

Every `nba-v8` adoption gate, accepted license and source platform, exact
attribution and notice obligation, fixed-source rule, original-binary rule,
injury-event relationship rule, personality-rights non-clearance statement,
owner residual-risk record, fallback rule, and closed scope continues without
change. The clinical/video/privacy policy and every root policy field also
remain unchanged.

The general stored-file rule remains
`cropRules.storedJpegModificationAllowed=false`. Decision 16 does not turn
stored JPEG modification into a general permission and does not broaden the
athlete, candidate, platform, license, use-kind, or release scope.

## One governed local-rendition exception

The only new model is a named exception for the current Trae Young cover under
scope `decision-16-trae-young-rendition-only`. It permits a new local file at
`src/assets/players/decision-16/trae-young.jpg` to be reproducibly derived from
the immutable Decision 15 source at
`src/assets/players/decision-15/trae-young.jpg`.

The source-original record remains exactly the 39,619,306-byte, 6351×5504 JPEG
whose repository SHA-256 is
`b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0`
and whose MediaWiki SHA-1 is
`193bb8a75e73f878359d136f0769205a4a8693ba`. Its immutable Commons facts
remain the description URL, original-file URL, oldid `1148485505`, revision
permalink, and revision timestamp `2026-01-16T19:13:29Z` recorded by Decision 15. The upstream work remains a Commons extraction and CropTool derivative;
the Decision 15 repository file remains the unmodified local original with a
site CSS presentation crop.

The local-rendition record is a distinct fact set. It must name its own path,
SHA-256, MIME type, decoded dimensions, and byte length; bind the exact source
path and SHA-256; and record the transformation tool, version, deterministic
options, quality ladder and selection result, aspect-ratio and no-crop state,
orientation, color and metadata treatment, creation date, and actor. A source
URL, oldid, revision timestamp, MediaWiki SHA-1, original dimensions, or
original byte length must never be populated with rendition facts.

The rendition must be a complete JPEG, must not crop or enlarge the source,
must preserve the full-frame aspect ratio subject only to integer rounding,
must have longest edge exactly 2,400 px, and must be no more than 5,000,000
bytes. With the frozen upright 6351×5504 source, the required decoded output is
2400×2080. A declared quality ladder is evaluated from highest to lower
quality, and the first deterministic candidate at or below the byte ceiling is
selected.

The immutable Decision 15 source remains stored for reproducibility and
history but is not a current emitted cover after registry promotion. It is not
overwritten, deleted, relocated, re-downloaded, or removed from Git history.

## Attribution and indication of changes

The exact work remains `Trae Young`, licensed CC BY 2.0 with token
`cc-by-2.0` and terms at
`https://creativecommons.org/licenses/by/2.0`. Displayed credit and the
supplied copyright notice remain `Erik Drost`. The fixed Commons revision and
source link remain visible. No Adapter's License is declared because this work
is CC BY, not CC BY-SA.

In addition to the upstream alteration statement, the local rendition carries
a separate, human-visible indication that the 6351×5504 Commons original was
downscaled without cropping and JPEG-re-encoded to 2400×2080. Any other
material color, profile, orientation, or metadata change must be stated in the
same rendition record. The two alteration statements are not merged or
rewritten as one fact.

Creative Commons permission addresses copyright only. This rendition does not
create personality, portrait, publicity, privacy, endorsement, venue, league,
team, contract, medical, legal-use, or public-release clearance.

## CC BY-SA composition firewall remains unchanged

This Trae Young work is CC BY, but the complete `nba-v8` ShareAlike firewall
continues byte-for-behavior. CC BY-SA works remain forbidden as inputs to
site-composed or baked OG images, social images, case cards, infographics, and
equivalent composite outputs. Ordinary local HTML/CSS placement and ordinary
responsive rendition remain distinct from site composition. Where a CC BY-SA
presentation crop actually applies, its Adapter's License must use the same
CC BY-SA version and remain limited to the crop contribution. Unknown uses
fail closed.

## Execution boundary

Publication, deployment, indexing, hosting-service mutation, external-account
mutation, remote-repository mutation, medical-content authoring, and
medical-review decisions remain closed. `allowIndexing=false` and private
review controls remain mandatory. This policy does not authorize a service
restart, credential, listener, port, Tailscale, or exposure change. Any
execution must remain within the separately bound Decision 16 plan and strict
owner-supplied authorization.
