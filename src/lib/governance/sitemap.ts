import { compareCodePoints } from "../contracts/canonical";

function isIndexableHtmlPath(pathname: string): boolean {
  return (
    (pathname === "/" || pathname.endsWith("/")) &&
    pathname !== "/404/" &&
    !pathname.startsWith("/review/")
  );
}

function normalizeBuiltPathname(pathname: string): string {
  const trimmed = pathname.replace(/^\/+|\/+$/gu, "");
  if (trimmed === "") return "/";
  return /\.[a-z0-9]+$/iu.test(trimmed) ? `/${trimmed}` : `/${trimmed}/`;
}

export function publicSitemapPathnames(
  builtPathnames: readonly string[],
): string[] {
  return [...new Set(builtPathnames.map(normalizeBuiltPathname))]
    .filter(isIndexableHtmlPath)
    .sort(compareCodePoints);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function renderPublicSitemap(
  builtPathnames: readonly string[],
  origin: string,
): string {
  const urls = publicSitemapPathnames(builtPathnames)
    .map(
      (pathname) =>
        `  <url><loc>${escapeXml(new URL(pathname, origin).href)}</loc></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
