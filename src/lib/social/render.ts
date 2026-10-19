/** Runs the text renderer with a writable, disposable fontconfig environment. */
import { execFile } from "node:child_process";
import { access, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { DetailShareCard } from "./catalog";

const escapeXml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function renderDetailShareImage(
  card: DetailShareCard,
  projectRoot: string = process.cwd(),
): Promise<Buffer> {
  // Sharp's Linux font stack does not reliably load the browser WOFF2 subset.
  // Keep fontconfig isolated, but use Ubuntu's native CJK font on Linux.
  const fontfile =
    process.platform === "linux"
      ? "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
      : resolve(projectRoot, "public/fonts/noto-serif-tc-700.woff2");
  const fontFamily =
    process.platform === "linux" ? "Noto Serif CJK TC" : "Noto Serif TC";
  try {
    await access(fontfile);
  } catch {
    throw new Error(
      process.platform === "linux"
        ? "Share image rendering requires fonts-noto-cjk on Linux (Ubuntu: sudo apt-get install fonts-noto-cjk)."
        : "Share image rendering requires public/fonts/noto-serif-tc-700.woff2.",
    );
  }
  const workspace = await mkdtemp(join(tmpdir(), "atlas-text-share-"));
  try {
    const cache = join(workspace, "cache");
    await mkdir(cache);
    const fonts = dirname(fontfile);
    const config = join(workspace, "fonts.conf");
    await writeFile(
      config,
      `<?xml version="1.0"?><fontconfig><dir>${escapeXml(fonts)}</dir><cachedir>${escapeXml(cache)}</cachedir></fontconfig>`,
    );
    return await new Promise<Buffer>((resolveImage, reject) => {
      const child = execFile(
        process.execPath,
        [
          resolve(projectRoot, "src/lib/social/render-worker.ts"),
          fontfile,
          fontFamily,
        ],
        {
          env: {
            ...process.env,
            FONTCONFIG_FILE: config,
            FONTCONFIG_PATH: workspace,
            XDG_CACHE_HOME: cache,
          },
          encoding: "buffer",
          timeout: 30_000,
          maxBuffer: 4 * 1024 * 1024,
        },
        (error, stdout, stderr) => {
          if (error !== null) {
            reject(
              new Error(
                `Share text rendering failed: ${stderr.toString().slice(0, 1000)}`,
                { cause: error },
              ),
            );
          } else if (stderr.toString().includes("Fontconfig error")) {
            reject(new Error("Share text font configuration failed"));
          } else {
            resolveImage(stdout);
          }
        },
      );
      child.stdin?.end(
        JSON.stringify({
          title: card.title,
          subtitle: card.subtitle,
          category: card.category,
          label: card.label,
        }),
      );
    });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
