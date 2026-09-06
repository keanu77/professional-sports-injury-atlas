import { createRequestLimiter } from "./play-rate-limit";

const allowRequest = createRequestLimiter(3);
const CONTACT_ENDPOINT = "https://sportsmedicine.tw/api/contact";
export const CONTRIBUTION_SUCCESS =
  "謝謝你協助完善運動傷害影片圖鑑！你的訊息已送出，我們會查核後評估更新。";
const publicUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      !url.hostname.includes(".") ||
      url.hostname.endsWith(".local") ||
      url.hostname.endsWith(".localhost") ||
      /^[\d.]+$/.test(url.hostname)
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
};
const respond = (status: number, body: object) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

/** Fixed first-party mail destination; submitted URLs are text, never fetched. */
export async function submitContribution(
  request: Request,
  send: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== "POST") return respond(405, { error: "method" });
  if (
    request.headers.get("Origin") !== new URL(request.url).origin ||
    request.headers.get("Sec-Fetch-Site") === "cross-site"
  )
    return respond(403, { error: "origin" });
  if (
    request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return respond(415, { error: "content-type" });
  if (!allowRequest(request.headers.get("CF-Connecting-IP") ?? "unknown"))
    return respond(429, { error: "rate-limit" });
  const reader = request.body?.getReader();
  if (!reader) return respond(400, { error: "invalid" });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 12000) {
        await reader.cancel();
        return respond(413, { error: "too-large" });
      }
      chunks.push(value);
    }
  } catch {
    return respond(400, { error: "invalid" });
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return respond(400, { error: "invalid" });
  }
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).some(
      (k) =>
        ![
          "type",
          "url",
          "note",
          "sources",
          "turnstileToken",
          "website",
        ].includes(k),
    )
  )
    return respond(400, { error: "invalid" });
  if (data.website) return respond(400, { error: "invalid" });
  const url = publicUrl(data.url);
  const note = typeof data.note === "string" ? data.note.trim() : "";
  const sources = typeof data.sources === "string" ? data.sources.trim() : "";
  const token =
    typeof data.turnstileToken === "string" ? data.turnstileToken : "";
  if (
    !["video", "correction"].includes(String(data.type)) ||
    !url ||
    note.length > 2000 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(note) ||
    sources.length > 3000 ||
    !token ||
    token.length > 2048 ||
    (data.type === "correction" && note.length < 5)
  )
    return respond(400, { error: "invalid" });
  const sourceUrls = sources
    ? sources.split(/\r?\n/).filter(Boolean).map(publicUrl)
    : [];
  if (sourceUrls.length > 3 || sourceUrls.some((u) => u === null))
    return respond(400, { error: "sources" });
  const label = data.type === "video" ? "提供公開影片" : "回報資料修正";
  const message = [
    `類型：${label}`,
    `網址：${url}`,
    "",
    `說明：${note || "未補充"}`,
    "",
    `參考來源：\n${sourceUrls.join("\n") || "未補充"}`,
    "",
    "此訊息由影片圖鑑匿名表單送出，沒有收集訪客姓名或回覆信箱。Email 欄為系統 no-reply 地址，請勿回覆。",
  ].join("\n");
  if (message.length > 5000) return respond(413, { error: "too-large" });
  try {
    const result = await send(CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "影片圖鑑匿名讀者",
        email: "no-reply@injury.sportsmedicine.tw",
        subject: `影片圖鑑｜${label}`,
        message,
        turnstileToken: token,
      }),
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    if (!result.ok)
      return respond(result.status === 429 ? 429 : 502, {
        error: result.status === 429 ? "rate-limit" : "delivery",
      });
    const body = (await result.json()) as { ok?: boolean };
    if (body.ok !== true) return respond(502, { error: "delivery" });
    return respond(200, { ok: true, message: CONTRIBUTION_SUCCESS });
  } catch {
    return respond(502, { error: "delivery" });
  }
}
