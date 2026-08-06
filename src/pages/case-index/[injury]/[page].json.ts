/**
 * Deferred 100-entry case-index shards, one JSON file per injury and shard
 * page. Shards exist only for injuries with at least one selector-permitted
 * case and contain only the minimal card fields: review shards carry the
 * separate diagnosis-confirmation and private workflow status fields, public
 * shards never include workflow status.
 */

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { buildCaseIndexShards } from "../../../lib/cases/pagination";
import { resolveBuildMode } from "../../../lib/governance/build-mode";

interface ShardProps {
  body: string;
}

export async function getStaticPaths(): Promise<
  Array<{ params: { injury: string; page: string }; props: ShardProps }>
> {
  const mode = resolveBuildMode(process.env.ATLAS_BUILD_MODE);
  const caseRecords = (await getCollection("cases")).map((entry) => entry.data);
  const shards = buildCaseIndexShards(mode, caseRecords);
  const paths: Array<{
    params: { injury: string; page: string };
    props: ShardProps;
  }> = [];
  for (const [injuryCode, injuryShards] of shards) {
    injuryShards.forEach((shard, index) => {
      paths.push({
        params: { injury: injuryCode, page: String(index + 1) },
        props: { body: JSON.stringify(shard) },
      });
    });
  }
  return paths;
}

export const GET: APIRoute = ({ props }) => {
  const { body } = props as ShardProps;
  return new Response(body, {
    headers: { "Content-Type": "application/json" },
  });
};
