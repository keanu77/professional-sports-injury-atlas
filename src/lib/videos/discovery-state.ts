export type DiscoveryMode = "all" | "curated" | "popular";
export interface DiscoveryState {
  query: string;
  type: string;
  sport: string;
  body: string;
  mode: DiscoveryMode;
}
export interface DiscoveryOptions {
  types: ReadonlySet<string>;
  sports: ReadonlySet<string>;
  bodies: ReadonlySet<string>;
  fixedType?: string;
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
    sport: valid("sport", options.sports),
    body: valid("body", options.bodies),
    mode:
      !options.fixedType && (mode === "curated" || mode === "popular")
        ? mode
        : "all",
  };
}

export function writeDiscoveryState(
  url: URL,
  state: DiscoveryState,
  fixedType = "",
): URL {
  const next = new URL(url);
  const values = {
    q: state.query.trim(),
    type: fixedType ? "" : state.type,
    sport: state.sport,
    body: state.body,
    mode: state.mode === "all" ? "" : state.mode,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value) next.searchParams.set(key, value);
    else next.searchParams.delete(key);
  }
  return next;
}
