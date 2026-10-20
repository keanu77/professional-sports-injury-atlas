# Contributing / 參與貢獻

歡迎文件、無障礙、搜尋與可查證來源的改善。請保持一個 PR 解決一個具體問題，並說明使用者會看到的變化。

## 不寫程式也能參與

透過[網站投稿頁](https://injury.sportsmedicine.tw/contribute/)提供影片或修正，或在 GitHub 建立內容修正 issue。請包含頁面網址、需要修正的文字、原始來源與日期。新增影片請提供原平台連結、發布者、事件及可觀察的動作；不要上傳下載的轉播影片。

請勿提交私人醫療資訊、未公開病人照片、帳密或第三方未授權素材。一般 issue 不能用於個人診療諮詢。安全漏洞請依 [SECURITY.md](SECURITY.md) 私下回報。

## Choose an issue / 選擇回報入口

Search [existing issues](https://github.com/keanu77/professional-sports-injury-atlas/issues) before opening one. Use the [issue chooser](https://github.com/keanu77/professional-sports-injury-atlas/issues/new/choose):

| Template                  | Use it for                                                                |
| ------------------------- | ------------------------------------------------------------------------- |
| Bug report                | Reproducible software behavior, browser/device, expected vs actual result |
| Feature request           | A specific user task and desired outcome                                  |
| Documentation improvement | README, setup instructions, translations, broken documentation links      |
| Content/source correction | Event text, source links, unavailable media; include dated evidence       |

First contributions can be a single broken documentation step, an accessible label, or a reproducible bug report. See the [scoped contributor issues](docs/community/initial-issues.md); check each live issue for status and coordinate scope before starting. Maintainers confirm scope, label, and review needs before marking an issue `good first issue`. Do not create a PR solely to generate activity.

## Code contributions

1. Start with [the fork guide](docs/fork-guide.md), then follow [the development guide](docs/development.md) using a full Git clone and Node 24.14.0.
2. Create a focused branch. Explain the issue and expected behavior before proposing a large redesign or changing the content model.
3. Run type checks, relevant tests, and the review build. Record exactly what ran and any limitations in your PR. UI changes should include desktop/mobile screenshots and keyboard checks.
4. Keep changes reviewable. Do not reformat historical evidence, regenerate unrelated assets, update approval digests, or weaken failing gates merely to obtain a passing build.

Code and developer-documentation contributions are submitted under the repository's MIT terms. You must have permission to submit them. Content and media submissions retain their separate rights; include the source and proposed permission terms so a maintainer can assess them. A submission is not automatically accepted, medically reviewed, or cleared for publication.

## Content changes

Visible motion alone must not be promoted into a diagnosis. Separate event reporting, medical interpretation, and return-to-sport information; retain uncertainties and dates. A report of return in one athlete does not establish a recovery deadline for another person.

Historical review and decision files are evidence. Correct the current record through the documented review flow rather than silently rewriting the historical record. Maintainers handle publication authorization after review.

## Working together

Be specific and respectful. Discuss evidence and behavior, avoid personal attacks, and do not publish anyone's private information. Maintainer responses depend on availability; there is no guaranteed response or release schedule.

## Pull request checklist

- Link the issue or describe the concrete problem; explain what changed and what stayed unverified.
- List commands and actual results from a clean branch commit. For the fictional demo, also run `npm run demo:check` and `npm run demo:build`.
- Keep both README languages consistent when changing shared facts or instructions.
- Identify content, asset, or release-input changes. Evidence, rights review, clinical review, and publication approval are separate decisions.
- Submit the PR for maintainer review. Do not deploy, merge your own approval, or alter production bindings as part of onboarding.
