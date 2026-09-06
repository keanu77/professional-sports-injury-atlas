import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import {
  createContributionGuard,
  type ContributionDatabase,
  type ContributionStatement,
} from "../../src/lib/video/contribution-limits";
const opened: DatabaseSync[] = [];
afterEach(() => {
  for (const db of opened.splice(0)) db.close();
});
function database() {
  const sqlite = new DatabaseSync(":memory:");
  opened.push(sqlite);
  sqlite.exec(readFileSync("migrations/0002_contribution_limits.sql", "utf8"));
  class Statement implements ContributionStatement {
    values: (string | number)[] = [];
    constructor(readonly sql: string) {}
    bind(...values: (string | number)[]) {
      this.values = values;
      return this;
    }
    async all<T>() {
      return { results: sqlite.prepare(this.sql).all(...this.values) as T[] };
    }
  }
  const db: ContributionDatabase = {
    prepare: (sql) => new Statement(sql),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = (statements as Statement[]).map((s) => ({
          results: sqlite.prepare(s.sql).all(...s.values),
        }));
        sqlite.exec("COMMIT");
        return results;
      } catch (e) {
        sqlite.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return { sqlite, db };
}
const noon = Date.parse("2026-09-06T12:00:00+08:00") / 1000;
describe("shared contribution limits using actual SQLite", () => {
  it("admits exactly 10 per IP across independent handler instances", async () => {
    const { db } = database();
    for (let i = 0; i < 10; i++)
      expect(
        (
          await createContributionGuard(db, () => noon).reserve(
            "same-ip",
            `different-${i}`,
          )
        ).allowed,
      ).toBe(true);
    expect(
      await createContributionGuard(db, () => noon).reserve(
        "same-ip",
        "eleventh",
      ),
    ).toMatchObject({ allowed: false, reason: "ip-daily", retryAfter: 43200 });
  });
  it("admits exactly 50 of 100 competing requests with different IPs", async () => {
    const { db, sqlite } = database();
    const results = await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        createContributionGuard(db, () => noon).reserve(
          `ip-${i}`,
          `content-${i}`,
        ),
      ),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(50);
    expect(
      results.filter((r) => !r.allowed && r.reason === "site-daily"),
    ).toHaveLength(50);
    expect(
      sqlite.prepare("SELECT COUNT(*) AS n FROM contribution_attempts").get()
        ?.n,
    ).toBe(50);
  });
  it("deduplicates simultaneous content across IPs and across midnight", async () => {
    const { db } = database();
    let now = Date.parse("2026-09-06T23:59:59+08:00") / 1000;
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        createContributionGuard(db, () => now).reserve(
          `ip-${i}`,
          "same-content",
        ),
      ),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(1);
    now += 599;
    expect(
      await createContributionGuard(db, () => now).reserve(
        "fresh-ip",
        "same-content",
      ),
    ).toMatchObject({ allowed: false, reason: "duplicate" });
    now++;
    expect(
      (
        await createContributionGuard(db, () => now).reserve(
          "fresh-ip",
          "same-content",
        )
      ).allowed,
    ).toBe(true);
  });
  it("resets quotas at Taiwan midnight and rotates the IP fingerprint", async () => {
    const { db, sqlite } = database();
    let now = Date.parse("2026-09-06T23:59:59+08:00") / 1000;
    const guard = createContributionGuard(db, () => now);
    for (let i = 0; i < 10; i++) await guard.reserve("same-ip", `content-${i}`);
    expect(await guard.reserve("same-ip", "blocked")).toMatchObject({
      allowed: false,
      retryAfter: 1,
    });
    now++;
    expect((await guard.reserve("same-ip", "new-day")).allowed).toBe(true);
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(DISTINCT ip_key) AS n FROM contribution_attempts",
        )
        .get()?.n,
    ).toBe(2);
  });
  it("releases rejected mail slots but keeps their IP attempt count", async () => {
    const { db } = database();
    const guard = createContributionGuard(db, () => noon);
    for (let i = 0; i < 10; i++) {
      const r = await guard.reserve("same-ip", "content");
      expect(r.allowed).toBe(true);
      if (r.allowed) await guard.settle(r.id, "rejected");
    }
    expect(await guard.reserve("same-ip", "other")).toMatchObject({
      allowed: false,
      reason: "ip-daily",
    });
    expect((await guard.reserve("another-ip", "content")).allowed).toBe(true);
  });
  it("keeps sent, uncertain, and crashed pending requests in the global cap", async () => {
    const { db } = database();
    const guard = createContributionGuard(db, () => noon);
    for (let i = 0; i < 50; i++) {
      const r = await guard.reserve(`ip-${i}`, `content-${i}`);
      if (r.allowed && i % 3 !== 0)
        await guard.settle(r.id, i % 3 === 1 ? "sent" : "uncertain");
    }
    expect(await guard.reserve("new-ip", "new-content")).toMatchObject({
      allowed: false,
      reason: "site-daily",
    });
  });
  it("expires old rows on later requests without storing cleartext IP/content", async () => {
    const { db, sqlite } = database();
    let now = noon;
    const guard = createContributionGuard(db, () => now);
    await guard.reserve("private-ip", "private-note");
    const row = JSON.stringify(
      sqlite.prepare("SELECT * FROM contribution_attempts").all(),
    );
    expect(row).not.toContain("private-ip");
    expect(row).not.toContain("private-note");
    now += 172800;
    await guard.reserve("new-ip", "new-note");
    expect(
      sqlite.prepare("SELECT COUNT(*) AS n FROM contribution_attempts").get()
        ?.n,
    ).toBe(1);
  });
  it("fails closed when database, key or caller IP is unavailable", async () => {
    await expect(
      createContributionGuard(undefined).reserve("ip", "content"),
    ).rejects.toThrow();
    const { db, sqlite } = database();
    await expect(
      createContributionGuard(db).reserve("", "content"),
    ).rejects.toThrow();
    sqlite.exec("DELETE FROM contribution_guard_key");
    await expect(
      createContributionGuard(db).reserve("ip", "content"),
    ).rejects.toThrow();
  });
});
