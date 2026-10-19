export const CATALOG_RETURN_KEY = "sport-injury-catalog-return";
export const CATALOG_RETURN_FALLBACK = "/#videos-heading";

// Keep this client allowlist small: importing the reviewed video registries
// here would ship their complete source metadata to every detail page.
export const CATALOG_RETURN_PATHS = new Set([
  "/",
  ...[
    "head-neck",
    "shoulder",
    "elbow",
    "wrist",
    "hand",
    "trunk",
    "pelvis",
    "ankle",
    "foot",
    "calf-achilles",
    "knee",
    "posterior-thigh",
    "arm",
    "hip-thigh",
  ].map((code) => `/body-parts/${code}/`),
  ...[
    "basketball",
    "baseball",
    "cricket",
    "football",
    "tennis",
    "badminton",
    "athletics",
    "gymnastics",
    "figure-skating",
    "ice-hockey",
    "rugby",
    "american-football",
    "alpine-skiing",
    "cycling",
    "motorcycle-racing",
    "automobile-racing",
    "crossfit",
    "surfing",
    "swimming",
    "snowboarding",
    "beach-volleyball",
    "indoor-volleyball",
    "mixed-martial-arts",
    "wrestling",
    "boxing",
    "skateboarding",
    "golf",
    "weightlifting",
    "ski-jumping",
    "handball",
  ].map((code) => `/sports/${code}/`),
  ...[
    "landing",
    "running-turning",
    "collision",
    "fall",
    "ball-impact",
    "racket-swing",
    "unclear",
  ].map((code) => `/situations/${code}/`),
  ...[
    "injury-moment",
    "immediate-aftermath",
    "post-event-interview",
    "news-report",
    "expert-analysis",
    "rehab-return",
    "documentary-retrospective",
    "match-record-commentary",
  ].map((code) => `/video-types/${code}/`),
]);

/** Accept only a bounded relative URL for an existing catalog route. */
export function validateCatalogReturn(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value.length > 4096 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/u.test(value)
  )
    return null;
  const path = value.split(/[?#]/u, 1)[0]!;
  if (!CATALOG_RETURN_PATHS.has(path)) return null;
  try {
    const url = new URL(value, "https://catalog.invalid");
    if (url.origin !== "https://catalog.invalid" || url.pathname !== path)
      return null;
    return `${url.pathname}${url.search}#videos-heading`;
  } catch {
    return null;
  }
}

const isDetailPath = (path: string): boolean =>
  /^\/(?:cases|videos)\/[a-z0-9-]+\/$/u.test(path);

/** Destination binding prevents an unrelated detail visit reusing old filters. */
export function rememberCatalogReturn(url: URL, detailPath: string): void {
  if (!isDetailPath(detailPath)) return;
  const href = validateCatalogReturn(`${url.pathname}${url.search}`);
  if (!href) return;
  try {
    window.sessionStorage.setItem(
      CATALOG_RETURN_KEY,
      JSON.stringify({ href, detailPath }),
    );
  } catch {
    // Storage is optional; the rendered catalog link remains available.
  }
}

export function readCatalogReturn(detailPath: string): string | null {
  if (!isDetailPath(detailPath)) return null;
  try {
    const raw = window.sessionStorage.getItem(CATALOG_RETURN_KEY);
    if (!raw || raw.length > 4608) return null;
    const saved: unknown = JSON.parse(raw);
    if (
      !saved ||
      typeof saved !== "object" ||
      !("detailPath" in saved) ||
      saved.detailPath !== detailPath ||
      !("href" in saved)
    )
      return null;
    return validateCatalogReturn(saved.href);
  } catch {
    return null;
  }
}
