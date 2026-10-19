export type DiscoveryMode = "all" | "curated" | "popular";
export interface DiscoveryState {
  query: string;
  type: string;
  sport: string;
  body: string;
  mode: DiscoveryMode;
}
export interface DiscoveryScope {
  fixedType?: string;
  fixedSport?: string;
  fixedBody?: string;
  fixedSituation?: string;
}
export interface DiscoveryOptions extends DiscoveryScope {
  types: ReadonlySet<string>;
  sports: ReadonlySet<string>;
  bodies: ReadonlySet<string>;
}

export function hasDiscoveryScope(scope: DiscoveryScope): boolean {
  return Boolean(
    scope.fixedType ||
    scope.fixedSport ||
    scope.fixedBody ||
    scope.fixedSituation,
  );
}

export function readDiscoveryState(
  url: URL,
  options: DiscoveryOptions,
): DiscoveryState {
  const valid = (key: string, allowed: ReadonlySet<string>) => {
    const value = url.searchParams.get(key) ?? "";
    return allowed.has(value) ? value : "";
  };
  const mode = url.searchParams.get("mode");
  return {
    query: (url.searchParams.get("q") ?? "").trim().slice(0, 120),
    type: options.fixedType || valid("type", options.types),
    sport: options.fixedSport || valid("sport", options.sports),
    body: options.fixedBody || valid("body", options.bodies),
    mode:
      !hasDiscoveryScope(options) && (mode === "curated" || mode === "popular")
        ? mode
        : "all",
  };
}

export function writeDiscoveryState(
  url: URL,
  state: DiscoveryState,
  fixed: DiscoveryScope | string = {},
): URL {
  const next = new URL(url);
  const scope = typeof fixed === "string" ? { fixedType: fixed } : fixed;
  if (scope.fixedSituation) next.searchParams.delete("situation");
  const values = {
    q: state.query.trim().slice(0, 120),
    type: scope.fixedType ? "" : state.type,
    sport: scope.fixedSport ? "" : state.sport,
    body: scope.fixedBody ? "" : state.body,
    mode: hasDiscoveryScope(scope) || state.mode === "all" ? "" : state.mode,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value) next.searchParams.set(key, value);
    else next.searchParams.delete(key);
  }
  return next;
}
