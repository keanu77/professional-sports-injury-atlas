# Decision 32 baseball fielding/running research

Research date: 2026-09-06. Read-only public research; no repository files changed.

## External model

Codex CLI first attempted configured gpt-6-astra and exited 1 because installed CLI was too old for that model. Retried explicitly with gpt-5.5, read-only sandbox, skip-git-repo-check, stdin /dev/null, isolated /tmp folder. Retry exited 0 and used live web tools. Original failure retained in codex-astra-failed.log; successful output and status retained separately. No claim that the failed attempt performed an audit.

## Source pass 2

Each adopted injury and return date was independently searched, and the primary article was opened directly. Model output agrees with the four draft events:

- Schwarber: injury 2016-04-07; first actual AFL DH game 2016-10-22; 198 elapsed days. MRI and surgical reports confirm ACL/LCL, not the MCL typo in October activation press release. Ankle sprain separately stated by MRI-era report. Do not inherit YouTube's initial ankle-only description as definitive diagnosis.
- Harper: injury 2017-08-12; actual MLB return 2017-09-26; 45 days. Bone bruise/no ligament-tendon damage source is August 13; calf strain comes from return report. Simulated practice is not counted as competitive return. No universal recovery prediction is derived.
- Dustin Fowler: injury 2017-06-29; actual spring return 2018-02-25; 241 days. Canonical injury article currently displays publication June 30, while AMP/search displayed June 29. Draft publishedAt uses June 30, eventDate remains June 29. First spring game is corroborated by actual three-plate-appearance recap, not only advance roster announcement.
- Jeter: injury 2012-10-13; actual spring DH return 2013-03-09; 147 days. March 8 was simulated practice; April 18 new fracture explicitly separated so first spring return is not portrayed as sustained full-season recovery. Root native playback must resolve unavailable first video; alternate official MLB discussion video may contain original replay, not yet assumed.

Data drafts: candidates.json, clips.draft.json, events.draft.json. Video timings and duration are intentionally unfinished for root native iframe verification. Source-review.json contains sources and independently calculated intervals. Root must verify each adopted observation against moving footage rather than relying on search snippets.

## Rejected alternate

Adam Eaton: injury 2017-04-28, MLB IDs qv0FVaZSqSY / J1iIgGSiSFc. March 17, 2018 Grapefruit debut is not earliest; MLB March 11 confirms previous minor-league backfield games without exact earliest date. Prefer known-date Jeter if footage works. Eaton can only use null earliest return unless further evidence resolves that date.


## Final replacement after root playback rejection

Jeter is excluded from the final batch: cvSpYbdfT9c failed native playback; T2s5QqxPyDA contains a different September 2013 event; xandwR3KVmk was only a text card. The root reported these direct observations. Preserve Jeter research as rejected candidate evidence, not an active entry.

Adam Eaton replaces Jeter. Files eaton.clip.json and eaton.event.json are the authoritative fourth draft. eventDate 2017-04-28; returnDate null. Known later milestone is 2018-03-17 Grapefruit League actual game; March 11 MLB source establishes prior minor-league backfield games, so no earliest-date interval is calculated. April 30 diagnosis and May 10 surgical report support left ACL/meniscus injury and associated high ankle sprain. Model output above audited the original four, not Eaton; Eaton was researched and primary-source verified separately by this agent and requires the root independent source pass. This distinction must stay explicit in final audit claims.
