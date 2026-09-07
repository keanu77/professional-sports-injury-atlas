import { expect, it } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import {
  isApprovedSiteShareScreenshot,
  SITE_SHARE_SCREENSHOT_PATH,
} from "../../scripts/verify-brand-assets";
it("accepts only the exact user-approved screenshot bytes", () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-share-"));
  try {
    expect(isApprovedSiteShareScreenshot(root)).toBe(false);
    const destination = join(root, SITE_SHARE_SCREENSHOT_PATH);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(SITE_SHARE_SCREENSHOT_PATH, destination);
    expect(isApprovedSiteShareScreenshot(root)).toBe(true);
    writeFileSync(destination, "unreviewed replacement");
    expect(isApprovedSiteShareScreenshot(root)).toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
