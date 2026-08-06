/**
 * Typed adapter over the official YouTube IFrame Player API. It dynamically
 * loads `https://www.youtube.com/iframe_api` only after the reader's explicit
 * click, hands the existing privacy-enhanced iframe element to one
 * `YT.Player` instance using only the documented `events.onReady` /
 * `events.onError` options (never the undocumented `host` option, never a
 * replacement iframe, never a raw postMessage protocol), and exposes the one
 * `seekTo()` call the timeline enhancement needs. Load or readiness failure
 * rejects so the caller can remove the iframe and fall back to the real
 * source links.
 */

import { YOUTUBE_IFRAME_API_URL } from "./youtube";

export interface YouTubePlayerInstance {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
}

export interface YouTubeNamespace {
  Player: new (
    element: HTMLIFrameElement,
    options: {
      events: {
        onReady: (event: unknown) => void;
        onError: (event: unknown) => void;
      };
    },
  ) => YouTubePlayerInstance;
}

export interface PlayerEventHandlers {
  onReady: () => void;
  onError: () => void;
}

type YouTubeWindow = Window & {
  YT?: unknown;
  onYouTubeIframeAPIReady?: () => void;
};

export const API_LOAD_TIMEOUT_MS = 8000;

let apiPromise: Promise<YouTubeNamespace> | null = null;

function readNamespace(target: YouTubeWindow): YouTubeNamespace | null {
  const candidate = target.YT;
  if (
    typeof candidate === "object" &&
    candidate !== null &&
    typeof (candidate as { Player?: unknown }).Player === "function"
  ) {
    return candidate as YouTubeNamespace;
  }
  return null;
}

/**
 * Loads the official IFrame API once and resolves with the `YT` namespace.
 * Script errors and a readiness timeout both reject; a rejected attempt is
 * not cached, so a later click may retry.
 */
export function loadIframeApi(
  timeoutMs: number = API_LOAD_TIMEOUT_MS,
): Promise<YouTubeNamespace> {
  if (apiPromise !== null) return apiPromise;
  const target = window as YouTubeWindow;
  const existing = readNamespace(target);
  if (existing !== null) {
    apiPromise = Promise.resolve(existing);
    return apiPromise;
  }

  apiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    const previousReady = target.onYouTubeIframeAPIReady;
    const timer = window.setTimeout(() => {
      fail(new Error("youtube-iframe-api-timeout"));
    }, timeoutMs);

    const fail = (error: Error): void => {
      window.clearTimeout(timer);
      apiPromise = null;
      reject(error);
    };

    target.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timer);
      if (typeof previousReady === "function") previousReady();
      const loaded = readNamespace(target);
      if (loaded === null) {
        fail(new Error("youtube-iframe-api-missing"));
        return;
      }
      resolve(loaded);
    };

    const script = document.createElement("script");
    script.src = YOUTUBE_IFRAME_API_URL;
    script.async = true;
    script.addEventListener("error", () => {
      script.remove();
      fail(new Error("youtube-iframe-api-load-failed"));
    });
    document.head.append(script);
  });
  return apiPromise;
}

/**
 * Passes the existing iframe element to one `YT.Player` with only the
 * documented ready/error events.
 */
export function createPlayer(
  namespace: YouTubeNamespace,
  iframe: HTMLIFrameElement,
  handlers: PlayerEventHandlers,
): YouTubePlayerInstance {
  return new namespace.Player(iframe, {
    events: {
      onReady: () => {
        handlers.onReady();
      },
      onError: () => {
        handlers.onError();
      },
    },
  });
}

/** The documented timeline seek: always `allowSeekAhead=true`. */
export function seekTo(player: YouTubePlayerInstance, seconds: number): void {
  player.seekTo(seconds, true);
}
