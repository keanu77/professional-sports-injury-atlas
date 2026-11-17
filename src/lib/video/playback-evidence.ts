import { canonicalJson } from "../contracts/canonical";

export interface PlaybackExpectation {
  videoUrl: string;
  path: string;
  origin: string;
  startSeconds: number;
  sourceCommit: string;
  catalogDigest: string;
  captionRequired: boolean;
}
interface PlaybackState {
  time: number;
  paused: boolean;
  readyState: number;
}
export interface CurrentPlaybackReceipt {
  url: string;
  path: string;
  origin: string;
  startSeconds: number;
  sourceCommit: string;
  sourceDirty: boolean;
  deploymentCommit: string | null;
  catalogDigest: string;
  checkedAt: string;
  status: string;
  error?: string;
  before?: PlaybackState;
  after?: PlaybackState;
  captionsEnabled?: boolean;
}

export function ownedPlaybackOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.origin === origin &&
      (url.hostname === "injury.sportsmedicine.tw" ||
        url.hostname === "sports-injury-atlas.pages.dev" ||
        /^[a-z0-9-]+\.sports-injury-atlas\.pages\.dev$/.test(url.hostname))
    );
  } catch {
    return false;
  }
}

/** Select a current receipt without mutating historic approvals or evidence.
 * The latest matching attempt supersedes older success, including a failure.
 * A browser receipt is still operational evidence, never clinical approval.
 */
export function selectCurrentPlaybackEvidence(
  receipts: readonly CurrentPlaybackReceipt[],
  expected: PlaybackExpectation,
  now: Date,
): { receipt: CurrentPlaybackReceipt | null; reasons: string[] } {
  if (
    !/^[a-f0-9]{40}$/.test(expected.sourceCommit) ||
    !/^[a-f0-9]{64}$/.test(expected.catalogDigest) ||
    !ownedPlaybackOrigin(expected.origin) ||
    !Number.isFinite(now.getTime())
  )
    throw new Error("Invalid playback expectation");
  const bound = receipts.filter(
    (receipt) =>
      receipt.url === expected.videoUrl &&
      receipt.path === expected.path &&
      receipt.origin === expected.origin &&
      receipt.startSeconds === expected.startSeconds &&
      receipt.sourceCommit === expected.sourceCommit &&
      receipt.sourceDirty === false &&
      receipt.deploymentCommit === expected.sourceCommit &&
      receipt.catalogDigest === expected.catalogDigest &&
      ownedPlaybackOrigin(receipt.origin),
  );
  const dated = bound.filter((receipt) =>
    Number.isFinite(Date.parse(receipt.checkedAt)),
  );
  if (dated.some((receipt) => Date.parse(receipt.checkedAt) > now.getTime()))
    return { receipt: null, reasons: ["future-dated-evidence"] };
  const current = dated
    .filter(
      (receipt) =>
        now.getTime() - Date.parse(receipt.checkedAt) < 7 * 86_400_000,
    )
    .sort((a, b) => Date.parse(b.checkedAt) - Date.parse(a.checkedAt));
  if (!current.length)
    return { receipt: null, reasons: ["missing-current-bound-evidence"] };
  const latest = current[0]!;
  const ties = current.filter(
    (receipt) => Date.parse(receipt.checkedAt) === Date.parse(latest.checkedAt),
  );
  if (
    new Set(
      ties.map((receipt) => canonicalJson(JSON.parse(JSON.stringify(receipt)))),
    ).size > 1
  )
    return { receipt: null, reasons: ["ambiguous-latest-evidence"] };
  const reasons: string[] = [];
  if (latest.status !== "played" || latest.error)
    reasons.push("latest-attempt-not-played");
  const before = latest.before;
  const after = latest.after;
  if (
    !before ||
    !after ||
    !Number.isFinite(before.time) ||
    !Number.isFinite(after.time) ||
    before.time < 0 ||
    after.paused !== false ||
    after.readyState < 3 ||
    after.readyState > 4 ||
    after.time <= Math.max(expected.startSeconds, before.time) + 1
  )
    reasons.push("missing-playback-progress");
  if (expected.captionRequired && latest.captionsEnabled !== true)
    reasons.push("required-captions-unverified");
  return { receipt: reasons.length ? null : latest, reasons };
}
