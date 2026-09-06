import launch from "../../data/public-launch.v1.json";
import expansion from "../../data/videos/expansion.v1.json";

/** Public video covers only; historical review illustrations remain available. */
export function caseThumbnailId(recordId: string): string | null {
  if (process.env.ATLAS_PUBLIC_LAUNCH !== "decision-21") return null;
  const record = [...launch.cases, ...expansion.cases].find(
    (item) => item.id === recordId,
  );
  return record ? new URL(record.videoUrl).searchParams.get("v") : null;
}
