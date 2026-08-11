/**
 * Decision 11 P2-5 presentation policy.
 *
 * Evidence records retain their canonical NBA.com URLs, but the site must not
 * turn those values into navigable links. No NBA target is allowlisted here:
 * adding even a league or team homepage requires a later, explicit review and
 * test change. That keeps new NBA subdomains and paths fail closed.
 */

const NBA_HOST = "nba.com";

export type ExternalUrlPresentation =
  "clickable-link" | "nba-plain-text-citation" | "invalid-plain-text-citation";

export function isNbaHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/u, "");
  return normalized === NBA_HOST || normalized.endsWith(`.${NBA_HOST}`);
}

export function isNbaUrl(value: string): boolean {
  try {
    return isNbaHost(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function isNbaDeepUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (!isNbaHost(url.hostname)) return false;
    return (
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== "" ||
      url.username !== "" ||
      url.password !== "" ||
      url.port !== ""
    );
  } catch {
    return false;
  }
}

export function externalUrlPresentationFor(
  value: string,
): ExternalUrlPresentation {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "invalid-plain-text-citation";
  }
  if (
    url.protocol !== "https:" ||
    url.hostname === "" ||
    url.username !== "" ||
    url.password !== ""
  ) {
    return "invalid-plain-text-citation";
  }
  return isNbaHost(url.hostname) ? "nba-plain-text-citation" : "clickable-link";
}
