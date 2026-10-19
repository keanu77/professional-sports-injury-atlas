/** Build-only text renderer. Inputs are text facts, never image files or URLs. */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import type { OverlayOptions } from "sharp";

interface CardText {
  title: string;
  subtitle: string;
  category: string;
  label: string;
}

export function escapePangoText(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function renderTextCard(
  input: CardText,
  fontfile: string,
  fontFamily: string,
): Promise<Buffer> {
  for (const key of ["title", "subtitle", "category", "label"] as const) {
    if (typeof input[key] !== "string" || input[key].length > 500) {
      throw new Error("Invalid text-only share input");
    }
  }
  const textLayer = async (
    text: string,
    top: number,
    height: number,
    size: number,
    color: string,
  ): Promise<OverlayOptions> => ({
    input: await sharp({
      text: {
        text: `<span foreground="${color}">${escapePangoText(text)}</span>`,
        font: `${fontFamily} Bold ${size}`,
        fontfile,
        width: 1040,
        rgba: true,
        wrap: "word-char",
      },
    })
      .resize({ width: 1040, height, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer(),
    left: 80,
    top,
  });
  const rule = await sharp({
    create: {
      width: 1040,
      height: 3,
      channels: 4,
      background: "#89bed3",
    },
  })
    .png()
    .toBuffer();
  const overlays = await Promise.all([
    textLayer("運動傷害影片圖鑑", 46, 50, 35, "#c1dce8"),
    textLayer(input.label, 132, 38, 25, "#89bed3"),
    textLayer(input.title, 188, 154, 66, "#ffffff"),
    textLayer(input.subtitle, 365, 92, 36, "#e0eaf0"),
    textLayer(input.category, 494, 44, 27, "#c1dce8"),
    textLayer("影片觀察・公開回場紀錄", 569, 30, 20, "#89bed3"),
  ]);
  return sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: "#122a36",
    },
  })
    .composite([{ input: rule, left: 80, top: 108 }, ...overlays])
    .png()
    .toBuffer();
}

// A child process isolates fontconfig and its cache from Astro and the system.
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  const card = JSON.parse(Buffer.concat(chunks).toString("utf8")) as CardText;
  const fontfile = process.argv[2];
  if (fontfile === undefined) throw new Error("Missing local CJK font");
  const fontFamily = process.argv[3];
  if (fontFamily !== "Noto Serif TC" && fontFamily !== "Noto Serif CJK TC") {
    throw new Error("Unsupported local CJK font family");
  }
  process.stdout.write(await renderTextCard(card, fontfile, fontFamily));
}
