/**
 * Hard per-file ceiling shared by every private-review artifact boundary.
 *
 * Keep this equal to the live verifier's bounded response size. Files at the
 * boundary are accepted; files one byte larger fail closed before promotion.
 */
export const PRIVATE_REVIEW_MAX_FILE_BYTES = 32 * 1024 * 1024;
