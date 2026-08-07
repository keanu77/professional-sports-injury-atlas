# NBA named source-review packet — 2026-08-07

Status: frozen and awaiting a named content-owner decision. No durable decision has been created, no reviewer identity has been inferred, and all 26 accepted rows remain `source-ready`.

## Frozen review-set identity

- Manifest ID reserved by the plan: `NBA-SOURCE-2026-08-06-001`
- Source policy: `nba-v2`
- Candidate-set digest: `c217953f242492a1e84291e40c592a5fa4824edcde0434733bccb41622add8e5`
- Accepted-set projection digest: `0e893a62c0370b2b51feb77c1e972775ec068d5b5a841286f6edd1fc0a7fa0fd`
- Source-policy JSON SHA-256: `6b5909369134839196d2285cba5ba9f1e59d69b56b0c377ef17a10b0e6effe07`
- Source-policy Markdown SHA-256: `b07adf72fb6e5e5bb087401c1056003853c8fa5798456e199e58d722b7db6570`
- Strict root-audit SHA-256: `15cd26f47d6f89f6ad9ed4c33c36e043c06ed7ab5209edd17cb8e41392c1eb76`
- Live-verification SHA-256: `aebc5e3988cc899e94b15946c936492b26a827612e2945d2ebdd09d5d4041de0`
- Live-verification time: `2026-08-07T15:10:13Z`
- Exact verification coverage: 26 candidates and 104 candidate/kind/URL records

The strict machine audit is `research/reviews/root-source-audit.v1.json`. The complete human-readable 26-row source queue, direct original-page links, independence notes, and gate findings are in `research/reviews/2026-08-06-root-source-audit.md`.

## Audit disposition

| Injury           | Source-ready | Root-audit pass | Needs-source outside frozen set |
| ---------------- | -----------: | --------------: | ------------------------------: |
| ACL              |            7 |               7 |                              16 |
| Ankle sprain     |           12 |              12 |                              15 |
| Achilles rupture |            7 |               7 |                              11 |
| Total            |           26 |              26 |                              42 |

All accepted rows have an opened first-party diagnosis and a passing event/video binding. No secondary-source classic exception is present. The accepted classic proposal list is exactly `[]`.

## Named reviewer action required

The content owner must independently review the exact queue and original pages, then provide:

1. their explicit real-world identity;
2. a UTC review timestamp;
3. approval or rejection of this exact candidate-set digest;
4. explicit confirmation that the classic proposal list is exactly `[]`.

Only after that human decision may an executor create `research/reviews/source-batches/NBA-SOURCE-2026-08-06-001-source-review-decision.v1.json`, copy the exact identity and timestamp into the accepted rows, and promote those rows to `source-verified`. Any change to a candidate CSV, strict root audit, live-verification artifact, or either policy file invalidates this packet and requires the entire freeze loop again.

## Blocking launch gates

This packet is reviewable, but it is not evidence that G2 or the launch manifest gate is open. ACL and Achilles each remain below the plan's minimum of 10 passing candidates, and the accepted set contains no classic case. Those gaps must be resolved through further discovery and a new freeze, or by an explicitly authorized plan/policy change. The agent stops here at the named human-review gate.
