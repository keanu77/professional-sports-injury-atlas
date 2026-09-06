import type { APIRoute } from "astro";

export const prerender = true;

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="運動傷害影片圖鑑">
  <rect width="64" height="64" rx="14" fill="#0d6670" />
  <path d="M22 16h20v7H29v6h11v7H29v12h-7z" fill="#fff" />
  <circle cx="43" cy="45" r="6" fill="#ff9d78" />
</svg>\n`;

export const GET: APIRoute = () =>
  new Response(SVG, {
    headers: {
      "Cache-Control": "public, max-age=604800",
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
