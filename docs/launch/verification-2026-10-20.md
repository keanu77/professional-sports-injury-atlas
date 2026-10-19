# Repository launch verification · 2026-10-20

This is a preparation snapshot, not a publication or clinical approval. No real-world audience size or educational outcome was supplied, so launch copy makes neither claim.

## Reproducible setup

An isolated Ubuntu 24.04 ARM64 VM was created with 2 CPUs and 4 GB RAM. It received a full-history Git bundle, not the maintainer's `node_modules`, browser profile, credentials, or home directory. Node 24.14.0 and npm 11.9.0 were installed from the official Node distribution with a verified archive checksum.

| Step                                                                      | Result                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Fresh `npm ci`                                                            | Pass, 9 seconds                                                    |
| Initial `npm run check`                                                   | Pass, 14 seconds                                                   |
| Initial unit suite                                                        | 1,576 pass, 1 fails: distinct Chinese strings rendered identically |
| Install `fonts-noto-cjk` and use its native font in the isolated renderer | Chinese rendering regression passes; rendered PNG inspected        |
| Full unit suite after the fix                                             | 1,577 pass across 108 files                                        |
| First `npm run build:review`                                              | Pass, 45 pages, 179 seconds including uncached image transforms    |
| `npm run verify:review-artifact`                                          | Pass: 45 pages, 26 case pages, 962 files within the size limit     |
| README development command                                                | Started successfully; homepage HTTP 200                            |

The complete type check, 1,577-test suite, review build, and artifact check were repeated successfully at candidate commit `0e8b401`, containing the application fix and contributor documentation. Later launch-media and verification-document edits do not change the application inputs tested there. The Ubuntu checkout was clean after final validation.

On macOS with Node 24.14.0, type checking and the six share-image tests also passed. Formatting and relative links in the changed documents were checked. Native Windows, Firefox, WebKit, and a fresh Ubuntu browser run were not tested in this launch-preparation pass.

## Live demonstration

Playwright used the installed Chrome browser against `https://injury.sportsmedicine.tw/`. The recorded workflow searched for Acuna, opened the event, followed a source citation, and returned to the preserved search. No page errors occurred. The recording did not play the original injury video, and POST requests were blocked to avoid recording analytics or submitting forms.

The GIF, full MP4, short MP4, and 1280×640 PNG have sizes and SHA-256 values in [`docs/media/manifest.json`](../media/manifest.json). Frames, source-list presentation, title cards, and the social preview were visually inspected. Media caps are 45 seconds for the full video, 10–15 seconds for the short version, 6 MB for the GIF, and 1 MB for the PNG.

## Publication boundaries

- Original code and developer documentation receive MIT terms. Editorial collections, historical review records, and media retain separate rights. This is not an open-license release of the complete dataset.
- The live Cloudflare website is the demo. GitHub Pages is not enabled over `docs/`, which contains research and audit records rather than a demo build.
- Repository description, homepage, and 11 topics were updated. Repository visibility remains private at preparation time; no social post was sent.
- Hosted GitHub Actions have not executed successfully in this pass because of an account-level execution restriction. Local Ubuntu results are not presented as hosted CI results.
- Historical review and decision records remain in the full Git history. A pattern-based history scan raised three deterministic test-fixture strings; those were reviewed as test data, with no production credential confirmed by that scan. This is not proof that every sensitive or copyrighted item is absent.
- The Linux code change alters production inputs. Existing production release receipts do not approve this new input tree. A later deployment still requires the normal public-release evidence; no approval digest or gate was weakened here.

## Before publishing

1. Review the PR and clear the hosted CI execution restriction; obtain a successful hosted check before merging.
2. Decide whether to publish this repository with its full history and separately licensed content. Enable GitHub private vulnerability reporting after public visibility is approved and available.
3. Merge the reviewed changes and retarget the draft v0.1.0 release to the merged commit before publishing it. Move the changelog's unreleased entry to the actual release date.
4. Upload `docs/media/social-preview-1280x640.png` under Settings → General → Social preview. Inspect the resulting share card.
5. Use the supplied social drafts only after the repository and license links are publicly accessible.
