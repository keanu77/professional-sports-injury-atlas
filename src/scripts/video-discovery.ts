import {
  matchesVideoSearch,
  normalizeVideoSearch,
  videoSearchTerms,
} from "../lib/videos/search";

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
  const searchForm = root.querySelector<HTMLFormElement>("[data-video-search]");
  const searchInput = root.querySelector<HTMLInputElement>(
    "[data-video-search-input]",
  );
  const clearSearch = root.querySelector<HTMLButtonElement>(
    "[data-video-search-clear]",
  );
  const typeFilter = root.querySelector<HTMLSelectElement>(
    "[data-video-type-filter]",
  );
  const clearType = root.querySelector<HTMLButtonElement>(
    "[data-video-type-clear]",
  );
  const searchAll = root.querySelector<HTMLButtonElement>(
    "[data-video-search-all]",
  );
  const scope = root.querySelector<HTMLElement>("[data-video-search-scope]");
  const empty = root.querySelector<HTMLElement>("[data-video-search-empty]");
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
  const searchText = new Map(
    cards.map((card) => [
      card,
      card.dataset.searchText ?? normalizeVideoSearch(card.textContent ?? ""),
    ]),
  );
  const curated = cards
    .filter((card) => Number(card.dataset.curatedRank) > 0)
    .sort(
      (a, b) => Number(a.dataset.curatedRank) - Number(b.dataset.curatedRank),
    );
  type Mode = "all" | "curated" | "popular";
  let mode: Mode = "all";
  let contentType = "";
  let popularityState: "idle" | "loading" | "ready" | "error" = "idle";
  let ranking: PopularVideo[] = [];
  let pending: AbortController | undefined;
  let version = 0;
  let composing = false;
  const knownContentTypes = new Set(
    Array.from(typeFilter?.options ?? [])
      .map((option) => option.value)
      .filter(Boolean),
  );

  const updateLocation = (replace = false) => {
    const url = new URL(window.location.href);
    if (contentType) url.searchParams.set("type", contentType);
    else url.searchParams.delete("type");
    window.history[replace ? "replaceState" : "pushState"]({}, "", url);
  };

  const restoreLocation = () => {
    const url = new URL(window.location.href);
    const requestedType = url.searchParams.get("type") ?? "";
    contentType = knownContentTypes.has(requestedType) ? requestedType : "";
    if (typeFilter) typeFilter.value = contentType;
    if (requestedType !== contentType) updateLocation(true);
  };

  const render = () => {
    const query = (searchInput?.value ?? "").trim();
    const terms = videoSearchTerms(query);
    const searching = terms.length > 0;
    const typeLabel = typeFilter?.selectedOptions[0]?.textContent ?? "全部類型";
    const label =
      mode === "all"
        ? "全部影片"
        : mode === "curated"
          ? "精選影片"
          : "本站熱門前 10 名";
    const ordered =
      mode === "all"
        ? cards
        : mode === "curated"
          ? curated
          : ranking.map((item) => byId.get(item.videoId)!);
    const selected = ordered.filter(
      (card) =>
        matchesVideoSearch(searchText.get(card)!, terms) &&
        (!contentType ||
          (card.dataset.contentTypes ?? "").split(" ").includes(contentType)),
    );
    const visible = new Set(selected);
    for (const card of cards) {
      card.hidden = !visible.has(card);
      const count = card.querySelector<HTMLElement>("[data-popular-count]");
      if (count) count.hidden = true;
    }
    for (const card of selected) grid.append(card);
    if (mode === "popular") {
      for (const [index, item] of ranking.entries()) {
        const card = byId.get(item.videoId)!;
        const count = card.querySelector<HTMLElement>("[data-popular-count]");
        if (count && visible.has(card)) {
          count.textContent = rankLabel(index + 1);
          count.hidden = false;
        }
      }
    }
    for (const button of buttons)
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.discoveryMode === mode),
      );
    if (scope) scope.textContent = `搜尋範圍：${label}`;
    if (clearSearch) clearSearch.hidden = !query;
    if (clearType) clearType.hidden = !contentType;
    if (searchAll) searchAll.hidden = !(searching && mode !== "all");
    const unavailable = mode === "popular" && popularityState !== "ready";
    if (empty) {
      empty.hidden =
        !(searching || contentType) || selected.length > 0 || unavailable;
      if (!empty.hidden)
        empty.textContent = searching
          ? `「${typeLabel}」中沒有符合「${query}」的影片；可清除搜尋或影片類型後瀏覽。`
          : `目前沒有符合「${typeLabel}」的影片；可清除影片類型後瀏覽。`;
    }
    if (mode === "popular" && popularityState === "loading") {
      grid.setAttribute("aria-busy", "true");
      status.textContent = "正在讀取本站近 30 天的熱門排行…";
      return;
    }
    grid.removeAttribute("aria-busy");
    if (mode === "popular" && popularityState === "error") {
      status.textContent =
        "目前無法讀取本站熱門，請稍後再試。也可以先看精選或全部影片。";
    } else if (searching || contentType) {
      const filters = [
        contentType ? typeLabel : "",
        searching ? `「${query}」` : "",
      ]
        .filter(Boolean)
        .join("、");
      status.textContent = `${label}中找到 ${selected.length} 支符合${filters}的影片。`;
    } else if (mode === "all") {
      status.textContent = `全部 ${cards.length} 支影片。`;
    } else if (mode === "curated") {
      status.textContent = curated.length
        ? `精選 ${curated.length} 支：以畫面清楚、傷勢與回場資料完整，並涵蓋不同運動的影片為優先。`
        : "精選影片整理中，可先瀏覽全部影片。";
    } else {
      status.textContent = ranking.length
        ? "依本站近 30 天實際播放次數排序，最多顯示前 10 名，每小時整點更新；不包含 YouTube 平台的累計觀看數。"
        : "截至上一個整點，本站近 30 天尚無播放紀錄；每小時更新。也可以先看精選或全部影片。";
    }
  };

  const selectMode = async (next: Mode) => {
    const current = ++version;
    pending?.abort();
    pending = undefined;
    mode = next;
    if (mode !== "popular") {
      render();
      return;
    }
    ranking = [];
    popularityState = "loading";
    const controller = new AbortController();
    pending = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    render();
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
      ranking = items;
      popularityState = "ready";
      render();
    } catch {
      if (current === version) {
        popularityState = "error";
        render();
      }
    } finally {
      window.clearTimeout(timeout);
      if (current === version) pending = undefined;
    }
  };

  for (const button of buttons)
    button.addEventListener("click", () => {
      const next = button.dataset.discoveryMode;
      if (next === "all" || next === "curated" || next === "popular")
        void selectMode(next);
    });
  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!composing) {
      render();
    }
  });
  searchInput?.addEventListener("compositionstart", () => {
    composing = true;
  });
  searchInput?.addEventListener("compositionend", () => {
    composing = false;
    render();
  });
  searchInput?.addEventListener("input", (event) => {
    if (!composing && !(event as InputEvent).isComposing) {
      render();
    }
  });
  const resetSearch = () => {
    if (!searchInput) return;
    searchInput.value = "";
    render();
    searchInput.focus();
  };
  clearSearch?.addEventListener("click", resetSearch);
  searchInput?.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      searchInput.value &&
      !composing &&
      !event.isComposing
    ) {
      event.preventDefault();
      resetSearch();
    }
  });
  searchAll?.addEventListener("click", () => {
    void selectMode("all");
    searchInput?.focus();
  });
  typeFilter?.addEventListener("change", () => {
    contentType = typeFilter.value;
    render();
    updateLocation();
  });
  clearType?.addEventListener("click", () => {
    contentType = "";
    if (typeFilter) typeFilter.value = "";
    render();
    updateLocation();
    typeFilter?.focus();
  });
  window.addEventListener("popstate", () => {
    restoreLocation();
    render();
  });
  controls.hidden = false;
  if (searchForm) searchForm.hidden = false;
  root.dataset.discoveryReady = "true";
  restoreLocation();
  render();
}

if (typeof document !== "undefined") {
  document
    .querySelectorAll<HTMLElement>("[data-video-discovery]")
    .forEach(initializeVideoDiscovery);
}
