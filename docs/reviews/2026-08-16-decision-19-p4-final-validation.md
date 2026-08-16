# Decision 19 Phase 4 final validation

- Date: 2026-08-16
- Scope: `decision-19-private-review-artifact-refresh-only`
- Plan SHA-256: `12fc8e3aee0beb0111190f9111dc1b4810326f452054a5687bed6a49004c5ddf`
- Authorization SHA-256: `9a2af6623f33b954476cf1d541085baa227419603fd98a5afd3f8e78baccc57a`
- Executor: Claude. The Codex CLI account hit its usage limit on 2026-08-15 and
  is unavailable until 2026-08-20; the governance requirement is faithful plan
  execution, not a particular executor.
- Release state: private medical review only. Deployment, indexing, public
  release, remote push, and medical-review decisions remain closed.

The private review host now serves the Decision 18 corpus. No case content,
follow-up item, source, tier, or review status changed in this decision.

## Commits

| Commit    | Purpose                                                         |
| --------- | --------------------------------------------------------------- |
| `e2536be` | Register the Decision 19 plan as not-authorized                 |
| `4e8176a` | Bind the owner authorization and mark the plan authorized       |
| `df47271` | Point both artifact-chain generators at the transitional corpus |
| `fcd14cd` | Phase 1 regenerated review set, committed alone                 |
| `6376923` | Phase 2 regenerated private manifest, committed alone           |

## Deviation recorded: the generator migration in df47271

Phase 1 failed on its first attempt. `npm run review-set:generate` exited 1
with the same 104 `follow-up-research-evidence-missing` issues that had
previously blocked the unit suite, because `scripts/generate-review-set.ts`
and `scripts/private-hosting/generate-private-dist-manifest.ts` still imported
the Decision 17-only `loadFollowUpCorpus`. Decision 18 migrated every read and
verify path to `loadDecision18TransitionalFollowUpCorpus` but could not migrate
these two, because they are the artifact chain and Decision 18 closed
`hosting-service-mutation`.

Both call sites used only `entry.sidecar.caseId`, `entry.sidecarPath`, and
`entry.draftDigest`, all of which exist on both entry variants, so the change
is an import and call-name swap with no downstream shape change. `tsc --noEmit`
exits 0 and the full unit suite passes.

This was necessary work inside this decision's own subject matter, not a scope
expansion: without it the artifact chain cannot run at all.

## Artifact chain

| Step                       | Result                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `review-set:generate`      | Digest `1c25f571bca7fc3a21686e78bffa938ce3abf89800408e05d2798c7d0c2ee1c4`                            |
| `build:review`             | 42 pages, 822 optimized images, completed in 59.66s                                                  |
| `private:manifest`         | 915 files, digest `38a98b687b912eca33060a414afafa60524e7edfa5f3b4f293446e716465b808`                 |
| `launchctl kickstart`      | Invoked exactly once, after the manifest-only commit                                                 |
| `launchctl list` exit code | `0`, PID 66390                                                                                       |

## Served smoke

A read-only, memory-only Node process read the mode-0600 credential into
process memory, never placed it in argv, environment, or output, derived the
complete path list from the committed manifest, used one keep-alive socket,
and wrote no receipt or response body.

| Scenario                                               | Actual result      |
| ------------------------------------------------------ | ------------------ |
| Manifest paths                                         | `915`              |
| Credentialed GETs returning 200                        | **915/915**        |
| Credentialed body length and SHA-256 matching manifest | **915/915**        |
| Credential-free GETs returning 401                     | **915/915**        |
| Credential-free responses with zero body bytes         | **915/915**        |
| Mismatches                                             | **0**              |
| Bytes streamed                                         | `142,614,692`      |
| Elapsed                                                | `216,164 ms`       |
| `127.0.0.1:8140`                                       | `000`, as required |

## Content unchanged

| Check                    | Result                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Clinical freeze          | **30/30** byte-identical, aggregate `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73`, unchanged since Decision 16    |
| Unit suite               | **1278/1278** across 75 files                                                                                                         |
| TypeScript               | `tsc --noEmit` exit 0                                                                                                                 |
| Follow-up composition    | 26 cases, 148 items; tiers 63 official / 81 mainstream / 4 unverified; kinds 96 treatment / 28 surgery / 0 injection / 24 actual-return |
| Pending review state     | `pending-owner-signoff` appears 353 times in `dist`; no item is presented as approved                                                 |
| NBA.com navigation sinks | **0** clickable `nba.com` anchors in `dist`; 28 files cite it as plain text                                                           |
| Review artifact          | noindex on every page; no sitemap, analytics, iframe, preconnect, or non-local image                                                  |

## Not achieved and not run

- `private:verify` was **not run**. It is a known pre-existing failure
  unrelated to this decision: it defaults to `--credential-source tty` and so
  fails headless with `credential-invalid`, and with the local-file source it
  then fails with `transport-failed` on
  `/_astro/cj-mccollum.ngownTQ1_2isaYs.jpg` in the
  `credential-removed-new-client` scenario. Decision 16 transferred it to a
  dedicated future decision. One further diagnostic lead: a complete served
  pass takes about 216 seconds, which exceeds the verifier's
  `COMPLETE_RUN_TIMEOUT_MS` of 180,000.
- **Lighthouse was not run this round.** No claim is made about it. The
  Decision 17 result stands: five of six routes passed and the Anthony Edwards
  case route measured 3004-3005 ms against a 3000 ms budget with accessibility
  `1.00`.
- Decision 18 has no closing validation document of its own; it was cut off by
  the executor usage limit after committing all three research batches. Its
  content work is complete and committed, but its own closing record remains
  outstanding.
