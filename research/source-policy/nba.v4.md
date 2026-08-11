# NBA source policy (`nba-v4`)

This immutable addendum is the Decision 11 attribution-remediation version of the NBA source policy. Its machine-readable companion is `source-policy.v4.json`. It inherits the complete clinical, diagnosis, event-video, provider, media-handling, indexing, source-selection, and static-player-photo eligibility rules from immutable `nba-v3` without changing their meaning.

The parent `nba-v3` JSON SHA-256 is `284a88792f281564799eeae6b62646b855072725824ef21f3cea4204a3d14270`; the parent Markdown SHA-256 is `7dc98d1146ffe701a312694512bfe513f27d3edb8ecaeeb2f933a92f9fb32ca2`. Existing clinical cases, source manifests, source-review decisions, and medical approvals remain bound to their existing immutable policy and content digests. This version does not authorize medical-content changes, publication, deployment, indexing, hosting, or external-account mutation.

## Decision 11 attribution remediation

For every current player-photo record, the repository must retain the verified current Wikimedia Commons page revision ID, revision timestamp, and `oldid` permalink checked on `2026-08-12`. The registry records a work-title supply state and preserves `null` when a distinct licensor-supplied title cannot be established. A MediaWiki filename-derived `ObjectName`, narrative description, generic Commons footer, license boilerplate, or automated review template must not be promoted into a supplied title or bespoke notice.

Every record is assigned exactly one license bucket: `cc-by`, `cc-by-sa`, or `cc0`. The bucket must agree mechanically with the precise license token and terms URL. Public Domain Mark is not treated as CC0; using it in a future current registry requires another explicit policy and schema cycle.

For 2.0 licenses, every supplied work title is visible in the rendered attribution. A 2.0 record with no verified supplied title explicitly records that state as `not-supplied` with a `null` title; no title may be invented from the filename.

Every record separately captures whether the source revision supplied a copyright notice, a licensor disclaimer, or another per-file notice that must remain discoverable. A supplied notice retains its exact text. A missing notice is recorded as `not-supplied` with `null`, rather than being inferred. For every 4.0 record these states are mandatory. Supplied copyright notices are rendered verbatim, and a supplied per-file notice is rendered with its revision-bound link. Commons-wide footer text and generic Creative Commons deed text are not bespoke source-page notices.

The site uses `object-fit: cover` presentation crops. Every CC BY-SA presentation crop therefore carries an explicit Adapter's License with the same versioned CC BY-SA name and terms link as the source work. The rendered declaration is limited to the site's crop/adaptation contribution and expressly does not license the surrounding page, text, layout, icons, or other site-owned material. CC BY and CC0 records must not carry an Adapter's License.

The rendered attribution uses a license-bucket-specific template. All buckets retain the exact author, exact original license name and link, revision-bound Commons source link, non-event disclosure, and alteration disclosure. License terms links must not use an unscoped `rel="license"` token, because that link relation would describe the current document rather than the specific source work or CSS crop contribution. CC BY additionally renders supplied title and copyright facts without ShareAlike language. CC BY-SA additionally renders the explicit linked Adapter's License. CC0 uses its own waiver template and never borrows BY or ShareAlike claims.

## Immutable registry cycle

`player-photo-registry.v1.json` remains historical and byte-immutable. The Decision 11 attribution-complete registry is a new schema version that binds the exact SHA-256 of v1 and the exact bytes of this policy pair. Validators reject missing lineage, stale policy digests, unrecognized fields, a bucket/license mismatch, a missing supplied 2.0 title, missing 4.0 notice-retention states, an unlinked or incompatible ShareAlike adapter license, or any adapter license on CC BY or CC0.

The registry and UI change require the existing renderer review-set and private-distribution manifest refresh. They do not alter approved clinical wording or case clinical digests. Any later clinical/video-policy change still requires the complete pre-existing verifier, root-audit, review-set, named-decision, and manifest cycle. Any later player-photo attribution-policy byte change requires a new source-policy version, complete photo license/provenance verification, renderer review-set refresh, and private-dist manifest refresh. Same-version byte drift is rejected.
