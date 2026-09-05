# HANDOFF — 2026-09-06 (atlas)

Only this repository; do not overwrite another project's handoff.

## Current state

Decision 20 is locally implemented and validated. **Private-host refresh remains
blocked on explicit user permission after an automatic approval rejection.**
Decision 21 has not started.

- Branch: `main`; validated artifact commit: `44c25e6`.
- Final docs-only commit follows it; check `git log -1` and `git status --short`.
- 26 cases / 148 effective owner-approved items; no approval badge; no pending
  markers on real case pages. Pending fictional fixtures remain pending.
- 26 sidecars and all D18 receipts/research stay byte-identical to `7913428`.
- Approval is in `review/follow-up-approvals/decision-20.ledger.v1.json` and an
  independent adoption receipt. The loader preserves D18 provenance, then checks
  D20 authority and exact item payloads before projecting approval in memory.
- Owner approval date remains **2026-08-16**, not this implementation date.
- 1,289/1,289 unit tests, 244/244 four-browser Playwright tests, tsc and Prettier
  pass. Clinical freeze: 30/30 unchanged. Local private runtime snapshot: 915/915.

## Resume here

The attempted `scp` of the local Git bundle, approximately 134 MiB private
review dist archive, and memory-only smoke script to `mac-mini:/tmp/` was
rejected by automatic approval review. It said the conversation lacks trusted
user authorization specifying the payload and destination and prohibited bypass.
**Nothing was transmitted and no service was reloaded.**

Ask only if the user has not already approved that transfer in the resumed
conversation. Once approved, complete the existing private-site refresh:

1. Read the validation report below; recheck mini identity, clean checkout and
   HEAD. At last read-only check it was clean at `7913428` under
   `/Users/ethanai/co-work/online_sportsinjury/professional-sports-injury-atlas`.
2. Transfer the prepared files to mini. Recreate the bundle including this
   docs-only handoff commit if needed; no remote creation or git push.
3. Fast-forward mini from the local bundle, preserve its old dist as a rollback
   copy, and replace dist. Do not overlay the old hashed assets (extra files
   invalidate the manifest). Keep the original Git history intact.
4. Use Node 24.14.0 and call `loadPrivateReviewSnapshot` on mini first. Then
   `launchctl kickstart -k gui/501/tw.sportsmedicine.atlas.private-review.v1` once.
5. Run the prepared smoke script on mini from the repo via Node `--import tsx`.
   It reads the existing credential internally and never prints it. Verify all
   915 credentialed hashes/lengths, 915 anonymous 401/empty responses, and the
   served 26-page/148-approved-item boundary. Update the report with actual results.

## Local artifacts and validation

- Report: `docs/reviews/2026-08-16-decision-20-p6-final-validation.md` (actual
  validation date 2026-09-06; filename follows the original plan).
- Design/audit: `docs/reviews/2026-09-06-decision-20-ledger-implementation.md`.
- Evidence: `docs/reviews/evidence/decision-20/final/local-validation.v1.json`.
- Review-set digest: `c5eec4aacd9e0a293aae3644948378c26c94fa86bcc207b8a1c7db11749629bc`.
- Private-manifest digest: `203cde6974e7f42239fc7fa481c4eef481a3a5187b4209d4dc0f553b6f2d56c6`.
- `/tmp/atlas-d20-20260906.bundle`, `/tmp/atlas-d20-dist-20260906.tar.gz`,
  `/tmp/atlas-d20-served-smoke.mjs` are prepared on Studio. `/tmp` is ephemeral.

## Environment and known limits

- Studio Node: `/Users/ethanstudio/.local/share/mise/installs/node/24.14.0/bin/node`.
  Default Node is 24.19.0; prepend the correct bin directory to PATH.
- Mini Node: `/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin/node`.
- Mini IP remains `100.114.3.93`. The private launchd job currently has no PID,
  LastExitStatus 256, and recent `artifact-invalid` log entries. Do not claim
  the old private site is healthy based on the August handoff.
- Use `ATLAS_E2E_PORT=14321 npm run test:e2e`. Port 4321 already runs an old atlas;
  leave it alone. Playwright now refuses to reuse an unknown existing server.
- Canonical D18 JSON is excluded from Prettier to preserve frozen digests.
- The old external lead package was copied read-only from mini into
  `docs/reviews/evidence/decision-20/migration/`; its exact original hash is
  unchanged and the checker uses it only when the original local path is absent.
- Keep source changes committed before corpus checks: dirty paths fail closed.
  Artifact order remains review-set generation/commit, build, manifest/commit,
  then private-service reload. Documentation-only commits can follow.
- `private:verify` timeout/credential-source issue remains deferred. Lighthouse
  was not run; D17's prior borderline performance gate is not newly resolved.
- Decision 18's separate historical closing record remains outstanding.
- Public release, indexing, remote creation and git push stay closed.
