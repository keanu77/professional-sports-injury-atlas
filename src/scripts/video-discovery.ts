import {
  hasDiscoveryScope,
  readDiscoveryState,
  writeDiscoveryState,
} from "../lib/videos/discovery-state";
import { rememberCatalogReturn } from "../lib/ui/catalog-return";
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
  const sportFilter = root.querySelector<HTMLSelectElement>(
    "[data-sport-filter]",
  );
  const bodyFilter =
    root.querySelector<HTMLSelectElement>("[data-body-filter]");
  const clearSport =
    root.querySelector<HTMLButtonElement>("[data-sport-clear]");
  const clearBody = root.querySelector<HTMLButtonElement>("[data-body-clear]");
  const activeFilters = root.querySelector<HTMLElement>(
    "[data-active-filters]",
  );
  const advancedToggle = root.querySelector<HTMLButtonElement>(
    "[data-advanced-toggle]",
  );
  const advancedFilters = root.querySelector<HTMLElement>(
    "[data-advanced-filters]",
  );
  const advancedCount = root.querySelector<HTMLElement>(
    "[data-advanced-count]",
  );
  const narrowLayout = window.matchMedia("(max-width: 47.999rem)");
  let advancedOpen = false;
  const syncAdvancedFilters = () => {
    if (!advancedToggle || !advancedFilters) return;
    const open = !narrowLayout.matches || advancedOpen;
    const moveFromToggle =
      !narrowLayout.matches && document.activeElement === advancedToggle;
    advancedToggle.hidden = !narrowLayout.matches;
    if (!open && advancedFilters.contains(document.activeElement)) {
      advancedToggle.focus({ preventScroll: true });
    }
    advancedFilters.hidden = !open;
    advancedToggle.setAttribute("aria-expanded", String(open));
    if (moveFromToggle)
      (root.dataset.fixedSport ? bodyFilter : sportFilter)?.focus({
        preventScroll: true,
      });
  };
  advancedToggle?.addEventListener("click", () => {
    advancedOpen = !advancedOpen;
    syncAdvancedFilters();
  });
  narrowLayout.addEventListener("change", syncAdvancedFilters);
  const more = root.querySelector<HTMLButtonElement>("[data-discovery-more]");
  const pagination = root.querySelector<HTMLElement>(
    "[data-discovery-pagination]",
  );
  const pageStatus = root.querySelector<HTMLElement>(
    "[data-discovery-page-status]",
  );
  const fixedType = root.dataset.fixedType ?? "";
  const fixedSport = root.dataset.fixedSport ?? "";
  const fixedBody = root.dataset.fixedBody ?? "";
  const fixedSituation = root.dataset.fixedSituation ?? "";
  const fixedScope = { fixedType, fixedSport, fixedBody, fixedSituation };
  const scoped = hasDiscoveryScope(fixedScope);
  const scopeLabel = root.dataset.scopeLabel || "本分類影片";
  const pageSize = 24;
  let visibleLimit = pageSize;
  const searchAll = root.querySelector<HTMLButtonElement>(
    "[data-video-search-all]",
  );
  const scope = root.querySelector<HTMLElement>("[data-video-search-scope]");
  const empty = root.querySelector<HTMLElement>("[data-video-search-empty]");
  const cards = Array.from(
    grid.querySelectorAll<HTMLElement>("[data-discovery-slug]"),
  );
  let domOrder = cards.slice();
  const popularCounts = new Map(
    cards.map((card) => [
      card,
      card.querySelector<HTMLElement>("[data-popular-count]"),
    ]),
  );
  const setHidden = (element: HTMLElement | null, hidden: boolean) => {
    if (element && element.hidden !== hidden) element.hidden = hidden;
  };
  const setText = (element: HTMLElement | null, text: string) => {
    if (element && element.textContent !== text) element.textContent = text;
  };
  const setAttribute = (
    element: HTMLElement | null,
    name: string,
    value: string,
  ) => {
    if (element && element.getAttribute(name) !== value)
      element.setAttribute(name, value);
  };
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

  const optionValues = (select: HTMLSelectElement | null) =>
    new Set(
      Array.from(select?.options ?? [])
        .map((option) => option.value)
        .filter(Boolean),
    );
  const urlOptions = {
    types: knownContentTypes,
    sports: optionValues(sportFilter),
    bodies: optionValues(bodyFilter),
    ...fixedScope,
  };
  const updateLocation = (replace = false) => {
    const url = writeDiscoveryState(
      new URL(window.location.href),
      {
        query: searchInput?.value ?? "",
        type: contentType,
        sport: sportFilter?.value ?? "",
        body: bodyFilter?.value ?? "",
        mode,
      },
      fixedScope,
    );
    if (url.href !== window.location.href)
      window.history[replace ? "replaceState" : "pushState"]({}, "", url);
  };
  const restoreLocation = () => {
    const state = readDiscoveryState(new URL(window.location.href), urlOptions);
    contentType = state.type;
    mode = state.mode;
    if (searchInput) searchInput.value = state.query;
    if (typeFilter) typeFilter.value = contentType;
    if (sportFilter) sportFilter.value = state.sport;
    if (bodyFilter) bodyFilter.value = state.body;
    visibleLimit = pageSize;
    updateLocation(true);
  };

  const render = () => {
    const query = (searchInput?.value ?? "").trim();
    const terms = videoSearchTerms(query);
    const searching = terms.length > 0;
    const sport = fixedSport || sportFilter?.value || "";
    const body = fixedBody || bodyFilter?.value || "";
    const narrowed =
      searching ||
      (contentType && !fixedType) ||
      (sport && !fixedSport) ||
      (body && !fixedBody);
    const typeLabel = typeFilter?.selectedOptions[0]?.textContent ?? "全部類型";
    const label =
      mode === "all"
        ? scoped
          ? scopeLabel
          : "全部影片"
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
          (card.dataset.contentTypes ?? "").split(" ").includes(contentType)) &&
        (!sport || card.dataset.sport === sport) &&
        (!body || card.dataset.body === body),
    );
    const displayed = selected.slice(0, visibleLimit);
    const visible = new Set(displayed);
    const rankByCard = new Map(
      mode === "popular"
        ? ranking.map((item, index) => [byId.get(item.videoId)!, index + 1])
        : [],
    );
    for (const card of cards) {
      setHidden(card, !visible.has(card));
      const count = popularCounts.get(card) ?? null;
      const rank = visible.has(card) ? rankByCard.get(card) : undefined;
      setHidden(count, !rank);
      if (rank) setText(count, rankLabel(rank));
    }
    // Filtering and loading more normally preserve relative DOM order. Only
    // move cards when a mode change actually produces a different visible order.
    const currentVisibleOrder = domOrder.filter((card) => visible.has(card));
    if (displayed.some((card, index) => currentVisibleOrder[index] !== card)) {
      for (const card of displayed) grid.append(card);
      domOrder = [
        ...domOrder.filter((card) => !visible.has(card)),
        ...displayed,
      ];
    }
    for (const button of buttons)
      setAttribute(
        button,
        "aria-pressed",
        String(button.dataset.discoveryMode === mode),
      );
    setText(scope, `搜尋範圍：${label}`);
    setHidden(clearSearch, !query);
    const updateChip = (
      button: HTMLButtonElement | null,
      value: string,
      label: string,
    ) => {
      if (!button) return;
      setHidden(button, !value);
      setText(button, `${label} ×`);
      setAttribute(button, "aria-label", `移除${label}`);
    };
    updateChip(clearType, fixedType ? "" : contentType, `類型：${typeLabel}`);
    updateChip(
      clearSport,
      fixedSport ? "" : sport,
      `運動：${sportFilter?.selectedOptions[0]?.textContent ?? ""}`,
    );
    updateChip(
      clearBody,
      fixedBody ? "" : body,
      `部位：${bodyFilter?.selectedOptions[0]?.textContent ?? ""}`,
    );
    setHidden(
      activeFilters,
      !(
        (sport && !fixedSport) ||
        (body && !fixedBody) ||
        (contentType && !fixedType)
      ),
    );
    const selectedFacets =
      Number(Boolean(sport && !fixedSport)) +
      Number(Boolean(body && !fixedBody));
    if (advancedCount) {
      setText(advancedCount, String(selectedFacets));
      setHidden(advancedCount, !selectedFacets);
    }
    setAttribute(
      advancedToggle,
      "aria-label",
      selectedFacets ? `更多篩選（已選 ${selectedFacets} 項）` : "更多篩選",
    );
    setHidden(searchAll, !(searching && mode !== "all"));
    const unavailable = mode === "popular" && popularityState !== "ready";
    if (empty) {
      setHidden(empty, !narrowed || selected.length > 0 || unavailable);
      if (!empty.hidden)
        setText(
          empty,
          searching
            ? `目前篩選條件中沒有符合「${query}」的影片；可清除搜尋、運動或部位後瀏覽。`
            : `目前沒有符合篩選條件的影片；可清除運動、部位或影片類型後瀏覽。`,
        );
    }
    setHidden(pagination, unavailable || selected.length === 0);
    setHidden(more, displayed.length >= selected.length);
    setText(
      pageStatus,
      `已顯示 ${displayed.length} / ${selected.length} 支符合條件的影片`,
    );
    if (mode === "popular" && popularityState === "loading") {
      setAttribute(grid, "aria-busy", "true");
      setText(status, "正在讀取本站近 30 天的熱門排行…");
      return;
    }
    if (grid.hasAttribute("aria-busy")) grid.removeAttribute("aria-busy");
    if (mode === "popular" && popularityState === "error") {
      setText(
        status,
        "目前無法讀取本站熱門，請稍後再試。也可以先看精選或全部影片。",
      );
    } else if (narrowed) {
      const filters = [
        contentType && !fixedType ? typeLabel : "",
        searching ? `「${query}」` : "",
        sport && !fixedSport
          ? sportFilter?.selectedOptions[0]?.textContent
          : "",
        body && !fixedBody ? bodyFilter?.selectedOptions[0]?.textContent : "",
      ]
        .filter(Boolean)
        .join("、");
      setText(
        status,
        `${label}中找到 ${selected.length} 支符合${filters}的影片。`,
      );
    } else if (mode === "all") {
      setText(
        status,
        `${scoped ? scopeLabel : "全部"} ${cards.length} 支影片。`,
      );
    } else if (mode === "curated") {
      setText(
        status,
        curated.length
          ? `精選 ${curated.length} 支：以畫面清楚、傷勢與回場資料完整，並涵蓋不同運動的影片為優先。`
          : "精選影片整理中，可先瀏覽全部影片。",
      );
    } else {
      setText(
        status,
        ranking.length
          ? "依本站近 30 天實際播放次數排序，最多顯示前 10 名，每小時整點更新；不包含 YouTube 平台的累計觀看數。"
          : "截至上一個整點，本站近 30 天尚無播放紀錄；每小時更新。也可以先看精選或全部影片。",
      );
    }
  };

  const selectMode = async (next: Mode) => {
    const current = ++version;
    pending?.abort();
    pending = undefined;
    mode = scoped ? "all" : next;
    visibleLimit = pageSize;
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
      if (next === "all" || next === "curated" || next === "popular") {
        void selectMode(next);
        updateLocation();
      }
    });
  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!composing) {
      visibleLimit = pageSize;
      updateLocation(true);
      render();
    }
  });
  searchInput?.addEventListener("compositionstart", () => {
    composing = true;
  });
  searchInput?.addEventListener("compositionend", () => {
    composing = false;
    visibleLimit = pageSize;
    updateLocation(true);
    render();
  });
  searchInput?.addEventListener("input", (event) => {
    if (!composing && !(event as InputEvent).isComposing) {
      visibleLimit = pageSize;
      updateLocation(true);
      render();
    }
  });
  const resetSearch = () => {
    if (!searchInput) return;
    searchInput.value = "";
    visibleLimit = pageSize;
    updateLocation();
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
    updateLocation();
    searchInput?.focus();
  });
  typeFilter?.addEventListener("change", () => {
    contentType = fixedType || typeFilter.value;
    visibleLimit = pageSize;
    render();
    updateLocation();
  });
  clearType?.addEventListener("click", () => {
    contentType = fixedType;
    visibleLimit = pageSize;
    if (typeFilter) typeFilter.value = fixedType;
    render();
    updateLocation();
    typeFilter?.focus();
  });
  const updateFacets = () => {
    if (fixedSport && sportFilter) sportFilter.value = fixedSport;
    if (fixedBody && bodyFilter) bodyFilter.value = fixedBody;
    visibleLimit = pageSize;
    render();
    updateLocation();
  };
  sportFilter?.addEventListener("change", updateFacets);
  bodyFilter?.addEventListener("change", updateFacets);
  const removeFacet = (select: HTMLSelectElement | null) => {
    if (!select) return;
    select.value = "";
    updateFacets();
    if (advancedFilters?.hidden) advancedToggle?.focus({ preventScroll: true });
    else select.focus({ preventScroll: true });
  };
  clearSport?.addEventListener("click", () => removeFacet(sportFilter));
  clearBody?.addEventListener("click", () => removeFacet(bodyFilter));
  grid.addEventListener("click", (event) => {
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[href]")
        : null;
    if (!link || !grid.contains(link)) return;
    const destination = new URL(link.href);
    if (
      destination.origin === window.location.origin &&
      /^\/(?:cases|videos)\/[a-z0-9-]+\/$/.test(destination.pathname)
    ) {
      rememberCatalogReturn(
        new URL(window.location.href),
        destination.pathname,
      );
    }
  });
  more?.addEventListener("click", () => {
    const previous = new Set(cards.filter((card) => !card.hidden));
    visibleLimit += pageSize;
    render();
    const firstNew = Array.from(
      grid.querySelectorAll<HTMLElement>("[data-discovery-slug]"),
    ).find((card) => !card.hidden && !previous.has(card));
    firstNew
      ?.querySelector<HTMLAnchorElement>("h3 a")
      ?.focus({ preventScroll: true });
  });
  window.addEventListener("popstate", () => {
    restoreLocation();
    void selectMode(mode);
  });
  controls.hidden = false;
  if (searchForm) searchForm.hidden = false;
  syncAdvancedFilters();
  root.dataset.discoveryReady = "true";
  restoreLocation();
  void selectMode(mode);
}

if (typeof document !== "undefined") {
  document
    .querySelectorAll<HTMLElement>("[data-video-discovery]")
    .forEach(initializeVideoDiscovery);
}
