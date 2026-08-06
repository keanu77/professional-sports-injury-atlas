/**
 * Deterministic robots.txt endpoint. Review mode always disallows all
 * crawling; public mode fails closed to Disallow unless the governance
 * record is explicitly public-approved with an authorized indexing
 * authorization.
 */

import type { APIRoute } from "astro";
import governance from "../data/site-governance.v1.json";
import { resolveBuildMode, robotsTxtBody } from "../lib/governance/build-mode";

export const GET: APIRoute = () => {
  const body = robotsTxtBody(
    resolveBuildMode(process.env.ATLAS_BUILD_MODE),
    governance,
  );
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
