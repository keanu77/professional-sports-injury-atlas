import { sha256Hex } from "../contracts/canonical";
import type { PublicVideoHealthArtifact } from "./health-monitor";

type Status = "available" | "unavailable" | "indeterminate";
export interface HealthLedgerEntry {
  id: string;
  kind: "source" | "metadata" | "embed";
  url: string;
  affectedSlugs: string[];
  active: boolean;
  status: Status;
  reason: string;
  firstSeenAt: string;
  firstProblemAt: string | null;
  lastCheckedAt: string;
  lastSuccessfulAt: string | null;
  consecutiveChecks: number;
  owner: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
  nextAction: "none" | "review-confirmed-failure" | "manual-verification";
}
export interface HealthLedger {
  schemaVersion: 1;
  checkedAt: string;
  catalogDigest: string | null;
  continuity: "new-baseline" | "continued";
  entries: HealthLedgerEntry[];
  changes: Array<{
    id: string;
    kind: "new" | "changed" | "worsened" | "restored" | "retired";
    previousStatus: Status | null;
    status: Status;
  }>;
}

/** Persistent operational triage; neither clinical review nor playback evidence. */
export function updateHealthLedger(
  artifact: PublicVideoHealthArtifact,
  previous?: HealthLedger,
): HealthLedger {
  const now = artifact.checkedAt;
  if (!Number.isFinite(Date.parse(now)))
    throw new Error("Invalid health timestamp");
  if (previous && (previous.schemaVersion !== 1 || previous.checkedAt > now))
    throw new Error("Invalid or newer previous health ledger");
  const old = new Map(
    (previous?.entries ?? []).map((entry) => [entry.id, entry]),
  );
  const observations = new Map<
    string,
    Pick<HealthLedgerEntry, "kind" | "url" | "status" | "reason"> & {
      slugs: Set<string>;
    }
  >();
  const add = (
    kind: HealthLedgerEntry["kind"],
    url: string,
    slug: string,
    status: Status,
    reason: string,
  ) => {
    const id = `${kind}:${sha256Hex(url)}`;
    const entry = observations.get(id) ?? {
      kind,
      url,
      status,
      reason,
      slugs: new Set<string>(),
    };
    entry.slugs.add(slug);
    observations.set(id, entry);
  };
  for (const video of artifact.videos) {
    for (const source of video.sourceAvailability)
      add(
        "source",
        source.url,
        video.slug,
        source.result.status,
        source.result.reason,
      );
    const url =
      video.provider === "youtube"
        ? `https://www.youtube.com/watch?v=${video.videoId}`
        : (video.youtubeMetadata.finalUrl ??
          `https://www.mlb.com/video/${video.videoId}`);
    add(
      "metadata",
      url,
      video.slug,
      video.youtubeMetadata.status,
      video.youtubeMetadata.reason,
    );
    // No API capability exists for this governed provider: do not create a
    // perpetual failure ticket. The artifact still states playback not tested.
    if (video.embedCapability.basis !== "non-youtube-provider")
      add(
        "embed",
        url,
        video.slug,
        video.embedCapability.status === "embeddable"
          ? "available"
          : video.embedCapability.status === "not-embeddable"
            ? "unavailable"
            : "indeterminate",
        video.embedCapability.reason,
      );
  }
  const changes: HealthLedger["changes"] = [];
  const entries = [...observations].map(
    ([id, observation]): HealthLedgerEntry => {
      const prior = old.get(id);
      const { status, reason, kind, url, slugs } = observation;
      const stable =
        prior?.active && prior.status === status && prior.reason === reason;
      const firstProblemAt =
        status === "available"
          ? null
          : prior?.active && prior.status !== "available"
            ? (prior.firstProblemAt ?? now)
            : now;
      if (!prior || !prior.active)
        changes.push({
          id,
          kind: "new",
          previousStatus: prior?.status ?? null,
          status,
        });
      else if (!stable)
        changes.push({
          id,
          kind:
            status === "available"
              ? "restored"
              : status === "unavailable" && prior.status !== "unavailable"
                ? "worsened"
                : "changed",
          previousStatus: prior.status,
          status,
        });
      return {
        id,
        kind,
        url,
        affectedSlugs: [...slugs].sort(),
        active: true,
        status,
        reason,
        firstSeenAt: prior?.firstSeenAt ?? now,
        firstProblemAt,
        lastCheckedAt: now,
        lastSuccessfulAt:
          status === "available" ? now : (prior?.lastSuccessfulAt ?? null),
        consecutiveChecks: stable
          ? prior.consecutiveChecks + (prior.lastCheckedAt === now ? 0 : 1)
          : 1,
        owner: prior?.owner ?? null,
        // Calendar-day operational deadlines; owner assignment is intentionally
        // explicit and never invented by an automated health probe.
        dueAt:
          firstProblemAt === null
            ? null
            : prior?.active && prior.status === status && prior.dueAt
              ? prior.dueAt
              : new Date(
                  Date.parse(firstProblemAt) +
                    (status === "unavailable" ? 3 : 7) * 86_400_000,
                ).toISOString(),
        resolvedAt:
          status === "available" && prior?.status !== "available" && prior
            ? now
            : (prior?.resolvedAt ?? null),
        nextAction:
          status === "available"
            ? "none"
            : status === "unavailable"
              ? "review-confirmed-failure"
              : "manual-verification",
      };
    },
  );
  for (const prior of old.values()) {
    if (observations.has(prior.id)) continue;
    entries.push({ ...prior, active: false, dueAt: null, nextAction: "none" });
    if (prior.active)
      changes.push({
        id: prior.id,
        kind: "retired",
        previousStatus: prior.status,
        status: prior.status,
      });
  }
  return {
    schemaVersion: 1,
    checkedAt: now,
    catalogDigest: artifact.provenance.catalogDigest,
    continuity: previous ? "continued" : "new-baseline",
    entries: entries.sort((a, b) => a.id.localeCompare(b.id)),
    changes,
  };
}
