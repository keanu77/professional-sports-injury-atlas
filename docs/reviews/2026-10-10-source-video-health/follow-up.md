# Follow-up: Elliott source and Linux race fixture

This follows the initial `285acbd` review. The initial local/CI health snapshots
remain historical evidence; they are not rewritten to imply a rerun.

## Elliott's return evidence

The original LFC source remained HTTP 404, as did its legacy-host version, two
AMP variants and LFC/legacy's `behind-closed-doors-friendly-revealed-harvey-elliott-stars`
media-watch article. The media-watch article points back to an original
[Liverpool Echo report](https://www.liverpoolecho.co.uk/sport/football/football-news/harvey-elliott-liverpool-game-breaking-22917827).

Two independent readers obtained the Echo article via live HTTP 200 and read
its article body. The JSON-LD identifies **Tom Cavilla**, publication
**2022-01-29T14:11:21Z**, and the headline “Liverpool behind-closed-doors friendly
revealed as Harvey Elliott stars alongside recalled duo”. It reports that day’s
closed-door U23 match against Wrexham, 60 minutes played, a goal and an assist,
while Elliott was working toward first-team return.

The source URL/title and publication date are corrected in the two batch-31
records. The exact existing claims remain:

- `returnDate`: `2022-01-29`.
- `returnSummary`: `2022-01-29 先於對 Wrexham 的閉門友誼賽回場。`
- `context`: `這場是復健過程的閉門友誼賽，不等同一軍正式賽事復出。`

Diagnosis, clinical details, timeline and source-index bindings are unchanged.
The repair manifest now contains **13 repaired URLs**, with no unresolved URL
among the 17 initially reported 404 responses; four original federation URLs
were retained after successful identified-client retrieval. This does not
claim all other sources are accessible or every video can play.

## Linux baseline and cause

[Diagnostic run 38060897997](https://github.com/keanu77/professional-sports-injury-atlas/actions/runs/38060897997)
ran the exact test and production code from main `cc0b2fe`, with only a
temporary diagnostic workflow added (`2230c6d`). The same race test failed:
the expected rollback error was not thrown. No real Keychain or system service
was called: the existing test uses synthetic command runners and a disposable
fixture tree.

The inode probe found **32/32 immediate inode reuses** after unlink/recreate on
Linux, versus **0/32** on Mac Studio. Renaming and retaining the old file before
creating a replacement produced **32/32 distinct identities** on both systems.
The current guard compares device/inode identity. The old test assumed deletion
guaranteed the next created file had a different inode, which is false on this
Linux runner. Probe details are preserved in
[follow-up-evidence.json](follow-up-evidence.json).

For transparency, the first diagnostic run (`38060719100`) displayed success
because its `tee` pipeline did not preserve the test's failure status. Its
artifact already showed the failing test. The diagnostic workflow was corrected
to explicit Bash/pipefail; the later run linked above correctly failed. The
actual PR checks invoke npm directly and were not affected by this diagnostic
mistake.

## Minimal test correction

The fixture now renames the original file to a held path, then creates the
racing replacement. It checks that their inodes differ **outside** the callback
caught by the provisioning function, so a fixture assertion cannot masquerade
as the expected rollback exception. It also checks that the racing file is not
overwritten and that the held original retains its contents. Existing old-token
restoration and two synthetic Keychain-update assertions remain.

No private-hosting implementation, security setting, OS permission, credential,
test skip, or threshold was changed. This repairs the test's distinct-file
replacement premise; it does not introduce a new claim that the production
guard detects all same-inode content changes or every possible race.

The final commit's complete checks and health artifact are linked from the draft
PR description. The unrelated historical formatting/coverage/E2E/Lighthouse
issues remain outside this follow-up. YouTube API authorization is still
unavailable and remains a separate owner decision.
