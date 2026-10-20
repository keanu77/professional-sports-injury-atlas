# Open-source participation measurement

Use a small monthly table and a short qualitative note. Take the baseline before a permitted public post, then compare at 30 and 90 days. This is an observation plan, not a promise of growth or proof that a post caused a change. Do not add visitor-identification code to carry it out.

## Definitions

| Measure             | Definition and source                                                                                                                          | Interpretation limit                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Stars               | Repository `stargazers_count` at the snapshot time                                                                                             | Interest/bookmark signal, not users, adoption, or clinical endorsement                                                     |
| Forks               | Repository `forks_count` at the snapshot time                                                                                                  | Copies, not verified deployments or active maintainers                                                                     |
| Unique contributors | Distinct human GitHub accounts with at least one merged PR in the reporting window; report maintainer and external counts separately           | An operational definition, not total users or Git author count; exclude bots and avoid guessing identity from names/emails |
| Community issues    | Non-PR issues opened by non-maintainers in the reporting window; separately report actionable reports, duplicates, spam, and unresolved triage | Five maintainer seed issues would not count as five community reports                                                      |
| Accepted PRs        | PRs whose `mergedAt` falls in the window; separate external, maintainer, and bot PRs                                                           | Closed without merge is not accepted; count PRs once rather than counting commits                                          |
| GitHub traffic      | Aggregate views/clones and unique counts available to authorized maintainers                                                                   | GitHub's retention window and definitions apply; overlapping unique windows cannot be added                                |
| Website use         | Existing, lawfully accessible aggregate site analytics or aggregate playback-event counts, with date/source/coverage recorded                  | Playback events and link clicks are not unique people, completed lessons, successful playback audits, or medical outcomes  |

GitHub's [traffic documentation](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-traffic-to-a-repository) describes the recent 14-day window. Capture aggregate weekly snapshots if historical comparisons are needed. The [contributors graph](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-a-projects-contributors) has its own attribution and display limits; do not silently mix its lifetime count with the merged-PR definition above.

## Read-only collection

Use an already authorized GitHub account. These commands do not create issues or PRs and do not expose tokens:

```bash
gh api repos/keanu77/professional-sports-injury-atlas \
  --jq '{stars: .stargazers_count, forks: .forks_count}'
gh issue list --repo keanu77/professional-sports-injury-atlas \
  --state all --limit 1000 --json number,createdAt,state,author
gh pr list --repo keanu77/professional-sports-injury-atlas \
  --state merged --limit 1000 --json number,mergedAt,author
```

Filter issue creation dates and PR merge dates to the same inclusive-start/exclusive-end UTC window. Deduplicate authors by public account login, excluding bots and a declared maintainer list; do not correlate them with private identities. The list limits above can truncate large repositories. If a limit is reached, paginate and reconcile totals before reporting; never present a truncated list as complete. Keep raw author-level exports private and publish only necessary aggregates.

The repository API's `open_issues_count` includes PRs and is not the community-issue metric. A contributor's public handle is sufficient for private deduplication; do not collect email addresses, IP addresses, health information, fingerprints, or cross-site identifiers.

Use only analytics the maintainer is entitled to access and retain. Record `not available` when no aggregate source exists; do not infer zero. The current playback client is page-scoped and respects its privacy controls; this task adds no analytics. Do not export raw D1 events or submission bodies for a promotional report. Do not enable a new provider just to fill an empty metric.

## Recording template

| Window (UTC)             | Stars at end / net change | Forks at end / net change | External human contributors | Community issues / actionable | External merged PRs | Website metric + source + coverage  |
| ------------------------ | ------------------------- | ------------------------- | --------------------------- | ----------------------------- | ------------------- | ----------------------------------- |
| YYYY-MM-DD to YYYY-MM-DD | observed / delta          | observed / delta          | count                       | count / count                 | count               | not available, or defined aggregate |

Add: baseline timestamp, comparison timestamp, excluded bots/maintainer policy, any truncated or unavailable data, and one concrete example such as a merged setup correction. Keep infrastructure failures and review delays visible. Record outreach date/channel separately; without a suitable analysis, do not claim it caused Star growth or teaching benefit. No quotas, purchased engagement, reciprocal-star campaigns, or artificial issues/PRs.
