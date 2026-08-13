/**
 * Owner-approved Traditional Chinese medical notice for Decision 13.
 *
 * This is the only product-copy source for both the compact clinical notice
 * and the site-wide footer notice. Keep the sentence and its four required
 * visible clauses exact.
 */
export const CANONICAL_MEDICAL_NOTICE_ZH_HANT =
  "本站為教學用途的衛教內容，不構成醫療建議，也無法取代醫師診察。症狀持續或惡化請就醫。";

export const MEDICAL_NOTICE_MINIMUM_VISIBLE_CLAUSES = [
  "教學用途",
  "不構成醫療建議",
  "無法取代醫師診察",
  "症狀持續或惡化請就醫",
] as const;

export const CENTRAL_NOTICES_MEDICAL_HREF = "/credits-notices/#medical-notice";
