export const CONTRIBUTION_CONTENT_REQUIRED =
  "至少提供公開影片網址、補充說明或有效參考來源其中一項。";

export const publicContributionUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      !url.hostname.includes(".") ||
      url.hostname.endsWith(".local") ||
      url.hostname.endsWith(".localhost") ||
      /^[\d.]+$/.test(url.hostname)
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
};
