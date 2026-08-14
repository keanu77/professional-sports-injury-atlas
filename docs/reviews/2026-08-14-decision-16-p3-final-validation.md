# Decision 16 Phase 3 final validation — partial completion

- Date: 2026-08-14
- Owner: 吳易澄醫師
- Runtime: Node `v24.14.0`
- Scope: `decision-16-trae-young-rendition-only`
- Plan SHA-256:
  `963b27387c4d3232ef5e3aa7a892907e3594231ca8bd09ffec00d45a4ee8d4db`
- Status: **PARTIALLY COMPLETE — the substantive D16 work is green, but the
  mandatory private verifier/receipt condition was not achieved**
- Release state: no publication, deployment, indexing, external-account,
  hosting-service configuration mutation, or remote-repository action

## Owner disposition and truthful status

The owner has closed Decision 16 as **partially complete**. The Trae Young
rendition, attribution and registry lineage, artifact-size guard, artifact
chain, protected-cover equality, clinical freeze, and all recorded
non-verifier validation completed successfully. The plan-required
`npm run private:verify -- --credential-source local-file` exit-0 condition did
not complete, and no successful D16 served-review receipt exists.

The unmet verifier condition is transferred to a separately governed future
Decision for investigation and correction. It does not block other subsequent
work that has its own authority. This disposition is not a verifier pass, not a
full Phase 3 acceptance, not a convenience waiver, and not authorization for a
future Decision that does not yet exist.

The reason for this disposition is a false planning premise. Decision 15's
final report and the Decision 16 Phase 0 report attributed the earlier
`transport-failed` result to the approximately 38 MB emitted Trae Young JPEG
exceeding `MAX_RESPONSE_BYTES = 32 * 1024 * 1024` (33,554,432 bytes). The D16
plan therefore expected the smaller rendition to repair the verifier
incidentally. Owner-run post-execution diagnostics disproved that causal
diagnosis. Those historical documents remain unchanged; this report is the
append-only correction.

## Governance representation

The repository has no existing plan closure, waiver, defer, or partial-
completion schema:

- `PlanExecutionDecisionV1` strictly represents execution authorization;
  `executionStatus` must be exactly `authorized`, and extra keys are rejected.
- The plan binding supports only lifecycle `active` or `superseded`, and
  authorization status `authorized`, `not-authorized`, or `superseded`.
  `superseded` means replacement by a new plan for the same role, not
  completion or deferral.

Consequently, no new schema was invented and no incompatible status was forced
into the authorization or binding. The existing final-validation report plus
the established owner-decision ledger are used to record the disposition
truthfully. The authorization remains valid, while its mandatory verifier
condition remains explicitly unmet.

| Governance input      | Path / SHA-256                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorized plan       | `docs/superpowers/plans/2026-08-14-decision-16-trae-young-rendition.md` / `963b27387c4d3232ef5e3aa7a892907e3594231ca8bd09ffec00d45a4ee8d4db`            |
| Authorization JSON    | `docs/decisions/2026-08-14-decision-16-trae-young-rendition-authorization.v1.json` / `c995301f5490705abf5dc91ce47e5ab72fef9a43bf3257d5d677ba27bb529ab8` |
| Plan binding          | `docs/decisions/plan-binding.v1.json` / `3c7308467aa5d19a81dc81bd2ba1559ffb49fe4cb4d045a66583e649401ddf31`                                              |
| Owner decision ledger | `../.claude/g2-owner-decisions.md` / `a5579f11fa9fb8883f20c6d758014536bcfc65abec8972cd14afaf8a6e38cecc`                                                 |

The owner ledger is outside this repository's Git top-level. Its full-file
digest above binds the workspace record used for this closeout, but the ledger
cannot be included in the repository commit.

## Governance and artifact lineage

| Boundary                                         | Commit                                     | Subject                                                            |
| ------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------ |
| Plan registration                                | `9ba3e4d85ae497fffc6d6e8ab70db7883f47ba01` | `docs(governance): register Decision 16 Trae Young rendition plan` |
| Authorization                                    | `518b8a5ea64a769cd39750f17433472a2381cd59` | `docs(governance): authorize Decision 16 Trae Young rendition`     |
| Phase 0                                          | `6149c5ed8361c79e5bb7e40ad5efb221652dee39` | `feat(governance): add Decision 16 rendition contract`             |
| Phase 1                                          | `bdaf478bd36b3f4588471cdfddde4e7d439fd691` | `feat(assets): add Trae Young governed rendition`                  |
| Phase 2                                          | `f1f0f1eb4579008a255c7df088a726948dd59217` | `feat(governance): enforce private artifact size ceiling`          |
| Post-Phase 2 bounded correction / content commit | `079e7edd5155ccaf51590edf428360e49282ef7c` | `fix(governance): remove stale manifest import`                    |
| Review set                                       | `72142c754f5f35c1b394c9669684fc52aa269d4f` | `chore(review): refresh governed review set`                       |
| Private manifest                                 | `896f6bfe3f3ef35a423ac9fccf55bc802e6d6eb2` | `chore(review): refresh Decision 16 private manifest`              |

The current review set has SHA-256
`99f637a0f2195614ff84b9afbdafb236039efcadb4eb7510e66af43f855f58da`
and binds content commit `079e7edd5155ccaf51590edf428360e49282ef7c`.
The current private manifest has 918 files totaling 142,164,887 bytes, binds
build commit `72142c754f5f35c1b394c9669684fc52aa269d4f`, and has file SHA-256
`6e236ae2ced75a1df030ca1c7c8008dbc67c24a48c9ac8769b862ca7e9d6ca03`.

After the private-manifest commit, D16 execution invoked the one authorized
artifact reload exactly once:

```sh
launchctl kickstart -k gui/501/tw.sportsmedicine.atlas.private-review.v1
```

No additional restart, reload, or service/configuration action occurred. The
final `launchctl` state was `0`. This bounded reload was not publication,
deployment, or hosting-service reconfiguration.

## Completed D16 outcomes

| Outcome                         | Recorded result                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Trae source original            | 39,619,306 bytes; retained unchanged in source/history                                                 |
| Governed Trae rendition         | 2,390,278 bytes; current emitted master                                                                |
| Oversized `dist` files          | **0** files greater than 32 MiB                                                                        |
| Largest `dist` file             | `_astro/kyrie-irving.Cvh4vveH.jpg`, 7,867,079 bytes                                                    |
| Original Trae SHA-256 in `dist` | **0 occurrences**                                                                                      |
| Protected other 20 covers       | Source and selection bytes unchanged                                                                   |
| Protected emitted cover outputs | **629/629** identical in path, bytes, and SHA-256                                                      |
| Shared mechanical ceiling       | `src/lib/governance/private-review-limits.ts`; 33,554,432 accepted and 33,554,433 rejected             |
| Clinical freeze                 | **30/30** byte-identical; aggregate `bb02fb617055d836eae29daec6994e499586779a4073fde91213d9e5f7ea2e73` |

The artifact-size problem is resolved: neither `dist` nor the current private
manifest contains a file above 32 MiB, and the 39,619,306-byte Trae source is
not shipped. That success did **not** fix the private verifier because the
verifier failures described below are unrelated to the Trae image size.

## Recorded non-verifier validation

These are the final results measured during D16 execution. This docs-only
closeout did not rerun the heavyweight suites.

| Gate                    | Recorded result                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| Unit and coverage       | **60 files, 1,123/1,123**; statements **87.75%**, branches **84.30%**, functions **94.23%**, lines **88.26%** |
| Playwright              | **224/224** across Chromium, Firefox, WebKit, and mobile Chromium                                             |
| Lighthouse              | **6/6**; accessibility **1.00** on every required route                                                       |
| TypeScript              | Passed                                                                                                        |
| Astro diagnostics       | **235 files, 0 errors, 0 warnings**                                                                           |
| Prettier                | Passed                                                                                                        |
| Decision 15 contract    | **71/71**                                                                                                     |
| Decision 16 contract    | **52/52**                                                                                                     |
| Photo / BY-SA suite     | **172/172**                                                                                                   |
| Plan binding            | Passed, **28 documents**                                                                                      |
| Private manifest        | **918 files**; SHA-256 `6e236ae2ced75a1df030ca1c7c8008dbc67c24a48c9ac8769b862ca7e9d6ca03`                     |
| Final `launchctl` state | **0**                                                                                                         |

These green results establish the completed substantive D16 work. They do not
substitute for the separate mandatory repository verifier gate.

## Mandatory private verifier — NOT ACHIEVED

The plan requires
`npm run private:verify -- --credential-source local-file` to exit 0 and write
a governed receipt. It did not do so.

### Layer 1: default CLI credential failure

Owner execution of the bare command:

```sh
npm run private:verify
```

returned directly:

```text
private-host-verifier:credential-invalid
```

The repository CLI defaults to `--credential-source tty` and reads the
password from an interactive terminal. Headless invocations such as
non-interactive SSH, Codex, or automation do not supply that TTY. This is an
existing CLI design, not a D15 or D16 regression, and it is unrelated to image
size.

### Layer 2: transport failure after bypassing the credential layer

Owner execution of the plan-required credential form:

```sh
npm run private:verify -- --credential-source local-file
```

passed the credential layer and then failed with:

```text
private-host-verifier:transport-failed path=/_astro/cj-mccollum.ngownTQ1_2isaYs.jpg scenario=credential-removed-new-client
```

The named file is only 182,161 bytes, approximately 0.17 MiB, with SHA-256
`05beb30370b128f2e38bbd8a8490c8ee7489096485609d6b243bff86f7ad5f99`.
It is far below the 32 MiB limit.

As a control, the owner made three unauthenticated curl requests to the same
path, using a new, non-reused connection each time. All three returned HTTP
401 in 38–48 ms. This demonstrates normal isolated server behavior for that
path. A relationship to the verifier rapidly creating many new connections
across 918 paths and multiple scenarios is a hypothesis only. It has not been
localized or established as the root cause and is not represented as a
conclusion here.

## No successful D16 receipt

Because the mandatory verifier never exited 0, it produced no successful D16
receipt. `review/served-review-receipt.v1.json` was not updated and remains the
historical receipt last changed by commit
`ba4e6065b51b771c0b05a9b18bb6feffcdbb9632` on 2026-08-09 local time. Its
current file SHA-256 is
`7a6cc42cbd63a29130e51db891051dddc35b73a886cf65bfaaf5ff9538a5e2e0`.

That historical receipt records `checkedAt=2026-08-08T16:13:16Z`, only 61
manifest paths, and private-manifest digest
`5b083d572b9a66bad8532c4d3025b9244d27e2c5997fa3908aadd64604172320`.
It does not cover the current 918-path Decision 16 manifest. It is therefore
not evidence of D16 verifier success and is intentionally left unchanged.

## Closed scopes and final statement

This closeout changed only this repository report and the established external
owner-decision ledger. It did not run the verifier or any receipt-writing
command. The Decision 16 plan, authorization JSON, and plan binding remain
byte-identical. Medical content, covers, photo registry, source policies,
review set, private manifest, `dist`, service configuration, credentials, and
listener state were not changed.

All eight required closed scopes remain closed: `deployment`,
`external-account-mutation`, `hosting-service-mutation`, `indexing`,
`medical-content-authoring`, `medical-review-decision`, `public-release`, and
`remote-repository-mutation`. No push occurred.

**Decision 16 is closed by the owner as partially complete. The mandatory
`private:verify` exit-0/receipt condition was not achieved and is recorded as
such; its investigation is transferred to a separately governed future
Decision.**
