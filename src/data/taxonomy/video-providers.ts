import type { VideoProviderDefinition } from "../../lib/contracts/taxonomy";

/**
 * Registry-controlled provider/host/embed state. Only YouTube hosts may be
 * embedded; NBA.com is external-link-only. Adding a provider requires an
 * explicit registry and test change.
 */
export const VIDEO_PROVIDERS: readonly VideoProviderDefinition[] = [
  {
    code: "youtube",
    allowedHosts: ["youtube.com", "www.youtube.com", "youtu.be"],
    allowedEmbedStatuses: ["verified", "external-link-only", "unavailable"],
    canEmbed: true,
  },
  {
    code: "nba",
    allowedHosts: ["nba.com", "www.nba.com"],
    allowedEmbedStatuses: ["external-link-only", "unavailable"],
    canEmbed: false,
  },
];
