/**
 * Progressive click-to-load enhancement for case videos. Before any click the
 * page contains no YouTube iframe, request, thumbnail, preconnect, autoplay,
 * or tracker: only the governed inline SVG facade, a normal canonical source
 * anchor, and real timestamp anchors that work without JavaScript. The first
 * click (and only then) hides that local facade, builds the validated
 * `youtube-nocookie.com` embed URL with the runtime page origin, inserts
 * exactly one iframe (accessible title,
 * `loading='lazy'`, `referrerpolicy='strict-origin-when-cross-origin'`, allow
 * list without autoplay), loads the official IFrame API, and hands that same
 * iframe to one `YT.Player`. Timeline anchors are intercepted only while the
 * player is ready and call the typed adapter's `seekTo()`; on API load or
 * readiness failure the iframe is removed, the SVG facade is restored, focus
 * returns to the load button, and the browser follows the original timestamp
 * URLs.
 */

import {
  createPlayer,
  loadIframeApi,
  seekTo,
  type YouTubePlayerInstance,
} from "../lib/video/youtube-api-adapter";
import { buildPrivacyEnhancedEmbedUrl } from "../lib/video/youtube";

type PlayerState = "idle" | "loading" | "ready" | "failed";

interface VideoController {
  state: PlayerState;
  player: YouTubePlayerInstance | null;
}

const READY_TIMEOUT_MS = 8000;

/**
 * Shared across every `initCaseVideos()` caller on the page (Vite gives all
 * component entry scripts the same module instance), so a card and its
 * timeline always resolve the same controller and wiring stays idempotent.
 */
const controllersByScope = new Map<string, VideoController>();

function awaitReady(
  controller: VideoController,
  namespace: Parameters<typeof createPlayer>[0],
  iframe: HTMLIFrameElement,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("youtube-player-ready-timeout"));
    }, READY_TIMEOUT_MS);
    controller.player = createPlayer(namespace, iframe, {
      onReady: () => {
        window.clearTimeout(timer);
        resolve();
      },
      onError: () => {
        window.clearTimeout(timer);
        reject(new Error("youtube-player-error"));
      },
    });
  });
}

function setupEmbed(
  root: HTMLElement,
  controllers: Map<string, VideoController>,
): void {
  const scope = root.dataset.videoScope ?? "";
  const button = root.querySelector<HTMLButtonElement>("[data-video-load]");
  const stage = root.querySelector<HTMLElement>("[data-video-stage]");
  const facade = root.querySelector<HTMLElement>("[data-video-facade]");
  const failureNote = root.querySelector<HTMLElement>("[data-video-failure]");
  if (scope === "" || button === null || stage === null || facade === null)
    return;
  if (root.dataset.videoWired === "true") return;
  root.dataset.videoWired = "true";

  const controller: VideoController = { state: "idle", player: null };
  controllers.set(scope, controller);
  root.dataset.videoState = "idle";

  const fail = (iframe: HTMLIFrameElement): void => {
    iframe.remove();
    controller.player = null;
    controller.state = "failed";
    root.dataset.videoState = "failed";
    facade.hidden = false;
    if (failureNote !== null) failureNote.hidden = false;
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
    if (failureNote !== null) failureNote.hidden = true;

    const iframe = document.createElement("iframe");
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
      .then((namespace) => awaitReady(controller, namespace, iframe))
      .then(() => {
        controller.state = "ready";
        root.dataset.videoState = "ready";
      })
      .catch(() => {
        fail(iframe);
      });
  });
}

function setupTimeline(
  timeline: HTMLElement,
  controllers: Map<string, VideoController>,
): void {
  const scope = timeline.dataset.videoScope ?? "";
  if (scope === "") return;
  if (timeline.dataset.videoWired === "true") return;
  timeline.dataset.videoWired = "true";
  timeline.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest<HTMLAnchorElement>("a[data-timecode]");
    if (anchor === null || !timeline.contains(anchor)) return;
    const controller = controllers.get(scope);
    // Without a ready player the anchor stays a real source link and the
    // browser follows the original timestamp URL.
    if (
      controller === undefined ||
      controller.state !== "ready" ||
      controller.player === null
    ) {
      return;
    }
    const seconds = Number.parseInt(anchor.dataset.timecode ?? "", 10);
    if (!Number.isInteger(seconds) || seconds < 0) return;
    event.preventDefault();
    seekTo(controller.player, seconds);
  });
}

/** Wires every click-to-load card and timeline on the page. Idempotent. */
export function initCaseVideos(root: Document = document): void {
  for (const embed of root.querySelectorAll<HTMLElement>(
    "[data-video-embed]",
  )) {
    setupEmbed(embed, controllersByScope);
  }
  for (const timeline of root.querySelectorAll<HTMLElement>(
    "[data-video-timeline]",
  )) {
    setupTimeline(timeline, controllersByScope);
  }
}
