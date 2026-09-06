/**
 * Server-side video presentation resolver. It enforces the registry
 * provider/host/embed cross-rules, maps the three embed states and every
 * caption outcome to exactly one presentation, and gates the public in-site
 * player on available captions unless the confirmed expansion explicitly makes
 * captions optional (review mode keeps click-to-load with
 * a visible caption warning). It also owns the review-only component-lab
 * static params. This module may use Node-only contract imports; the browser
 * bundle never imports it.
 */

import type { CaptionStatus } from "../contracts/case";
import { issue, type ValidationIssue } from "../contracts/canonical";
import {
  defaultTaxonomyRegistries,
  findVideoProvider,
  type EmbedStatus,
  type TaxonomyRegistries,
} from "../contracts/taxonomy";
import type { BuildMode } from "../governance/build-mode";

export type VideoDisplayMode = BuildMode;

export type VideoPresentation =
  "click-to-load" | "external-link-only" | "unavailable-notice";

export interface VideoPresentationInput {
  providerCode: string;
  canonicalUrl: string;
  embedStatus: EmbedStatus;
  captionStatus: CaptionStatus;
  displayMode: VideoDisplayMode;
  captionsOptional?: boolean;
}

/** Registry cross-rules: provider exists, host allowed, embed status allowed. */
export function validateProviderEmbedState(
  input: VideoPresentationInput,
  registries: TaxonomyRegistries = defaultTaxonomyRegistries,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const path = `video.${input.providerCode}`;
  const provider = findVideoProvider(input.providerCode, registries);
  if (provider === undefined) {
    issues.push(
      issue(
        "video-provider-unknown",
        path,
        `unregistered video provider ${input.providerCode}`,
      ),
    );
    return issues;
  }

  let host: string | null = null;
  try {
    const url = new URL(input.canonicalUrl);
    if (url.protocol === "https:") {
      host = url.hostname;
    }
  } catch {
    host = null;
  }
  if (host === null) {
    issues.push(
      issue(
        "video-provider-url",
        path,
        "canonical video URL must be a valid HTTPS URL",
      ),
    );
  } else if (!provider.allowedHosts.includes(host)) {
    issues.push(
      issue(
        "video-provider-host",
        path,
        `host ${host} is not in the ${provider.code} allowlist`,
      ),
    );
  }

  if (!provider.allowedEmbedStatuses.includes(input.embedStatus)) {
    issues.push(
      issue(
        "video-provider-embed-status",
        path,
        `provider ${provider.code} does not allow embed status ${input.embedStatus}`,
      ),
    );
  }
  if (input.embedStatus === "verified" && !provider.canEmbed) {
    issues.push(
      issue(
        "video-provider-embed-status",
        path,
        `provider ${provider.code} has no embed capability`,
      ),
    );
  }

  return issues;
}

/**
 * Resolves the single presentation for a validated video record and fails
 * closed on any provider/host/embed cross-rule violation.
 */
export function resolvePlayerPresentation(
  input: VideoPresentationInput,
  registries: TaxonomyRegistries = defaultTaxonomyRegistries,
): VideoPresentation {
  const issues = validateProviderEmbedState(input, registries);
  if (issues.length > 0) {
    throw new Error(
      `invalid video provider state: ${issues
        .map((entry) => `${entry.code} (${entry.message})`)
        .join("; ")}`,
    );
  }
  if (input.embedStatus === "unavailable") return "unavailable-notice";
  if (input.embedStatus === "external-link-only") return "external-link-only";
  if (
    input.displayMode === "public" &&
    input.captionStatus !== "available" &&
    !input.captionsOptional
  ) {
    return "external-link-only";
  }
  return "click-to-load";
}

/**
 * Visible caption-state labels. Available captions point readers to the
 * original platform player control; no transcript is ever stored on-site.
 */
export function captionStatusLabel(status: CaptionStatus): string {
  switch (status) {
    case "available":
      return "字幕：原始平台提供（請在原平台播放器開啟字幕）";
    case "unavailable":
      return "字幕：原始影片未提供字幕";
    case "not-verified":
      return "字幕：尚未驗證";
  }
}

/** Formats whole seconds as `M:SS` or `H:MM:SS` for durations and timecodes. */
export function formatDurationLabel(totalSeconds: number): string {
  if (!Number.isInteger(totalSeconds) || totalSeconds < 0) {
    throw new Error(`invalid duration seconds ${String(totalSeconds)}`);
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const padded = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${padded}`;
  }
  return `${minutes}:${padded}`;
}

/**
 * The component lab exists only in review builds: exactly one static path in
 * review mode, zero paths in public mode, so it never enters the public route
 * manifest.
 */
export function componentLabStaticParams(
  mode: BuildMode,
): Array<{ lab: string }> {
  return mode === "review" ? [{ lab: "component-lab" }] : [];
}
