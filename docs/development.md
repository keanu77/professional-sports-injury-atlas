# Development guide

## Supported starting point

Use a full Git clone, Node.js **24.14.0**, and `npm ci`. Ubuntu 24.04 and macOS are the documented development environments. Native Windows has not been validated; WSL with Ubuntu is a reasonable starting point but is not a tested platform here.

On Ubuntu install the build-time Chinese font first:

```bash
sudo apt-get update
sudo apt-get install -y fonts-noto-cjk
```

The Linux share-image renderer uses `/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc`. Its isolated fontconfig environment prevents host font caches from affecting Astro. The browser WOFF2 subset alone is insufficient for the Linux image renderer. Other Linux distributions must provide the same file or adapt the font resolver.

`package.json` accepts Node 24.14.x through 24.x; `.node-version` pins the tested version. Avoid rewriting the lockfile with a different Node/npm toolchain.

## Development and checks

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Astro. `dev` runs review mode. It is intended for layout and workflow development, not a local copy of the complete public catalog. Review output is marked `noindex`; this is not authentication. Do not upload private review material to a publicly reachable host on the assumption that `noindex` protects it.

Before a pull request:

```bash
npm run check
npm run test:unit
npm run build:review
npm run verify:review-artifact
```

Some provenance checks inspect tracked bytes, history, and the current tree. Full validation should run on a **clean commit in your branch**. Do not remove these checks to accommodate a ZIP export or a shallow clone. Work-in-progress type checks and individual unit tests can run while editing; final verification uses the committed tree. CI checks out full history for the same reason.

After building:

```bash
npm run preview -- --host 127.0.0.1
```

Use the address Astro prints. Astro 7 preview may leave a background server running after its launcher exits. Do not treat the launcher's exit as proof that the preview failed; check the actual endpoint and stop the server through Astro's supported server controls when finished.

## Browser tests

The project uses Playwright and Axe. Browser binaries and OS dependencies are separate from `npm ci`:

```bash
npx playwright install --with-deps chromium
```

Inspect `playwright.config.ts` before running `npm run test:e2e`: the configured suite includes multiple browsers, and public-only scenarios require the separately authorized public build. A Chromium-only run does not verify Firefox or WebKit. If using an existing local preview, verify its build and port before allowing reuse. The default aggregate `npm run verify` is the extensive maintainer workflow, not the minimal first-run command.

## Secrets and optional services

- Ordinary review development needs no secrets.
- `.env.example` documents the optional YouTube Data API key. Without it, identity/embeddability checks record the missing evidence; do not relabel this as successful API validation.
- Astro alone does not execute Cloudflare Functions. Popularity, telemetry, and submissions require a separate local Cloudflare/D1 setup with development bindings.
- Never use production credentials or D1 databases for a contributor test. Do not commit `.env`, `.dev.vars`, cookies, private review credentials, or unredacted request logs.

`npm run video:health` checks external availability and metadata. Successful checks do not establish actual playback, caption availability, clinical validity, or content rights.

## Public releases and forks

`npm run release:public` checks authorization, input digests, source and review provenance, and recent playback evidence before building. `npm run deploy:public` additionally deploys to the maintainer's Cloudflare project. Neither command is part of contributor onboarding.

Changing production input files invalidates the previous release's input digest. A successful review build is not approval to deploy those changes. Maintainers must bind fresh evidence before a later public release; do not automatically copy a new digest into an approval to make a gate pass.

The software is reusable under MIT, but the current curated collection and media have separate rights. See [LICENSE-SCOPE.md](../LICENSE-SCOPE.md). Forks need their own deployment configuration and rights/review process. This repository is not yet a one-command template for publishing a new medical collection.
