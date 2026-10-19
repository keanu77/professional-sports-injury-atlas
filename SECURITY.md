# Security policy

## Report privately

Do not open a public issue containing a vulnerability, exploit, credential, personal information, or a production data sample.

If **Report a vulnerability** is available under this repository's Security → Advisories page, use that private channel. GitHub provides this feature for public repositories when enabled; do not assume it is enabled merely because this file exists. Otherwise, contact the maintainer through [sportsmedicine.tw/contact](https://sportsmedicine.tw/contact/) with a brief request to arrange a private security report. Do not put secrets or exploit details into that initial form submission.

Include the affected URL or commit, expected and observed behavior, minimal reproduction steps, and the potential impact. Use synthetic data and redact credentials. Do not test destructive actions, access other users' data, or send large volumes of traffic to the live site.

## Supported scope

Security fixes target the current maintained branch and live release. Older commits, personal forks, and historical review deployments are not independently maintained. There is no published response-time guarantee or bug bounty program.

The attack surface includes Cloudflare Functions, D1-backed counters/submissions, browser rendering, build provenance, dependencies, and private review hosting tools. A static page passing checks does not establish that every service is secure.

## Keep out of Git and artifacts

- Cloudflare tokens and database credentials, YouTube API keys, GitHub tokens, and webhook secrets.
- Private review passwords, authorization headers, cookies, credential hashes, and session data.
- Personal information in submissions or logs, private URLs, and unredacted request bodies.

`.env` and `.dev.vars` files are ignored; that does not protect a secret copied into another file. Review staged changes and generated artifacts before committing. Do not upload production data when reporting a bug.

## If a secret is exposed

Revoke or rotate it at its provider first, then identify affected deployments and sessions. Remove it from current files and logs, investigate access, and coordinate any history cleanup with the maintainer. Deleting a file or making a repository private again does not revoke a copied credential. Never paste replacement credentials into an issue, PR, or chat.

## 中文摘要

漏洞請私下回報，不要在 issue 貼帳密、cookie、個資或可直接攻擊正式站的細節。若 GitHub 尚未提供私人漏洞回報入口，請先透過維護者聯絡頁安排安全的回報方式。金鑰外洩要先撤銷或輪替，再處理檔案與紀錄。
