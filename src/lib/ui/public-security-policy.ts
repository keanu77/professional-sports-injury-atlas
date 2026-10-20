export const PUBLIC_CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.youtube.com https://s.ytimg.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "frame-src https://www.youtube-nocookie.com https://streamable.com https://challenges.cloudflare.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

export const PUBLIC_HEADERS = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: ${PUBLIC_CSP}
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
/version.json
  Cache-Control: no-store
/preferences-init.js
  Content-Type: text/javascript; charset=utf-8
  Cache-Control: public, max-age=0, must-revalidate
  X-Content-Type-Options: nosniff
`;

/** JSON data scripts do not execute and therefore do not require script-src. */
export function isExecutableScript(attrs: Record<string, string>): boolean {
  const type = (attrs.type ?? "").trim().toLowerCase();
  return type !== "application/ld+json" && type !== "application/json";
}
