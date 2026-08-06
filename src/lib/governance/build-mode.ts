/**
 * Build-mode resolution and indexing policy. `ATLAS_BUILD_MODE` accepts only
 * `review` or `public`; an absent value means `review`; any other value
 * throws. Review output is never described as access-controlled until hosting
 * verification exists.
 */

export type BuildMode = "review" | "public";

export class BuildModeError extends Error {}

/** Absent means review; only the two literal modes are accepted. */
export function resolveBuildMode(
  rawValue: string | undefined = process.env.ATLAS_BUILD_MODE,
): BuildMode {
  if (rawValue === undefined) return "review";
  if (rawValue === "review" || rawValue === "public") return rawValue;
  throw new BuildModeError(
    `ATLAS_BUILD_MODE must be "review" or "public"; got ${JSON.stringify(rawValue)}`,
  );
}

/** Exact robots meta content required on every review-mode HTML page. */
export const NOINDEX_ROBOTS_META =
  "noindex,nofollow,noarchive,nosnippet,noimageindex";

/** Exact review X-Robots-Tag header value declared by the ops header policy. */
export const REVIEW_X_ROBOTS_TAG =
  "noindex, nofollow, noarchive, nosnippet, noimageindex";

export const DISALLOW_ALL_ROBOTS_TXT = "User-agent: *\nDisallow: /\n";
export const ALLOW_ALL_ROBOTS_TXT = "User-agent: *\nAllow: /\n";

/** Review pages always carry the noindex meta; public pages carry none. */
export function robotsMetaContent(mode: BuildMode): string | null {
  return mode === "review" ? NOINDEX_ROBOTS_META : null;
}

interface IndexingGovernanceView {
  siteStatus: string;
  allowIndexing: boolean;
  indexingAuthorization: { status: string };
}

/**
 * robots.txt body. Review mode always disallows everything. Public mode
 * allows crawling only when the governance record is explicitly
 * public-approved with allowIndexing and an authorized indexing
 * authorization; anything else fails closed to Disallow.
 */
export function robotsTxtBody(
  mode: BuildMode,
  governance: IndexingGovernanceView | null,
): string {
  if (mode === "review") return DISALLOW_ALL_ROBOTS_TXT;
  if (
    governance !== null &&
    governance.siteStatus === "public-approved" &&
    governance.allowIndexing === true &&
    governance.indexingAuthorization.status === "authorized"
  ) {
    return ALLOW_ALL_ROBOTS_TXT;
  }
  return DISALLOW_ALL_ROBOTS_TXT;
}
