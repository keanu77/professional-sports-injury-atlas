import { createServer } from "node:net";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  checkReviewArtifactFileSizes,
  checkReviewArtifactScanStability,
  loadBuiltOutput,
  runReviewArtifactVerification,
  scanReviewArtifactFiles,
  type ReviewArtifactFileFact,
} from "../../scripts/verify-review-artifact";
import { PRIVATE_REVIEW_MAX_FILE_BYTES } from "../../src/lib/governance/private-review-limits";

const PROJECT_ROOT = resolve(import.meta.dirname, "../..");

const issueFor = (path: string, byteLength: number) => ({
  code: "review-artifact-file-size-limit",
  path: `dist/${path}`,
  message: `artifact file is oversized: observed ${byteLength} bytes; configured limit ${PRIVATE_REVIEW_MAX_FILE_BYTES} bytes`,
});

describe("Decision 16 review artifact per-file size guard", () => {
  it("accepts the exact 32 MiB boundary", () => {
    expect(
      checkReviewArtifactFileSizes([
        {
          path: "_astro/exact-boundary.bin",
          byteLength: PRIVATE_REVIEW_MAX_FILE_BYTES,
        },
      ]),
    ).toEqual([]);
  });

  it("rejects 32 MiB plus one byte with observed and configured sizes", () => {
    const byteLength = PRIVATE_REVIEW_MAX_FILE_BYTES + 1;
    expect(
      checkReviewArtifactFileSizes([
        { path: "_astro/one-byte-over.bin", byteLength },
      ]),
    ).toEqual([issueFor("_astro/one-byte-over.bin", byteLength)]);
  });

  it("reports every offender in stable repository-relative path order", () => {
    const files: ReviewArtifactFileFact[] = [
      {
        path: "fonts/z-last.woff2",
        byteLength: PRIVATE_REVIEW_MAX_FILE_BYTES + 7,
      },
      {
        path: "_astro/a-first.js",
        byteLength: PRIVATE_REVIEW_MAX_FILE_BYTES + 2,
      },
      { path: "index.html", byteLength: 4_096 },
    ];

    expect(checkReviewArtifactFileSizes(files)).toEqual([
      issueFor("_astro/a-first.js", PRIVATE_REVIEW_MAX_FILE_BYTES + 2),
      issueFor("fonts/z-last.woff2", PRIVATE_REVIEW_MAX_FILE_BYTES + 7),
    ]);
  });

  it("rejects a nested Trae-like JPEG without a filename exception", () => {
    const byteLength = PRIVATE_REVIEW_MAX_FILE_BYTES + 99;
    expect(
      checkReviewArtifactFileSizes([
        { path: "_astro/players/trae-young.fixture.jpg", byteLength },
      ]),
    ).toEqual([issueFor("_astro/players/trae-young.fixture.jpg", byteLength)]);
  });

  it("accepts ordinary HTML, font, JavaScript, and image files", () => {
    expect(
      checkReviewArtifactFileSizes([
        { path: "index.html", byteLength: 8_192 },
        { path: "fonts/review.woff2", byteLength: 384_000 },
        { path: "_astro/page.hash.js", byteLength: 172_000 },
        { path: "_astro/cover.hash.jpg", byteLength: 4_999_999 },
      ]),
    ).toEqual([]);
  });

  it("rejects a same-size regular-file replacement after the metadata scan", () => {
    const artifactRoot = mkdtempSync(
      join(tmpdir(), "atlas-review-artifact-race-"),
    );
    const replacementRoot = mkdtempSync(
      join(tmpdir(), "atlas-review-artifact-replacement-"),
    );
    try {
      const target = join(artifactRoot, "index.html");
      const replacement = join(replacementRoot, "index.html");
      writeFileSync(target, Buffer.alloc(64, 0x61));
      writeFileSync(replacement, Buffer.alloc(64, 0x62));

      const output = loadBuiltOutput(artifactRoot, {
        afterScan() {
          renameSync(replacement, target);
        },
      });

      expect(output.pages).toEqual([]);
      expect(output.artifactFileIssues).toContainEqual({
        code: "review-artifact-bounded-read",
        path: "dist/index.html",
        message:
          "artifact file could not be read as the same bounded regular file recorded by the metadata scan",
      });
      expect(
        checkReviewArtifactScanStability(
          output.artifactScan,
          scanReviewArtifactFiles(artifactRoot),
        ),
      ).toEqual([
        {
          code: "review-artifact-snapshot-changed",
          path: "dist",
          message:
            "artifact file or directory identities changed during verification",
        },
      ]);
    } finally {
      rmSync(artifactRoot, { recursive: true, force: true });
      rmSync(replacementRoot, { recursive: true, force: true });
    }
  });

  it("re-scans every file and reports a non-text asset that grows past the limit", () => {
    const artifactRoot = mkdtempSync(
      join(tmpdir(), "atlas-review-artifact-grow-"),
    );
    try {
      const asset = join(artifactRoot, "ordinary-font.woff2");
      writeFileSync(asset, "small");
      const io = { log: vi.fn(), error: vi.fn() };

      expect(
        runReviewArtifactVerification(PROJECT_ROOT, artifactRoot, io, {
          afterScan() {
            truncateSync(asset, PRIVATE_REVIEW_MAX_FILE_BYTES + 1);
          },
        }),
      ).toBe(1);
      expect(io.error).toHaveBeenCalledWith(
        `[review-artifact-file-size-limit] dist/ordinary-font.woff2: ${issueFor("ordinary-font.woff2", PRIVATE_REVIEW_MAX_FILE_BYTES + 1).message}`,
      );
      expect(io.error).toHaveBeenCalledWith(
        "[review-artifact-snapshot-changed] dist: artifact file or directory identities changed during verification",
      );
    } finally {
      rmSync(artifactRoot, { recursive: true, force: true });
    }
  });

  it("returns the standard CLI failure before any service request for a sparse temporary artifact tree", () => {
    const artifactRoot = mkdtempSync(
      join(tmpdir(), "atlas-review-artifact-size-"),
    );
    try {
      mkdirSync(join(artifactRoot, "_astro", "players"), {
        recursive: true,
      });
      writeFileSync(join(artifactRoot, "index.html"), "<!doctype html>");
      const oversizedPath = join(
        artifactRoot,
        "_astro",
        "players",
        "trae-young.synthetic.jpg",
      );
      writeFileSync(oversizedPath, "");
      truncateSync(oversizedPath, PRIVATE_REVIEW_MAX_FILE_BYTES + 1);
      const oversizedHtmlPath = join(artifactRoot, "oversized.html");
      writeFileSync(oversizedHtmlPath, "");
      truncateSync(oversizedHtmlPath, PRIVATE_REVIEW_MAX_FILE_BYTES + 3);
      const oversizedRedirectPath = join(artifactRoot, "_redirects");
      writeFileSync(oversizedRedirectPath, "");
      truncateSync(oversizedRedirectPath, PRIVATE_REVIEW_MAX_FILE_BYTES + 5);
      const oversizedRobotsPath = join(artifactRoot, "robots.txt");
      writeFileSync(oversizedRobotsPath, "");
      truncateSync(oversizedRobotsPath, PRIVATE_REVIEW_MAX_FILE_BYTES + 7);

      const output = loadBuiltOutput(artifactRoot);

      expect(output.pages).toHaveLength(1);
      expect(output.artifactFileIssues).toEqual([
        issueFor(
          "_astro/players/trae-young.synthetic.jpg",
          PRIVATE_REVIEW_MAX_FILE_BYTES + 1,
        ),
        issueFor("_redirects", PRIVATE_REVIEW_MAX_FILE_BYTES + 5),
        issueFor("oversized.html", PRIVATE_REVIEW_MAX_FILE_BYTES + 3),
        issueFor("robots.txt", PRIVATE_REVIEW_MAX_FILE_BYTES + 7),
      ]);

      const io = { log: vi.fn(), error: vi.fn() };
      expect(
        runReviewArtifactVerification(PROJECT_ROOT, artifactRoot, io),
      ).toBe(1);
      const verifierSource = readFileSync(
        join(PROJECT_ROOT, "scripts/verify-review-artifact.ts"),
        "utf8",
      );
      expect(verifierSource).not.toMatch(
        /from "node:(?:child_process|http|https|net|tls)"/u,
      );
      expect(verifierSource).not.toMatch(/\bfetch\s*\(/u);
      expect(
        io.error.mock.calls
          .map(([message]) => message)
          .filter((message) =>
            message.startsWith("[review-artifact-file-size-limit]"),
          ),
      ).toEqual([
        `[review-artifact-file-size-limit] dist/_astro/players/trae-young.synthetic.jpg: ${issueFor("_astro/players/trae-young.synthetic.jpg", PRIVATE_REVIEW_MAX_FILE_BYTES + 1).message}`,
        `[review-artifact-file-size-limit] dist/_redirects: ${issueFor("_redirects", PRIVATE_REVIEW_MAX_FILE_BYTES + 5).message}`,
        `[review-artifact-file-size-limit] dist/oversized.html: ${issueFor("oversized.html", PRIVATE_REVIEW_MAX_FILE_BYTES + 3).message}`,
        `[review-artifact-file-size-limit] dist/robots.txt: ${issueFor("robots.txt", PRIVATE_REVIEW_MAX_FILE_BYTES + 7).message}`,
      ]);
    } finally {
      rmSync(artifactRoot, { recursive: true, force: true });
    }
  });

  it("fails closed on symlink and non-regular socket entries", async () => {
    const artifactRoot = mkdtempSync(
      join(tmpdir(), "atlas-review-artifact-shape-"),
    );
    const targetPath = join(artifactRoot, "target.js");
    const symlinkPath = join(artifactRoot, "artifact-link.js");
    const robotsTarget = join(artifactRoot, "robots-target");
    const robotsPath = join(artifactRoot, "robots.txt");
    const socketPath = join(artifactRoot, "artifact.sock");
    const server = createServer();
    try {
      writeFileSync(targetPath, "fixture");
      mkdirSync(robotsTarget);
      symlinkSync(targetPath, symlinkPath);
      symlinkSync(robotsTarget, robotsPath);
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(socketPath, resolve);
      });

      expect(scanReviewArtifactFiles(artifactRoot).issues).toEqual([
        {
          code: "review-artifact-symlink",
          path: "dist/artifact-link.js",
          message: "artifact entries must not be symbolic links",
        },
        {
          code: "review-artifact-non-regular-file",
          path: "dist/artifact.sock",
          message: "artifact entries must be regular files or directories",
        },
        {
          code: "review-artifact-symlink",
          path: "dist/robots.txt",
          message: "artifact entries must not be symbolic links",
        },
      ]);

      const io = { log: vi.fn(), error: vi.fn() };
      expect(() =>
        runReviewArtifactVerification(PROJECT_ROOT, artifactRoot, io),
      ).not.toThrow();
      expect(io.error).toHaveBeenCalledWith(
        "[review-artifact-symlink] dist/robots.txt: artifact entries must not be symbolic links",
      );
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      rmSync(artifactRoot, { recursive: true, force: true });
    }
  });
});
