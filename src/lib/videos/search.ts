/** Literal, accent-insensitive matching; no query is sent to a service. */
export function normalizeVideoSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

export function videoSearchTerms(query: string): string[] {
  return normalizeVideoSearch(query).split(" ").filter(Boolean);
}

export function matchesVideoSearch(
  normalizedText: string,
  terms: readonly string[],
): boolean {
  return terms.every((term) => normalizedText.includes(term));
}
