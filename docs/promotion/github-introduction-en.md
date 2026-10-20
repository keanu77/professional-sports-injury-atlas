# Developer community introduction draft

Status: ready for manual editorial review. Post only in communities that permit project introductions, after the linked changes are on the default branch. Do not cross-post repeatedly or create artificial engagement.

---

**Sports Injury Video Atlas: an Astro catalog with explicit source and review boundaries**

I maintain a Traditional Chinese sports injury video index for learners and educators. The repository contains the Astro/TypeScript application, source contracts, review tooling, tests, and Cloudflare Functions used by the site.

Some implementation details that may be useful to other catalog builders:

- Review and public builds have distinct output rules; the review artifact is checked for indexing and external-media behavior.
- Source availability, actual video playback, medical review, and media rights are tracked as different kinds of evidence.
- Contributor CI runs deterministic checks. A separate scheduled workflow monitors external sources, where access denial and timeout remain uncertain rather than being reported as dead links.
- The fork guide includes a separate Astro example with original fictional content. It builds without upstream records, signatures, media, or backend bindings.

The live site's dated snapshot contains 200 videos, split into 7 core cases and 193 observation pages with different review depth. It is an educational index, not a diagnostic dataset. Original code and developer documentation are MIT; the editorial collection and third-party media are outside that grant.

Useful contributions include documentation fixes, accessibility work, and reproducible bug reports. Please check existing issues and the contribution guide before starting a larger change. Source corrections should include the affected page and dated original evidence.

[Repository](https://github.com/keanu77/professional-sports-injury-atlas) · [Website](https://injury.sportsmedicine.tw/) · [Fork guide](https://github.com/keanu77/professional-sports-injury-atlas/blob/main/docs/fork-guide.md)

A Star is welcome if you want to follow the project; a small, well-explained improvement is useful too.
