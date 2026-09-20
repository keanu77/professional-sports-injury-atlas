export type ObservationProvider = "youtube" | "mlb";

const MLB_EMBEDS = {
  "zack-kelly-leaves-with-injury": {
    canonicalUrl:
      "https://www.mlb.com/redsox/video/zack-kelly-leaves-with-injury",
    embedUrl:
      "https://streamable.com/m/zack-kelly-leaves-with-injury?partnerId=web_video-playback-page_video-share",
  },
} as const;

export function observationProviderFor(
  provider: ObservationProvider | undefined,
): ObservationProvider {
  return provider ?? "youtube";
}

/** Returns an embed only for explicitly reviewed non-YouTube footage. */
export function observationEmbedFor(
  provider: ObservationProvider | undefined,
  videoId: string,
): { provider: "mlb"; src: string } | null {
  if (provider !== "mlb" || !Object.hasOwn(MLB_EMBEDS, videoId)) return null;
  return {
    provider: "mlb",
    src: MLB_EMBEDS[videoId as keyof typeof MLB_EMBEDS].embedUrl,
  };
}

export function observationCanonicalUrlFor(
  provider: ObservationProvider | undefined,
  videoId: string,
): string | null {
  if (provider !== "mlb" || !Object.hasOwn(MLB_EMBEDS, videoId)) return null;
  return MLB_EMBEDS[videoId as keyof typeof MLB_EMBEDS].canonicalUrl;
}
