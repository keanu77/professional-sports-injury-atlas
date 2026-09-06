export interface ContributionStatement {
  bind(...values: (string | number)[]): ContributionStatement;
  all<T>(): Promise<{ results: T[] }>;
}
export interface ContributionDatabase {
  prepare(sql: string): ContributionStatement;
  batch(statements: ContributionStatement[]): Promise<{ results: unknown[] }[]>;
}
export type LimitReason = "ip-daily" | "site-daily" | "duplicate";
export type Reservation =
  | { allowed: true; id: string }
  | { allowed: false; reason: LimitReason; retryAfter: number };
export interface ContributionGuard {
  reserve(ip: string, content: string): Promise<Reservation>;
  settle(id: string, state: "sent" | "uncertain" | "rejected"): Promise<void>;
}
export const IP_DAILY_LIMIT = 10;
export const SITE_DAILY_LIMIT = 50;
export const DUPLICATE_SECONDS = 600;
// One INSERT checks all shared limits atomically; never check-then-increment.
export const RESERVE_CONTRIBUTION = `
INSERT INTO contribution_attempts (request_id, ip_key, content_key, day, created_at, state)
SELECT ?1, ?2, ?3, ?4, ?5, 'pending'
WHERE (SELECT COUNT(*) FROM contribution_attempts WHERE ip_key = ?2 AND day = ?4) < ?6
AND (SELECT COUNT(*) FROM contribution_attempts WHERE day = ?4 AND state != 'rejected') < ?7
AND NOT EXISTS (
  SELECT 1 FROM contribution_attempts
  WHERE content_key = ?3 AND created_at > ?5 - ?8 AND state != 'rejected'
)
RETURNING request_id`;
const REASON = `SELECT CASE
WHEN EXISTS (SELECT 1 FROM contribution_attempts WHERE request_id = ?1) THEN 'allowed'
WHEN EXISTS (SELECT 1 FROM contribution_attempts WHERE content_key = ?3 AND created_at > ?5 - ?8 AND state != 'rejected') THEN 'duplicate'
WHEN (SELECT COUNT(*) FROM contribution_attempts WHERE ip_key = ?2 AND day = ?4) >= ?6 THEN 'ip-daily'
ELSE 'site-daily' END AS reason`;

/** No binding/key/database = reject delivery. IP hashes rotate each Taiwan day.
 * Failed verification still consumes the IP allowance. Explicit upstream 4xx
 * releases the global slot and duplicate lock; ambiguous outcomes keep both.
 */
export function createContributionGuard(
  db: ContributionDatabase | undefined,
  now = () => Math.floor(Date.now() / 1000),
): ContributionGuard {
  return {
    async reserve(ip, content) {
      if (!db || !ip) throw new Error("contribution-guard-unavailable");
      const { results } = await db
        .prepare("SELECT secret FROM contribution_guard_key WHERE id = 1")
        .all<{ secret: string }>();
      const secret = results[0]?.secret;
      if (!secret || !/^[0-9a-f]{64}$/.test(secret))
        throw new Error("contribution-guard-unavailable");
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const hash = async (text: string) => {
        const bytes = await crypto.subtle.sign(
          "HMAC",
          key,
          new TextEncoder().encode(text),
        );
        return Array.from(new Uint8Array(bytes), (b) =>
          b.toString(16).padStart(2, "0"),
        ).join("");
      };
      const time = now();
      const day = Math.floor((time + 28800) / 86400);
      const [ipKey, contentKey] = await Promise.all([
        hash(`ip:${day}:${ip}`),
        hash(`content:${content}`),
      ]);
      const id = crypto.randomUUID();
      const values = [
        id,
        ipKey,
        contentKey,
        day,
        time,
        IP_DAILY_LIMIT,
        SITE_DAILY_LIMIT,
        DUPLICATE_SECONDS,
      ];
      // D1 batch is transactional; classification sees this reservation's state.
      const batch = await db.batch([
        db
          .prepare("DELETE FROM contribution_attempts WHERE created_at <= ?")
          .bind(time - 172800),
        db.prepare(RESERVE_CONTRIBUTION).bind(...values),
        db.prepare(REASON).bind(...values),
      ]);
      const result = batch[2]?.results[0] as { reason?: string } | undefined;
      if (result?.reason === "allowed") return { allowed: true, id };
      if (
        !["duplicate", "ip-daily", "site-daily"].includes(result?.reason ?? "")
      )
        throw new Error("contribution-guard-unavailable");
      const reason = result!.reason as LimitReason;
      return {
        allowed: false,
        reason,
        retryAfter:
          reason === "duplicate"
            ? DUPLICATE_SECONDS
            : (day + 1) * 86400 - 28800 - time,
      };
    },
    async settle(id, state) {
      if (!db) throw new Error("contribution-guard-unavailable");
      await db
        .prepare(
          "UPDATE contribution_attempts SET state = ? WHERE request_id = ? AND state = 'pending'",
        )
        .bind(state, id)
        .all();
    },
  };
}
