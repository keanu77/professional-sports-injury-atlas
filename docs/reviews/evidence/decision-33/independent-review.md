# Decision 33 independent verification

Reviewed on 2026-09-06. Read-only review of the API handlers, allowlist, tracking and YouTube adapter, homepage discovery UI/data, situation routes, privacy text, migration and Wrangler environment bindings. No production writes or deploys performed.

## Findings

1. **P2, confidence 0.98: public telemetry request flooding — partially mitigated.** The initial handler accepted unlimited new UUIDs. Current `src/lib/video/play-rate-limit.ts` now rejects more than 30 POST requests or 60 popularity GET requests per IP/minute in one edge isolate, caps each limiter at 4096 keys, and runs before D1. Successful popularity responses have a 60-second cache lifetime. These protections meaningfully bound repeat requests hitting the same isolate. They are not a global quota, do not attest actual YouTube playback, and can be bypassed by distribution across isolates or source IPs. Fixed-minute boundaries permit bursts spanning two windows. Treat these as explicit limits of anonymous public telemetry, not proof of fraud prevention. No need to add persistent cross-page identity to claim this partial mitigation.

2. **P3, confidence 1.0: lazy IP-bucket cleanup wording.** `play-rate-limit.ts` clears buckets only when another request arrives with a different minute. Its comment saying keys live for at most one minute, and privacy wording saying they are cleared at the minute change, promise a tighter retention interval than implemented. An idle isolate can retain its map longer. Describe clearing upon the next request in a new minute or isolate disposal. IP addresses are not written to D1.

## Confirmed by code and focused tests

- YouTube PLAYING state, not ready, buffered, paused or ended, triggers the tracker. One page/player tracker sends once; retries reuse the same event UUID.
- Exact rolling 30-day SQL bounds use server receipt timestamps, with expired-row removal on writes and no inclusion of future rows.
- Requests validate same Origin, JSON content type and size, strict event fields, UUID and published-video allowlist. SQL uses bound parameters.
- Client and server respect DNT/GPC; statistics do not introduce third-party requests before the reader loads a player.
- Preview and production configuration name distinct D1 database IDs. Actual remote binding isolation remains a deployment verification responsibility.
- Empty, invalid and failed popularity results do not become fabricated rankings. Version checks and aborts prevent stale responses replacing a newer mode selection.
- All 78 situations match existing observation descriptions or remain unclear. Classification text distinguishes visible actions from proven causation. Six curated choices cover five sports and cite multiple sources.
- Independently reran `npx vitest run tests/unit/play-counts.test.ts tests/unit/video-discovery.test.ts`: **26/26 tests passed** (18:45 Taiwan time).

## Remaining release verification

Use an actual preview playback to establish no write on ready, one write on PLAYING, and no extra write for pause/resume. Confirm production starts without preview test data. No claim is made here that these live checks have already passed.

## Root resolution

P3 fixed before final preview: privacy and code now explicitly describe lazy clearing on the next minute request or isolate disposal. P2 retains the documented per-isolate limitation; no claim of global anti-fraud enforcement.
