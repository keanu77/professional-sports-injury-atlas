# Source and video health

Use Node 24.14.0 (`.node-version`) and `npm ci`, then run:

```sh
npm run video:health
# Or write the redacted artifact to another path:
npm run video:health -- /tmp/atlas-health.json
```

The default output is `artifacts/public-video-health.v2.json`. The weekly and manual workflow uploads it even when checks fail and writes a
summary to the Actions run. Pull requests use `Contributor checks` for the
full deterministic unit suite (including the health monitor), plan/content
checks, type checking, review build, brand and artifact validation. Live
publisher access, API authorization and regional availability are separate
operational evidence; they are not required to compile or review a contribution.
The scheduled/manual monitor still exits nonzero for failures or uncertainty;
its result is never converted to success to make a PR green. Request bodies and query strings from final URLs
are not retained. Do not log `YOUTUBE_API_KEY` or upload environment files.

## Interpret each layer separately

| Layer                | Evidence                                                  | Limitation                                                                                    |
| -------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Source availability  | HTTP status, final URL without query, reason and attempts | Does not verify article claims; successful repair targets need editorial review of their text |
| YouTube metadata     | Valid public oEmbed JSON                                  | Metadata availability does not prove playback                                                 |
| Public embed markup  | Matching YouTube iframe in oEmbed response                | Does not prove authorization, regional availability or player behavior                        |
| API embed capability | YouTube Data API `status.embeddable` when authorized      | API flags do not replace browser playback evidence                                            |
| MLB                  | Canonical provider page HTTP result                       | No oEmbed/API embed capability check is implemented                                           |
| Actual playback      | Always `not-performed`                                    | This monitor does not play videos                                                             |

HTTP 404 and 410 are confirmed unavailable responses. HTTP 401/403/451,
challenge pages, 429, 5xx, timeouts and network errors are **indeterminate**,
with separate diagnostic reasons. A blocking response is not evidence that
the article disappeared. Known challenge headers and explicit HTML challenge
titles are detected even if a response is HTTP 200. This is bounded detection,
not a claim to recognize every soft error page.

The monitor identifies itself with `SportsInjuryAtlasHealth/1.0` and the
repository URL. Some publishers admit that client; others block it. Do not
switch to a browser disguise or reclassify a block as success. Four concurrent
requests include body consumption within an eight-second deadline. Only
network, timeout and server errors receive one retry. Bodies are bounded to
64 KiB; oversized JSON is indeterminate.

Exit codes remain nonzero for incomplete or failed checks:

- `0`: implemented checks completed without detected issues.
- `1`: confirmed source/metadata failure or API reports not embeddable.
- `2`: incomplete verification, including access restrictions, unavailable
  API authorization or unsupported provider checks.

When both confirmed and indeterminate issues exist, exit `1` takes precedence;
the artifact still contains all indeterminate results. An exit `0` does not
establish actual playback.

## Authorization and follow-up

The existing workflow reads the repository secret named `YOUTUBE_API_KEY`.
Without an existing authorized key, YouTube API checks report
`youtube-api-key-unavailable` and do not make an API request. Do not create a
token, change account permissions, or request a key in chat as part of routine
health repair. If the owner later authorizes this separately, they can configure
an approved key through GitHub's secret UI and rerun the workflow. The key must
stay out of committed files, commands, artifacts and messages.

Check a reported 404 again before replacing a citation. Prefer the same
publisher's moved article or the original report, read the text, and preserve
the supported facts and source-index bindings. Keep an unresolved source and
its uncertainty visible when an equivalent replacement cannot be verified.
Do not rewrite historical clinical, playback or release approvals to make a
maintenance build pass. Source changes require the normal authorized release
review before any production release.
