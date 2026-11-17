# Current playback evidence and release procedure

The authoritative registry is `docs/reviews/current-playback.v1.json`. It starts as `pending` with no fabricated evidence. If the registry exists, `check-release.ts` requires this current path for every public core/observation entry. Pending, malformed, stale or incomplete evidence fails; none of those states fall back to older successful receipts. The legacy playback checks run only if the registry does not exist.

The registry is operational playback evidence, not a clinical approval. Existing content/source checks, patient and core medical approvals, clean-tree checks, release-input binding, and final artifact checks remain in force. No historical approval or receipt was edited by this implementation.

## 1. Prepare pending and freeze application inputs

1. Keep the registry `pending` while implementation and review are unfinished. Archive the previous ready registry and receipt files under a dated review directory before starting a new evidence cycle; do not overwrite historical receipts.
2. Complete and commit the intended application changes together with the pending registry. Use a full Git history. Record that application commit as `SOURCE_COMMIT`.
3. Build the corresponding review/owned HTTPS preview using the established review process. A local or explicitly preview-only build is not a production release. Verify that the target `/version.json` names the tested application commit; an owned preview is sufficient and production need not be deployed first.
4. Keep application inputs unchanged during playback. The default working receipt `artifacts/playback-current.json` is explicitly Git-ignored, so a first run does not make a later `--resume` dirty. The entire `artifacts/` directory is **not** ignored. For a custom output inside this checkout, verify `git check-ignore <output>` succeeds before collecting evidence; otherwise use a temporary location outside the checkout. Do not save working output directly into tracked review files.

## 2. Collect actual playback evidence

```sh
node scripts/public-launch/verify-expansion-playback.mjs OWNED_HTTPS_PREVIEW artifacts/playback-current.json --resume
```

The worklist derives from the current public catalog, not a fixed count. It verifies actual video progress, exact provider/video/timecode and any required captions. A metadata/HTTP check cannot substitute. `--inventory` lists the work without launching a browser. A batch flag or one slug can restrict collection; the final registry must still cover all public paths. With `--resume`, restricted runs preserve other paths and prior attempts in the same working file, and append new attempts only for requested items that lack acceptable current evidence. A newer failed attempt remains authoritative until a later valid success supersedes it.

If HEAD later contains only evidence/documentation commits, the same tested preview may still be checked with:

```sh
node scripts/public-launch/verify-expansion-playback.mjs OWNED_HTTPS_PREVIEW artifacts/playback-current.json --resume --source-commit SOURCE_COMMIT
```

This option accepts only a full commit SHA that exists as an ancestor and has unchanged release inputs. It does not permit a dirty source, a different deployed revision, or changed application files. Resume uses the same strict selector as release, including latest-failed-attempt precedence and required captions.

## 3. Review and bind the receipts

After actual playback, the responsible operator reviews failures, required caption evidence, affected paths and the recorded version. A failed or unverified item remains incomplete; do not change its status manually to `played`.

Copy completed, unmodified receipt JSON into a new dated directory under `docs/reviews/`. Fill the registry with:

- `sourceCommit`: the actual committed application revision built and played.
- `inputTreeDigest`: the result of `inputTreeDigest()` for unchanged application inputs.
- `catalogDigest`: the shared inventory digest recorded with the receipts.
- `origin`: the exact owned HTTPS preview or production origin used for playback.
- `receiptFiles`: distinct `{ "path": "docs/reviews/.../receipt.json", "sha256": "..." }` entries, using the SHA-256 of exact file bytes.
- `status`: `ready` only after complete operational evidence review. This field does not sign off medical content or authorize an otherwise unapproved publication.

Commit these documentary bindings. A later documentation commit is expected: the loader proves `sourceCommit` is a real ancestor and that the Git difference contains no actual release-input changes. This avoids demanding that a receipt somehow name the future commit that stores itself.

The shared scope is exported as `RELEASE_INPUT_PATHS` and `isReleaseInputPath()` from `scripts/public-launch/input-tree.ts`. Only the existing `src/data/public-launch.v1.json` binding metadata exclusion is retained. The loader also rejects untracked/ignored application inputs. It then checks the current input digest and catalog digest against the registry. Changing code/assets/content and refreshing a manifest hash cannot make an old playback revision valid.

## 4. Validate release separately

`check-release.ts` still verifies the original `approval.inputTreeDigest`, clinical/source/patient gates and other governed evidence. A ready playback registry alone cannot make those checks pass. Any legitimate new release-input binding must follow its existing authorization process; never edit historical approval values solely to silence an error.

Receipt files are restricted to JSON under `docs/reviews/`, with no traversal or symlink components. Reads have per-file and aggregate bounds and exact digest checks. The selector rejects wrong paths/origins/versions, future or older-than-seven-day evidence, conflicting newest receipts and missing playback progress. The latest matching failed attempt supersedes an older success.

No actual preview deployment or playback was performed while implementing this integration. The initial registry remains pending by design.

## Implementation verification

The integration was checked with temporary Git repositories: documentary commits pass; changed runtime inputs, untracked inputs, unrelated commits, a missing public path, bad digests, traversal, symlinks, oversized files and a newer failed attempt are rejected. The six focused monitoring/playback/public-launch test files passed 71 tests. Astro diagnostics reported 437 files, zero errors/warnings and 17 pre-existing hints. The playback runner's inventory-only command also succeeded; the full release command was not represented as passing.

Independent review found and fixed two resume issues: the default output was not ignored and therefore made the next run dirty, and a restricted resume overwrote receipts for other paths. The runner now preserves prior attempts and tracks completion separately for the requested worklist. Three focused playback test files passed 31 tests, including actual temporary Git checks and a mocked runner import proving filtered preservation and latest-failure retry. No real browser/media request or release was performed by these regression tests. The other playback runner defaults to `/tmp/atlas-live-playback.json`; the artifact checker writes the already-ignored `artifacts/public-launch-receipt.v1.json`.
