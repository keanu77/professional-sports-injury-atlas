import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { submitContribution as handleContribution } from "../../src/lib/video/contributions";
import type { ContributionGuard } from "../../src/lib/video/contribution-limits";
const successfulGuard = (): ContributionGuard => ({
  reserve: vi.fn().mockResolvedValue({ allowed: true, id: "test-reservation" }),
  settle: vi.fn().mockResolvedValue(undefined),
});
const submitContribution = (request: Request, send: typeof fetch) =>
  handleContribution(request, send, successfulGuard());

let sequence = 0;
const valid = {
  type: "video",
  url: "https://www.youtube.com/watch?v=public-video",
  note: "",
  sources: "",
  website: "",
  turnstileToken: "test-only-token",
};
function request(
  data: unknown = valid,
  headers: Record<string, string> = {},
  method = "POST",
) {
  return new Request("https://injury.sportsmedicine.tw/api/contributions", {
    method,
    headers: {
      Origin: "https://injury.sportsmedicine.tw",
      "Content-Type": "application/json",
      "CF-Connecting-IP": `test-${++sequence}`,
      ...headers,
    },
    ...(method === "POST"
      ? { body: typeof data === "string" ? data : JSON.stringify(data) }
      : {}),
  });
}
const successfulMail = () =>
  vi
    .fn<typeof fetch>()
    .mockImplementation(async () => Response.json({ ok: true }));

describe("anonymous contributions", () => {
  it("does not send without a working shared guard", async () => {
    const send = successfulMail();
    expect((await handleContribution(request(), send)).status).toBe(503);
    const guard = successfulGuard();
    vi.mocked(guard.reserve).mockRejectedValue(new Error("database down"));
    expect((await handleContribution(request(), send, guard)).status).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });
  it.each(["ip-daily", "site-daily", "duplicate"])(
    "blocks %s before contacting mail service",
    async (reason) => {
      const send = successfulMail();
      const guard = successfulGuard();
      vi.mocked(guard.reserve).mockResolvedValue({
        allowed: false,
        reason: reason as "ip-daily",
        retryAfter: 600,
      });
      const response = await handleContribution(request(), send, guard);
      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("600");
      expect(await response.json()).toEqual({ error: reason });
      expect(send).not.toHaveBeenCalled();
    },
  );
  it.each([
    [400, "rejected"],
    [429, "rejected"],
    [408, "uncertain"],
    [502, "uncertain"],
    [200, "sent"],
  ] as const)("settles upstream %i as %s", async (status, state) => {
    const guard = successfulGuard();
    await handleContribution(
      request(),
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json({ ok: status === 200 }, { status })),
      guard,
    );
    expect(guard.settle).toHaveBeenCalledWith("test-reservation", state);
  });
  it("keeps a reservation for ambiguous transport outcomes", async () => {
    const guard = successfulGuard();
    await handleContribution(
      request(),
      vi.fn<typeof fetch>().mockRejectedValue(new Error("timeout")),
      guard,
    );
    expect(guard.settle).toHaveBeenCalledWith("test-reservation", "uncertain");
  });
  it.each([undefined, "", "   "])(
    "accepts an omitted video URL (%#)",
    async (url) => {
      const send = successfulMail();
      expect(
        (await submitContribution(request({ ...valid, url }), send)).status,
      ).toBe(200);
      const body = JSON.parse(send.mock.calls[0]![1]!.body as string);
      expect(body.message).toContain("網址：未提供");
    },
  );
  it("routes the deployed form endpoint through Cloudflare Functions", () => {
    const routes = JSON.parse(readFileSync("public/_routes.json", "utf8"));
    expect(routes.include).toContain("/api/contributions");
    expect(routes.exclude).toEqual([]);
  });
  it.each(["video", "correction"])(
    "sends %s to the fixed contact service without fetching supplied URLs",
    async (type) => {
      const send = successfulMail();
      const response = await submitContribution(
        request({
          ...valid,
          type,
          note: "日期需要重新確認",
          sources: "https://example.org/source",
        }),
        send,
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ ok: true });
      expect(send).toHaveBeenCalledTimes(1);
      const [destination, options] = send.mock.calls[0]!;
      expect(destination).toBe("https://sportsmedicine.tw/api/contact");
      expect(options?.redirect).toBe("error");
      const body = JSON.parse(options!.body as string);
      expect(body.email).toBe("no-reply@injury.sportsmedicine.tw");
      expect(body.message).toContain("沒有收集訪客姓名或回覆信箱");
      expect(body.message).toContain(valid.url);
      expect(body.message).toContain("https://example.org/source");
      expect(body.subject).toContain(
        type === "video" ? "提供公開影片" : "回報資料修正",
      );
    },
  );
  it.each([
    { ...valid, url: "javascript:alert(1)" },
    { ...valid, url: "http://127.0.0.1/admin" },
    { ...valid, url: "https://user:password@example.org" },
    { ...valid, type: "correction", note: "" },
    { ...valid, type: "correction", url: "", note: "請修正回場日期" },
    { ...valid, url: 123 },
    { ...valid, sources: "not a URL" },
    { ...valid, sources: Array(4).fill("https://example.org").join("\n") },
    { ...valid, website: "spam" },
    { ...valid, turnstileToken: "" },
    { ...valid, recipient: "other@example.org" },
    { ...valid, note: "x".repeat(2001) },
    { ...valid, note: "abc\u0000xyz" },
    [],
    null,
    "invalid JSON",
  ])(
    "rejects invalid submissions before any mail request (%#)",
    async (data) => {
      const send = successfulMail();
      expect((await submitContribution(request(data), send)).status).toBe(400);
      expect(send).not.toHaveBeenCalled();
    },
  );
  it.each([
    ["GET", {}, 405],
    ["POST", { Origin: "https://other.example.org" }, 403],
    ["POST", { "Sec-Fetch-Site": "cross-site" }, 403],
    ["POST", { "Content-Type": "text/plain" }, 415],
  ] as const)(
    "enforces request boundaries %s %j",
    async (method, headers, code) => {
      const send = successfulMail();
      expect(
        (await submitContribution(request(valid, headers, method), send))
          .status,
      ).toBe(code);
      expect(send).not.toHaveBeenCalled();
    },
  );
  it("caps streamed bodies without forwarding", async () => {
    const send = successfulMail();
    expect(
      (await submitContribution(request("x".repeat(12001)), send)).status,
    ).toBe(413);
    expect(send).not.toHaveBeenCalled();
  });
  it.each([400, 500, 502, 429])(
    "does not show success when delivery returns %i",
    async (status) => {
      const send = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json({ error: "failure" }, { status }));
      const response = await submitContribution(request(), send);
      expect(response.status).toBe(status === 429 ? 429 : 502);
      expect(await response.json()).not.toHaveProperty("ok", true);
    },
  );
  it.each([{}, { ok: false }, { ok: "true" }])(
    "requires an explicit delivery success response (%#)",
    async (body) => {
      expect(
        (
          await submitContribution(
            request(),
            vi.fn<typeof fetch>().mockResolvedValue(Response.json(body)),
          )
        ).status,
      ).toBe(502);
    },
  );
  it("handles transport failure without reporting success", async () => {
    expect(
      (
        await submitContribution(
          request(),
          vi.fn<typeof fetch>().mockRejectedValue(new Error("offline")),
        )
      ).status,
    ).toBe(502);
  });
  it("limits bursts by caller", async () => {
    const send = successfulMail();
    const headers = { "CF-Connecting-IP": `burst-${++sequence}` };
    for (let i = 0; i < 3; i++)
      expect(
        (await submitContribution(request(valid, headers), send)).status,
      ).toBe(200);
    expect(
      (await submitContribution(request(valid, headers), send)).status,
    ).toBe(429);
    expect(send).toHaveBeenCalledTimes(3);
  });
});
