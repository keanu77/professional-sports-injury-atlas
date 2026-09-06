/** A page-scoped event ID is reused for retries; no cross-page visitor ID. */
export function createPlaybackTracker(videoId: string): () => void {
  let started = false;
  return () => {
    const preferences = navigator as Navigator & {
      globalPrivacyControl?: boolean;
    };
    if (
      started ||
      preferences.doNotTrack === "1" ||
      preferences.globalPrivacyControl
    )
      return;
    // Never collect review builds or raw source links.
    if (document.documentElement.dataset.playbackStatistics !== "enabled")
      return;
    started = true;
    const body = JSON.stringify({ videoId, eventId: crypto.randomUUID() });
    const send = async () => {
      const result = await fetch("/api/plays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        credentials: "omit",
        keepalive: true,
      });
      if (!result.ok) throw new Error("play-count-unavailable");
    };
    // Statistics never interrupt the player; one retry keeps the same event ID.
    void send().catch(() => {
      window.setTimeout(() => {
        void send().catch(() => {});
      }, 1500);
    });
  };
}
