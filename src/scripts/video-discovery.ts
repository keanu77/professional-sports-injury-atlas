export interface PopularVideo {
  videoId: string;
  count: number;
}

/** A malformed or unrelated response must never become a fabricated ranking. */
export function readPopularVideos(
  payload: unknown,
  knownIds: ReadonlySet<string>,
): PopularVideo[] {
  if (!payload || typeof payload !== "object")
    throw new Error("Invalid popular response");
  const response = payload as Record<string, unknown>;
  if (
    response.windowDays !== 30 ||
    typeof response.generatedAt !== "string" ||
    !Number.isFinite(Date.parse(response.generatedAt)) ||
    !Array.isArray(response.items)
  ) {
    throw new Error("Invalid popular window");
  }
  const seen = new Set<string>();
  const items: PopularVideo[] = [];
  for (const item of response.items) {
    if (!item || typeof item !== "object")
      throw new Error("Invalid popular item");
    const { videoId, count } = item as Record<string, unknown>;
    if (
      typeof videoId !== "string" ||
      !/^[\w-]{11}$/.test(videoId) ||
      typeof count !== "number" ||
      !Number.isSafeInteger(count) ||
      count <= 0 ||
      seen.has(videoId)
    )
      throw new Error("Invalid popular count");
    seen.add(videoId);
    if (knownIds.has(videoId)) items.push({ videoId, count });
  }
  return items.sort(
    (a, b) => b.count - a.count || a.videoId.localeCompare(b.videoId),
  );
}

/** Render the most familiar ranks in Chinese; larger ranks stay compact. */
function rankLabel(rank: number): string {
  const digits = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const label =
    rank < 10
      ? digits[rank]
      : rank < 100
        ? `${rank < 20 ? "" : digits[Math.floor(rank / 10)]}十${digits[rank % 10]}`
        : String(rank);
  return `近 30 天播放第${label}名`;
}

export function initializeVideoDiscovery(root: HTMLElement): void {
  if (root.dataset.discoveryReady) return;
  const grid = root.querySelector<HTMLOListElement>("[data-discovery-grid]");
  const controls = root.querySelector<HTMLElement>("[data-discovery-controls]");
  const status = root.querySelector<HTMLElement>("[data-discovery-status]");
  if (!grid || !controls || !status) return;
  const cards = Array.from(
    grid.querySelectorAll<HTMLElement>("[data-discovery-slug]"),
  );
  const buttons = Array.from(
    controls.querySelectorAll<HTMLButtonElement>("button[data-discovery-mode]"),
  );
  const byId = new Map(
    cards.flatMap((card) =>
      card.dataset.videoId ? [[card.dataset.videoId, card] as const] : [],
    ),
  );
  let pending: AbortController | undefined;
  let version = 0;
  const display = (ordered: HTMLElement[]) => {
    const visible = new Set(ordered);
    for (const card of cards) {
      card.hidden = !visible.has(card);
      const count = card.querySelector<HTMLElement>("[data-popular-count]");
      if (count) count.hidden = true;
    }
    for (const card of ordered) grid.append(card);
  };
  controls.hidden = false;
  root.dataset.discoveryReady = "true";
  for (const button of buttons)
    button.addEventListener("click", async () => {
      const current = ++version;
      pending?.abort();
      pending = undefined;
      grid.removeAttribute("aria-busy");
      for (const other of buttons)
        other.setAttribute("aria-pressed", String(other === button));
      const mode = button.dataset.discoveryMode;
      if (mode === "all") {
        display(cards);
        status.textContent = `全部 ${cards.length} 支影片。`;
        return;
      }
      if (mode === "curated") {
        const selected = cards
          .filter((card) => Number(card.dataset.curatedRank) > 0)
          .sort(
            (a, b) =>
              Number(a.dataset.curatedRank) - Number(b.dataset.curatedRank),
          );
        display(selected);
        status.textContent = selected.length
          ? `精選 ${selected.length} 支：以畫面清楚、傷勢與回場資料完整，並涵蓋不同運動的影片為優先。`
          : "精選影片整理中，可先瀏覽全部影片。";
        return;
      }
      display([]);
      status.textContent = "正在讀取本站近 30 天的熱門排行…";
      grid.setAttribute("aria-busy", "true");
      const controller = new AbortController();
      pending = controller;
      const timeout = window.setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch("/api/popular", {
          credentials: "omit",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Popularity unavailable");
        const items = readPopularVideos(
          await response.json(),
          new Set(byId.keys()),
        ).slice(0, 10);
        if (current !== version) return;
        display(items.map((item) => byId.get(item.videoId)!));
        for (const [index, item] of items.entries()) {
          const count = byId
            .get(item.videoId)!
            .querySelector<HTMLElement>("[data-popular-count]");
          if (count) {
            count.textContent = rankLabel(index + 1);
            count.hidden = false;
          }
        }
        status.textContent = items.length
          ? "依本站近 30 天實際播放次數排序，最多顯示前 10 名，每小時整點更新；不包含 YouTube 平台的累計觀看數。"
          : "截至上一個整點，本站近 30 天尚無播放紀錄；每小時更新。也可以先看精選或全部影片。";
      } catch {
        if (current === version)
          status.textContent =
            "目前無法讀取本站熱門，請稍後再試。也可以先看精選或全部影片。";
      } finally {
        window.clearTimeout(timeout);
        if (current === version) {
          grid.removeAttribute("aria-busy");
          pending = undefined;
        }
      }
    });
}

if (typeof document !== "undefined") {
  document
    .querySelectorAll<HTMLElement>("[data-video-discovery]")
    .forEach(initializeVideoDiscovery);
}
