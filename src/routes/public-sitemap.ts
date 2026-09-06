import type { APIRoute } from "astro";
import { renderPublicSitemap } from "../lib/governance/sitemap";
import { publicDomain } from "../lib/patient/public-domain";

export const GET: APIRoute = () =>
  new Response(renderPublicSitemap(["/"], publicDomain.origin), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
