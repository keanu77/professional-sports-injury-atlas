/** Click-to-load playback with local covers, retryable errors and announced status. */

import {
  createPlayer,
  loadIframeApi,
  type YouTubePlayerInstance,
} from "../lib/video/youtube-api-adapter";
import { buildPrivacyEnhancedEmbedUrl } from "../lib/video/youtube";
import { createPlaybackTracker } from "../lib/video/playback-tracking";

type PlayerState = "idle" | "loading" | "ready" | "failed";

interface VideoController {
  state: PlayerState;
  player: YouTubePlayerInstance | null;
}

const READY_TIMEOUT_MS = 8000;

function awaitReady(
  controller: VideoController,
  namespace: Parameters<typeof createPlayer>[0],
  iframe: HTMLIFrameElement,
  onFailure: () => void,
  onPlaying: () => void,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("youtube-player-ready-timeout"));
    }, READY_TIMEOUT_MS);
    controller.player = createPlayer(namespace, iframe, {
      onPlaying,
      onReady: () => {
        window.clearTimeout(timer);
        resolve();
      },
      onError: () => {
        window.clearTimeout(timer);
        onFailure();
        reject(new Error("youtube-player-error"));
      },
    });
  });
}

function setupEmbed(root: HTMLElement): void {
  const scope = root.dataset.videoScope ?? "";
  const button = root.querySelector<HTMLButtonElement>("[data-video-load]");
  const stage = root.querySelector<HTMLElement>("[data-video-stage]");
  const facade = root.querySelector<HTMLElement>("[data-video-facade]");
  const failureNote = root.querySelector<HTMLElement>("[data-video-failure]");
  if (scope === "" || button === null || stage === null || facade === null)
    return;
  if (root.dataset.videoWired === "true") return;
  root.dataset.videoWired = "true";

  const status = root.querySelector<HTMLElement>("[data-video-status]");
  const controller: VideoController = { state: "idle", player: null };
  const trackPlayback = createPlaybackTracker(root.dataset.videoId ?? "");
  let activeIframe: HTMLIFrameElement | null = null;
  root.dataset.videoState = "idle";

  const fail = (iframe: HTMLIFrameElement): void => {
    if (activeIframe !== iframe) return;
    activeIframe = null;
    iframe.remove();
    controller.player = null;
    controller.state = "failed";
    root.dataset.videoState = "failed";
    facade.hidden = false;
    if (failureNote !== null) failureNote.hidden = false;
    if (status !== null)
      status.textContent =
        "播放器載入或播放失敗。可重新載入，或使用下方原始影片連結。";
    button.setAttribute("aria-label", "重新載入 YouTube 播放器");
    button.focus();
  };

  button.addEventListener("click", () => {
    if (controller.state === "loading" || controller.state === "ready") return;
    const videoId = root.dataset.videoId ?? "";
    let embedSrc: string;
    try {
      embedSrc = buildPrivacyEnhancedEmbedUrl(
        "youtube",
        videoId,
        window.location.origin,
      );
    } catch {
      return;
    }

    controller.state = "loading";
    root.dataset.videoState = "loading";
    if (status !== null) status.textContent = "正在載入 YouTube 播放器…";
    if (failureNote !== null) failureNote.hidden = true;

    const iframe = document.createElement("iframe");
    activeIframe = iframe;
    const start = Number(root.dataset.videoStart ?? 0);
    if (Number.isSafeInteger(start) && start > 0) {
      const url = new URL(embedSrc);
      url.searchParams.set("start", String(start));
      embedSrc = url.href;
    }
    iframe.src = embedSrc;
    iframe.title = root.dataset.videoTitle ?? "案例影片播放器";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allow = "encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.className = "case-video-frame";

    facade.hidden = true;
    stage.prepend(iframe);
    iframe.focus();

    loadIframeApi()
      .then((namespace) => {
        if (activeIframe !== iframe) return;
        return awaitReady(
          controller,
          namespace,
          iframe,
          () => fail(iframe),
          () => {
            if (activeIframe === iframe && controller.state !== "failed")
              trackPlayback();
          },
        );
      })
      .then(() => {
        if (activeIframe !== iframe) return;
        controller.state = "ready";
        root.dataset.videoState = "ready";
        if (status !== null) status.textContent = "播放器已載入，可開始播放。";
      })
      .catch(() => {
        fail(iframe);
      });
  });
  button.hidden = false;
}

/** Wires every click-to-load card on the page. Idempotent. */
export function initCaseVideos(root: Document = document): void {
  for (const embed of root.querySelectorAll<HTMLElement>(
    "[data-video-embed]",
  )) {
    setupEmbed(embed);
  }
}
