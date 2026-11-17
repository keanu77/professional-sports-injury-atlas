import {
  CONTRIBUTION_CONTENT_REQUIRED,
  publicContributionUrl,
} from "./contribution-content";

export type ContributionKind = "video" | "reference" | "correction";
export interface ContributionFields {
  type: ContributionKind;
  url: string;
  note: string;
  sources: string;
}
export type ContributionErrors = Partial<
  Record<"url" | "note" | "sources", string>
>;

/** Client guidance only; server validation and quota remain authoritative. */
export function contributionErrors(
  fields: ContributionFields,
): ContributionErrors {
  const errors: ContributionErrors = {};
  const sourceUrls = fields.sources.trim()
    ? fields.sources
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .map(publicContributionUrl)
    : [];
  if (fields.url.trim() && !publicContributionUrl(fields.url))
    errors.url = "請填寫有效的公開網址。";
  if (sourceUrls.length > 3 || sourceUrls.some((value) => !value))
    errors.sources = "參考來源請填寫有效的公開網址，每行一個，最多 3 個。";
  if (fields.type === "correction") {
    if (!fields.url.trim()) errors.url = "請提供需要修正的頁面網址。";
    if (fields.note.trim().length < 5)
      errors.note = "請提供至少 5 個字的修正說明。";
  } else if (
    fields.type === "reference" &&
    !fields.url.trim() &&
    !sourceUrls.length
  ) {
    errors.url = "請提供至少一個文獻連結，可使用 DOI、PubMed 或學會教材網址。";
  } else if (!fields.url.trim() && !fields.note.trim() && !sourceUrls.length) {
    errors.note = CONTRIBUTION_CONTENT_REQUIRED;
  }
  return errors;
}

export const CONTRIBUTION_DRAFT_KEY = "atlas-contribution-draft:v1";
export const CONTRIBUTION_DRAFT_TTL_MS = 30 * 60 * 1000;
export interface ContributionDraft extends ContributionFields {
  version: 1;
  scope: string;
  savedAt: number;
  deliveryUncertain: boolean;
}

/** Drafts contain only form content, never a challenge token or visitor identity. */
export function parseContributionDraft(
  raw: string | null,
  scope: string,
  now = Date.now(),
): ContributionDraft | null {
  if (!raw || raw.length > 30000) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (!value || Array.isArray(value) || typeof value !== "object")
      return null;
    const keys = [
      "version",
      "scope",
      "savedAt",
      "deliveryUncertain",
      "type",
      "url",
      "note",
      "sources",
    ];
    if (Object.keys(value).some((key) => !keys.includes(key))) return null;
    if (
      value.version !== 1 ||
      value.scope !== scope ||
      typeof value.savedAt !== "number" ||
      !Number.isFinite(value.savedAt) ||
      value.savedAt > now ||
      now - value.savedAt >= CONTRIBUTION_DRAFT_TTL_MS ||
      typeof value.deliveryUncertain !== "boolean" ||
      typeof value.type !== "string" ||
      !["video", "reference", "correction"].includes(value.type)
    )
      return null;
    for (const [field, limit] of [
      ["url", 2048],
      ["note", 2000],
      ["sources", 3000],
    ] as const) {
      if (
        typeof value[field] !== "string" ||
        value[field].length > limit ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value[field])
      )
        return null;
    }
    return value as unknown as ContributionDraft;
  } catch {
    return null;
  }
}
