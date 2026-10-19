import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { resolveBuildMode } from "../../../lib/governance/build-mode";
import {
  detailShareCatalog,
  type DetailShareCard,
} from "../../../lib/social/catalog";
import { renderDetailShareImage } from "../../../lib/social/render";

export const prerender = true;

export async function getStaticPaths() {
  const mode = resolveBuildMode(process.env.ATLAS_BUILD_MODE);
  const records = (await getCollection("cases")).map((entry) => entry.data);
  return detailShareCatalog(mode, records).map((card) => ({
    params: { kind: card.kind, slug: card.slug },
    props: { card },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const bytes = await renderDetailShareImage(props.card as DetailShareCard);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/png",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
};
