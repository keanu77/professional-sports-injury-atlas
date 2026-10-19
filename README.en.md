# Sports Injury Video Atlas · 運動傷害影片圖鑑

A video index for sports medicine learners and educators: find material by athlete, sport, and body region, then follow the sources and return-to-sport context. Curated by sports medicine physician Yi-Cheng Wu.

**[Explore the website →](https://injury.sportsmedicine.tw/)** · [繁體中文](README.md) · [Contribute](CONTRIBUTING.md) · [Code license and content scope](LICENSE-SCOPE.md)

[![Actual workflow: search an athlete, open a video page, and inspect sources](docs/media/catalog-demo.gif)](https://injury.sportsmedicine.tw/)

## What can you use it for?

- **Find teaching material:** search athlete names and Chinese or English keywords, then narrow by sport, body region, and video type.
- **Trace information:** follow event pages to original reports and videos, distinguishing visible movement, public reporting, and medical interpretation.
- **Read return-to-sport context:** inspect sourced event dates and follow-up information while preserving uncertainty and individual differences.
- **Explore interface patterns:** restored catalog filters, article navigation, related videos, dark mode, text sizing, and keyboard interaction.

As of October 20, 2026, the public website contains **200 videos across 30 sports and 14 body regions**: 7 core cases and 193 observation pages. Their depth and review processes differ; these are not 200 equally validated clinical cases. Video types can overlap and should not be added together. The interface is primarily Traditional Chinese and supports searches for English athlete names; a full English interface is not available yet.

This is an educational and information discovery tool. Videos cannot establish a diagnosis, prescribe treatment, or determine return-to-sport clearance. The collection is not a diagnostic ground-truth dataset. No user-count or teaching-outcome claims are made. Videos are delivered by their original platforms; embedding and playback can change with location or rights-holder settings.

## Run locally

Install Git and **Node.js 24.14.0** ([`.node-version`](.node-version)). On Ubuntu, install Chinese fonts so share images and their tests can render Chinese correctly:

```bash
sudo apt-get update
sudo apt-get install -y fonts-noto-cjk
git clone https://github.com/keanu77/professional-sports-injury-atlas.git
cd professional-sports-injury-atlas
npm ci
npm run dev -- --host 127.0.0.1
```

On macOS, omit the two `apt-get` commands. Open the URL printed in the terminal. The public repository can be cloned directly; neither the live website nor ordinary local development requires an account.

The default is **review mode** for development and review, with different content from the public website. Ordinary local development does not require API keys. Provenance checks depend on Git history, so use a full clone rather than Download ZIP or `--depth 1`. Complete checks need a clean, committed working tree; see the [development guide](docs/development.md).

| Command                               | Purpose                                                             |
| ------------------------------------- | ------------------------------------------------------------------- |
| `npm run check`                       | Astro and TypeScript checks                                         |
| `npm run test:unit`                   | Unit and data-contract tests                                        |
| `npm run build:review`                | Generate the review website                                         |
| `npm run verify:review-artifact`      | Validate the generated review artifact                              |
| `npm run preview -- --host 127.0.0.1` | Preview the generated website                                       |
| `npm run video:health`                | Check external video and source status; this is not a playback test |

## Architecture and publishing

Astro, TypeScript, and small browser-side interactions; production runs on Cloudflare Pages, Functions, and D1. The ordinary Astro development server does not run Cloudflare APIs, so popularity rankings, view counts, and submissions require a separate Cloudflare development environment.

Public releases have additional source, content-review, asset-rights, and playback gates. `release:public` is a maintainer workflow, not an installation step. Forks should establish their own content and review processes; existing review signatures do not approve new content.

- [Development and verification guide](docs/development.md)
- [Content contract](docs/content-contract.md) and [original architecture record](docs/architecture.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Changelog](CHANGELOG.md)

`docs/decisions/`, `docs/reviews/`, and `docs/superpowers/` retain historical decisions and verification snapshots. Their dates, counts, and review-only statements describe those versions, not the current website.

## Contribute

Documentation fixes, accessibility and search improvements, and verifiable video sources are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md). You can also suggest videos or corrections through the [website submission page](https://injury.sportsmedicine.tw/contribute/) without writing code. Report security vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

If the index or its interface implementation helps you, a Star makes it easier to find again.

## License

Original code and developer documentation use the [MIT License](LICENSE). **Medical editorial content, curated records, and third-party videos and images are outside the code's MIT grant**; see [LICENSE-SCOPE.md](LICENSE-SCOPE.md) for the complete boundaries. Platform playback permission does not grant permission to download, redistribute, or adapt media.

This independent project is not affiliated with or endorsed by video platforms, professional leagues, teams, or athletes.
