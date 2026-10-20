# Fork guide / Fork 與示範部署

There are two supported local starting points. **Contributing to the atlas** uses its existing review build. **Learning to build your own catalog** uses an isolated, fictional demo with no restricted content in its output. Neither route approves a new medical collection for publication.

中文重點：想改原專案，走 review 流程；想做自己的網站，先用獨立虛構示範。完整 clone 仍包含原站的編輯資料與歷史，只有 `examples/fork-demo/dist/` 是此處測試的純示範產物，不能把整個 repository 當成可任意重新散布的資料包。

## 1. Fork and clone

On [the repository](https://github.com/keanu77/professional-sports-injury-atlas), choose **Fork**, select your account, and create the fork. A GitHub account is needed to fork or submit a PR; local development needs no API key. See GitHub's [fork instructions](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo).

Replace `YOUR-ACCOUNT` with your GitHub username:

```bash
git clone https://github.com/YOUR-ACCOUNT/professional-sports-injury-atlas.git
cd professional-sports-injury-atlas
git remote add upstream https://github.com/keanu77/professional-sports-injury-atlas.git
git switch -c docs/my-improvement
```

Use a full clone. Do not use `--depth 1`, Download ZIP, or a history-free template for atlas provenance checks. If only learning locally, clone the upstream URL instead; the `upstream` remote is optional. GitHub's server-side Fork step is documented, not exercised by our local smoke test.

## 2. Install

Use **Node.js 24.14.0** from [Node.js](https://nodejs.org/en/download) or your version manager; the version is pinned in [`.node-version`](../.node-version).

```bash
node --version
npm --version
npm ci
```

The tested toolchain is Node 24.14.0 / npm 11.9.0. For the **full atlas** on Ubuntu, also install `fonts-noto-cjk` as documented in [development.md](development.md). The isolated demo uses system fonts and has no image renderer. Do not upgrade the lockfile just to start the project.

## 3. Run the fictional demo

From the repository root:

```bash
npm run demo:dev -- --host 127.0.0.1
```

Open the URL printed by Astro. Expect “My Learning Catalog”, two fictional samples, and “No clinical approval”. Stop the server with Ctrl+C when finished.

The demo has a separate Astro root at [`examples/fork-demo/`](../examples/fork-demo/). Its original sample text is explicitly included in the MIT grant. It imports no atlas records, photos, review signatures, Functions, telemetry, or third-party media. This is a small static teaching example, not feature parity with the atlas or a turnkey medical publishing system.

Validate and preview it:

```bash
npm run demo:check
npm run demo:build
npm run demo:preview -- --host 127.0.0.1
```

Expected output is **only** `index.html`, `robots.txt`, and `_headers` under `examples/fork-demo/dist/`. The build checks that file list, noindex metadata, absence of active embeds/resources, and the demo notice. This mechanical check cannot judge clinical accuracy, originality, or licensing of text you later enter. Review every addition. The root `dist/` remains the atlas build output; do not confuse the two directories.

The dev/preview npm scripts first enter the demo directory so background servers resolve the same root as foreground runs. Astro CLI behavior and server stop/status controls are documented in the [CLI reference](https://docs.astro.build/en/reference/cli-reference/). If a preview persists after its launcher exits, run `npx --no-install astro preview stop --root examples/fork-demo` rather than killing unrelated processes.

## 4. Replace identity and sample content

| Change                                   | Demo file                                                                           |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| Site title, maintainer name, description | `examples/fork-demo/src/demo.json`                                                  |
| Original synthetic records               | `records` in the same JSON; unique lowercase IDs and `status: "synthetic"` required |
| Layout and colors                        | `examples/fork-demo/src/pages/index.astro`                                          |
| Build configuration                      | `examples/fork-demo/astro.config.mjs`                                               |

Keep the fictional notice and noindex while experimenting. Do not enter real patient information. Do not change `synthetic` to `approved`: this demo does not implement medical review. Preserve the MIT copyright notice when redistributing the original code. Use your own identity; the upstream maintainer's name, logos, and clinical endorsement do not transfer to a fork.

For a full atlas adaptation, the relevant implementation map includes `src/layouts/BaseLayout.astro`, `src/components/layout/`, `src/lib/patient/public-domain.ts`, `src/lib/social/`, `astro.config.mjs`, `src/content/`, and `src/data/`. These contain a mixture of implementation and editorial/identity material. Audit each dependency and create your own records; changing a title or domain alone is insufficient. Full atlas rebranding and clinical deployment have not been validated as an automated fork workflow.

## 5. Review, public, and demo are different

| Path                                  | Purpose                                                                                  | Output / publication boundary                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm run dev`, `npm run build:review` | Work on the upstream application with its review rules                                   | Root `dist/`; noindex is **not** access control. Host private review material only behind tested authentication. |
| `npm run release:public`              | Maintainer release with source, rights, review, input digest, and recent playback checks | Root `dist/`; requires current authorized evidence.                                                              |
| `npm run demo:build`                  | Original fictional onboarding example                                                    | `examples/fork-demo/dist/`; no clinical approval, no backend or media.                                           |

For upstream contributions, run the [standard checks](development.md). Do not set public environment flags to circumvent `release:public`, disable failed checks, copy credentials, refresh someone else's approval digest, or repurpose existing review signatures. Changes to `package.json` or renderer inputs can invalidate prior release evidence even when a review build passes.

## 6. Optional Cloudflare demo upload (manual, not tested live)

You can build the demo without a Cloudflare account. A live upload requires your own account and a **new, uniquely named Pages project**. This task did not create or deploy one.

1. Run `npm run demo:build` and inspect all three files.
2. In Cloudflare Workers & Pages, choose the Direct Upload / drag-and-drop flow to create a new project. Upload **only the contents of `examples/fork-demo/dist/`**.
3. Use your own project name, never `sports-injury-atlas`. This static demo requires no D1 database, API key, Functions, or environment variables. Do not copy the root `wrangler.jsonc`, deployment scripts, or production bindings.
4. Inspect the resulting page and response headers, including `X-Robots-Tag` and CSP. Confirm no requests go to the upstream site or a third-party media service. `noindex` does not make the deployment private.

See [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/). Direct Upload and Git integration have different project workflows; choose deliberately. Uploading is a public hosting action and remains manual. The demo verification is local, not evidence that Cloudflare applied headers or access controls.

To add the full atlas backend later, provision your **own** preview and production D1 databases, review migrations under `migrations/`, replace all project/domain bindings, and configure your own submission abuse protection and secrets. Review `functions/` and its environment contracts. This extension is outside the tested starter; never run the root `deploy:public` against someone else's project or use upstream production data for testing.

## 7. Establish your own editorial process

Before introducing real content, define a schema and publication policy using [content-contract.md](content-contract.md) as a design reference. For each record:

1. Record source URL, publisher, date, observed facts, and uncertainty. Record rights separately from accessibility or embeddability.
2. Separate observation, public reporting, clinical interpretation, and return-to-sport information. Obtain qualified review for clinical statements.
3. Assign your own reviewer, version, decision, and evidence binding. Upstream approvals identify upstream content only.
4. Require validation, rights clearance, playback verification where applicable, and explicit release approval before a public build. Verify the artifact and deployed behavior independently.
5. Provide correction, private security, withdrawal, and re-review processes. Recheck sources without interpreting a 403 or timeout as proof of a dead link.

A prototype is not a clinical endorsement. The [license scope](../LICENSE-SCOPE.md) excludes the upstream medical collection, historical reviews, identity marks, and third-party media unless an individual license explicitly permits reuse. An embed URL is not permission to download and redistribute a video.

## 8. Troubleshooting / 常見問題

| Symptom                                             | Next step                                                                                                                                      |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Node engine error                                   | Match `.node-version`, confirm `node --version`, then rerun `npm ci`.                                                                          |
| `npm ci` cannot resolve the registry                | Check network/proxy access. Do not delete the lockfile or disable integrity checks.                                                            |
| Provenance or dirty-tree failure                    | Use full Git history and commit the intended changes on your branch before final checks. A clean checkout does not authorize a public release. |
| Missing Chinese glyphs in atlas image tests         | Install the documented Linux CJK font; the demo itself does not require it.                                                                    |
| Port already occupied / preview seems to exit       | Read Astro's printed endpoint and use its documented status/stop controls for that root.                                                       |
| Demo reports unexpected files or resources          | Inspect `examples/fork-demo/dist/` and new imports. Do not relax the verifier to bundle upstream assets.                                       |
| Demo has no players, videos, or API counts          | Expected: only fictional onboarding content is included. Use the live atlas to explore the full interface.                                     |
| Root review content differs from the public website | Expected: review and public selectors have different rules.                                                                                    |
| Public release gate rejects a fork                  | Establish your own rights, review, and release evidence. Do not reuse upstream signatures or disable gates.                                    |

Current test scope and results are in [the implementation report](open-source-growth-report.md). Native Windows, an account-level GitHub Fork, Cloudflare deployment, and a complete independently reviewed medical fork are not verified by the local demonstration.
