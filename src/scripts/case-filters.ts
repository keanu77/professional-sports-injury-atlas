/**
 * Progressive case filtering. The pure engine below is unit-tested with
 * fictional in-memory fixtures; `initCaseFilters()` enhances the static
 * listing pages. Only the first filter interaction loads the minimal index
 * manifest plus the needed 100-entry injury shards; the initial page load
 * never fetches a shard. Filter state updates the query string with
 * `history.replaceState`, result counts are announced via `aria-live`, and a
 * single reset action restores the static listing. Without JavaScript the
 * static pagination stays fully readable; compound filtering is the
 * documented degradation.
 */

import { MECHANISMS } from "../data/taxonomy/mechanisms";
import type { MechanismDefinition } from "../lib/contracts/taxonomy";
import type {
  CaseIndexEntry,
  CaseIndexManifest,
} from "../lib/cases/pagination";

export const FILTER_RESULT_PAGE_SIZE = 12;

/** One compound filter state; empty/null dimensions do not constrain. */
export interface CaseFilterState {
  keyword: string;
  eventYear: number | null;
  season: string | null;
  sport: string | null;
  league: string | null;
  injury: string | null;
  mechanism: string | null;
  classicOnly: boolean;
  /** External diagnosis confirmation status; never a workflow state. */
  confirmationStatus: string | null;
  /** Private review workflow status; never a diagnosis state. */
  workflowStatus: string | null;
}

export function emptyFilterState(): CaseFilterState {
  return {
    keyword: "",
    eventYear: null,
    season: null,
    sport: null,
    league: null,
    injury: null,
    mechanism: null,
    classicOnly: false,
    confirmationStatus: null,
    workflowStatus: null,
  };
}

export function isEmptyFilterState(state: CaseFilterState): boolean {
  return (
    state.keyword.trim() === "" &&
    state.eventYear === null &&
    state.season === null &&
    state.sport === null &&
    state.league === null &&
    state.injury === null &&
    state.mechanism === null &&
    !state.classicOnly &&
    state.confirmationStatus === null &&
    state.workflowStatus === null
  );
}

const normalize = (value: string): string =>
  value.normalize("NFC").toLowerCase();

/**
 * Resolves a mechanism token (controlled code or registered search alias) to
 * a mechanism code; an unknown token matches nothing.
 */
export function resolveMechanismToken(
  token: string,
  mechanisms: readonly MechanismDefinition[] = MECHANISMS,
): string | null {
  const wanted = normalize(token.trim());
  if (wanted === "") return null;
  for (const mechanism of mechanisms) {
    if (normalize(mechanism.code) === wanted) return mechanism.code;
    if (mechanism.searchAliases.some((alias) => normalize(alias) === wanted)) {
      return mechanism.code;
    }
  }
  return null;
}

function matchesKeyword(entry: CaseIndexEntry, keyword: string): boolean {
  const wanted = normalize(keyword.trim());
  if (wanted === "") return true;
  return [entry.athleteName, entry.teamName, entry.opponentName].some((name) =>
    normalize(name).includes(wanted),
  );
}

/** Applies every set dimension of a compound filter to the index entries. */
export function applyCaseFilters(
  entries: readonly CaseIndexEntry[],
  state: CaseFilterState,
  mechanisms: readonly MechanismDefinition[] = MECHANISMS,
): CaseIndexEntry[] {
  const mechanismCode =
    state.mechanism === null
      ? null
      : resolveMechanismToken(state.mechanism, mechanisms);
  return entries.filter((entry) => {
    if (!matchesKeyword(entry, state.keyword)) return false;
    if (state.eventYear !== null && entry.eventYear !== state.eventYear) {
      return false;
    }
    if (state.season !== null && entry.season !== state.season) return false;
    if (state.sport !== null && entry.sportCode !== state.sport) return false;
    if (state.league !== null && entry.leagueCode !== state.league) {
      return false;
    }
    if (state.injury !== null && entry.injuryCode !== state.injury) {
      return false;
    }
    if (state.mechanism !== null) {
      if (
        mechanismCode === null ||
        !entry.mechanismTags.includes(mechanismCode)
      ) {
        return false;
      }
    }
    if (state.classicOnly && !entry.isClassic) return false;
    if (
      state.confirmationStatus !== null &&
      entry.confirmationStatus !== state.confirmationStatus
    ) {
      return false;
    }
    if (
      state.workflowStatus !== null &&
      entry.workflowStatus !== state.workflowStatus
    ) {
      return false;
    }
    return true;
  });
}

const QUERY_KEYS: Array<[keyof CaseFilterState, string]> = [
  ["keyword", "keyword"],
  ["eventYear", "year"],
  ["season", "season"],
  ["sport", "sport"],
  ["league", "league"],
  ["injury", "injury"],
  ["mechanism", "mechanism"],
  ["classicOnly", "classic"],
  ["confirmationStatus", "confirmation"],
  ["workflowStatus", "workflow"],
];

/** Serializes only the set dimensions into a deterministic query string. */
export function serializeFilterQuery(state: CaseFilterState): string {
  const params = new URLSearchParams();
  for (const [field, key] of QUERY_KEYS) {
    const value = state[field];
    if (field === "classicOnly") {
      if (state.classicOnly) params.set(key, "1");
    } else if (field === "keyword") {
      if (state.keyword.trim() !== "") params.set(key, state.keyword.trim());
    } else if (value !== null) {
      params.set(key, String(value));
    }
  }
  const serialized = params.toString();
  return serialized === "" ? "" : `?${serialized}`;
}

/** Parses a query string back into a filter state; invalid years are ignored. */
export function parseFilterQuery(search: string): CaseFilterState {
  const params = new URLSearchParams(search);
  const state = emptyFilterState();
  const text = (key: string): string | null => {
    const value = params.get(key);
    return value === null || value.trim() === "" ? null : value.trim();
  };
  state.keyword = text("keyword") ?? "";
  const year = text("year");
  if (year !== null && /^\d{4}$/.test(year)) {
    state.eventYear = Number.parseInt(year, 10);
  }
  state.season = text("season");
  state.sport = text("sport");
  state.league = text("league");
  state.injury = text("injury");
  state.mechanism = text("mechanism");
  state.classicOnly = params.get("classic") === "1";
  state.confirmationStatus = text("confirmation");
  state.workflowStatus = text("workflow");
  return state;
}

/** Injury shard sets required by a filter state (all listed when unfiltered). */
export function neededInjuryCodes(
  state: CaseFilterState,
  manifest: CaseIndexManifest,
): string[] {
  const listed = manifest.injuries
    .filter((entry) => entry.shardCount > 0)
    .map((entry) => entry.injuryCode);
  if (state.injury !== null) {
    return listed.filter((code) => code === state.injury);
  }
  return listed;
}

/* ------------------------------------------------------------------ */
/* DOM enhancement                                                     */
/* ------------------------------------------------------------------ */

function readFormState(form: HTMLFormElement): CaseFilterState {
  const state = emptyFilterState();
  const data = new FormData(form);
  const text = (name: string): string | null => {
    const raw = data.get(name);
    if (typeof raw !== "string" || raw.trim() === "") return null;
    return raw.trim();
  };
  state.keyword = text("keyword") ?? "";
  const year = text("eventYear");
  if (year !== null && /^\d{4}$/.test(year)) {
    state.eventYear = Number.parseInt(year, 10);
  }
  state.season = text("season");
  state.sport = text("sport");
  state.league = text("league");
  state.injury = text("injury");
  state.mechanism = text("mechanism");
  state.classicOnly = data.get("classicOnly") === "1";
  state.confirmationStatus = text("confirmationStatus");
  state.workflowStatus = text("workflowStatus");
  return state;
}

function prefillForm(form: HTMLFormElement, state: CaseFilterState): void {
  const set = (name: string, value: string): void => {
    const field = form.elements.namedItem(name);
    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLSelectElement
    ) {
      field.value = value;
    }
  };
  set("keyword", state.keyword);
  set("eventYear", state.eventYear === null ? "" : String(state.eventYear));
  set("season", state.season ?? "");
  set("sport", state.sport ?? "");
  set("league", state.league ?? "");
  set("injury", state.injury ?? "");
  set("mechanism", state.mechanism ?? "");
  set("confirmationStatus", state.confirmationStatus ?? "");
  set("workflowStatus", state.workflowStatus ?? "");
  const classic = form.elements.namedItem("classicOnly");
  if (classic instanceof HTMLInputElement) {
    classic.checked = state.classicOnly;
  }
}

interface FilterController {
  root: HTMLElement;
  form: HTMLFormElement;
  status: HTMLElement;
  results: HTMLElement;
  staticListing: HTMLElement | null;
  manifest: CaseIndexManifest | null;
  loadedShards: Map<string, CaseIndexEntry[]>;
  matches: CaseIndexEntry[];
  renderedCount: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error(`fetch ${url} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

async function ensureIndex(
  controller: FilterController,
  state: CaseFilterState,
): Promise<CaseIndexEntry[]> {
  if (controller.manifest === null) {
    controller.manifest = await fetchJson<CaseIndexManifest>(
      "/case-index/manifest.json",
    );
  }
  const manifest = controller.manifest;
  const needed = neededInjuryCodes(state, manifest);
  const entries: CaseIndexEntry[] = [];
  for (const injuryCode of needed) {
    const listed = manifest.injuries.find(
      (entry) => entry.injuryCode === injuryCode,
    );
    if (listed === undefined) continue;
    for (let shard = 1; shard <= listed.shardCount; shard += 1) {
      const key = `${injuryCode}/${shard}`;
      let loaded = controller.loadedShards.get(key);
      if (loaded === undefined) {
        loaded = await fetchJson<CaseIndexEntry[]>(
          `/case-index/${injuryCode}/${shard}.json`,
        );
        controller.loadedShards.set(key, loaded);
      }
      entries.push(...loaded);
    }
  }
  return entries;
}

function renderEntry(entry: CaseIndexEntry): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "filter-result";
  const link = document.createElement("a");
  link.href = `/cases/${entry.slug}/`;
  link.textContent = `${entry.athleteName}｜${entry.teamName}`;
  const facts = document.createElement("p");
  facts.textContent = `${entry.season} 球季（${entry.eventYear} 年）｜傷種：${entry.injuryCode}`;
  item.append(link, facts);
  if (entry.isClassic) {
    const classic = document.createElement("p");
    classic.textContent =
      entry.classicReason === null
        ? "經典案例"
        : `經典案例：${entry.classicReason}`;
    item.append(classic);
  }
  return item;
}

function renderResults(controller: FilterController, reset: boolean): void {
  if (reset) {
    controller.results.textContent = "";
    controller.renderedCount = 0;
  }
  const moreButton = controller.results.querySelector("[data-filter-more]");
  if (moreButton !== null) moreButton.remove();
  const nextSlice = controller.matches.slice(
    controller.renderedCount,
    controller.renderedCount + FILTER_RESULT_PAGE_SIZE,
  );
  for (const entry of nextSlice) {
    controller.results.append(renderEntry(entry));
  }
  controller.renderedCount += nextSlice.length;
  if (controller.renderedCount < controller.matches.length) {
    const more = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-filter-more", "");
    button.className = "filter-more-button";
    button.textContent = `顯示更多結果（已顯示 ${controller.renderedCount}／${controller.matches.length} 筆）`;
    button.addEventListener("click", () => {
      renderResults(controller, false);
    });
    more.append(button);
    controller.results.append(more);
  }
  controller.results.hidden = false;
}

function announce(controller: FilterController, message: string): void {
  controller.status.textContent = message;
}

async function applyFromForm(controller: FilterController): Promise<void> {
  const state = readFormState(controller.form);
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${serializeFilterQuery(state)}`,
  );
  try {
    const entries = await ensureIndex(controller, state);
    controller.matches = applyCaseFilters(entries, state);
    renderResults(controller, true);
    if (controller.staticListing !== null) {
      controller.staticListing.hidden = true;
    }
    announce(controller, `符合條件的案例共 ${controller.matches.length} 筆。`);
  } catch {
    announce(controller, "篩選索引載入失敗；下方靜態列表與分頁仍完整可用。");
  }
}

function resetFilters(controller: FilterController): void {
  controller.form.reset();
  prefillForm(controller.form, emptyFilterState());
  controller.matches = [];
  controller.results.textContent = "";
  controller.results.hidden = true;
  controller.renderedCount = 0;
  if (controller.staticListing !== null) {
    controller.staticListing.hidden = false;
  }
  window.history.replaceState(null, "", window.location.pathname);
  announce(controller, "已重設全部篩選；顯示完整靜態列表。");
}

/** Enhances every `[data-case-filters]` block on the page. */
export function initCaseFilters(root: ParentNode = document): void {
  const blocks = root.querySelectorAll<HTMLElement>("[data-case-filters]");
  for (const block of blocks) {
    if (block.dataset.filtersReady === "true") continue;
    block.dataset.filtersReady = "true";
    const form = block.querySelector<HTMLFormElement>("[data-filter-form]");
    const status = block.querySelector<HTMLElement>("[data-filter-status]");
    const results = block.querySelector<HTMLElement>("[data-filter-results]");
    if (form === null || status === null || results === null) continue;
    const controller: FilterController = {
      root: block,
      form,
      status,
      results,
      staticListing: document.querySelector<HTMLElement>(
        "[data-static-listing]",
      ),
      manifest: null,
      loadedShards: new Map(),
      matches: [],
      renderedCount: 0,
    };
    prefillForm(form, parseFilterQuery(window.location.search));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void applyFromForm(controller);
    });
    form.addEventListener("change", () => {
      void applyFromForm(controller);
    });
    form.addEventListener("input", (event) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement &&
        (target.type === "search" ||
          target.type === "number" ||
          target.type === "text")
      ) {
        void applyFromForm(controller);
      }
    });
    const reset = block.querySelector<HTMLButtonElement>("[data-filter-reset]");
    reset?.addEventListener("click", () => {
      resetFilters(controller);
    });
  }
}
