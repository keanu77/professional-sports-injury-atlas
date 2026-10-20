# Changelog

This file describes usable capabilities rather than individual commits. Catalog counts describe content, not adoption or clinical effectiveness.

## v0.1.0 — 2026-10-20

### Repository launch

- Replace the bootstrap-era README with complete Traditional Chinese and English introductions, a live demo, a recorded workflow, and reproducible setup instructions.
- Apply MIT to original code and developer documentation, with explicit exclusions for editorial collections, review records, media, and third-party materials.
- Add contribution and security guidance, issue forms, and PR checks using Node 24.14.0 and Ubuntu 24.04 with full Git history.
- Fix Linux share-image rendering to use an installed native CJK font and report a clear error when it is absent. macOS retains the existing bundled font path.
- Preserve the prior private-review credential when the access file changes during rotation, including an in-place edit or immediate inode reuse. The check now compares the inspected file metadata as well as its identity.

### Source maintenance and deployment verification

- Repair 13 obsolete source citations while preserving event facts and citation bindings.
- Distinguish confirmed external-link failures from access restrictions, transient errors and unverified playback; keep operational monitoring separate from contributor CI.
- Expose the deployed Git commit at `/version.json` with `Cache-Control: no-store` so repository and website versions can be compared directly.

### Website capabilities

- Search and browse 200 videos across 30 sports and 14 body regions, including 7 core cases and 193 observation pages (catalog snapshot: 2026-10-20).
- Follow linked sources, event context, and available return-to-sport information. Use article navigation and return to the previous catalog filters.
- Use mobile layouts, dark mode, adjustable text, keyboard navigation, and related-video suggestions.
- Retain review-mode development, source provenance, rights records, and separate public-release gates.

There is no full English site UI, measured adoption claim, or demonstrated teaching-outcome claim. The collection is not a diagnostic ground-truth dataset.
