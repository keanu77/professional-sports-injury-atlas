import type { APIRoute } from "astro";

export const prerender = true;

const ICON_SIZES = [16, 32] as const;

type Rgba = readonly [red: number, green: number, blue: number, alpha: number];

function pixelColor(x: number, y: number, size: number): Rgba {
  const px = x + 0.5;
  const py = y + 0.5;
  const radius = size * 0.2;
  const nearestX = Math.min(Math.max(px, radius), size - radius);
  const nearestY = Math.min(Math.max(py, radius), size - radius);
  const insideBackground =
    (px - nearestX) ** 2 + (py - nearestY) ** 2 <= radius ** 2;

  if (!insideBackground) return [0, 0, 0, 0];

  const inFStem =
    px >= size * 0.31 &&
    px < size * 0.43 &&
    py >= size * 0.22 &&
    py < size * 0.76;
  const inFTop =
    px >= size * 0.31 &&
    px < size * 0.69 &&
    py >= size * 0.22 &&
    py < size * 0.34;
  const inFMiddle =
    px >= size * 0.31 &&
    px < size * 0.62 &&
    py >= size * 0.43 &&
    py < size * 0.55;
  if (inFStem || inFTop || inFMiddle) return [255, 255, 255, 255];

  const dotX = px - size * 0.7;
  const dotY = py - size * 0.72;
  if (dotX ** 2 + dotY ** 2 <= (size * 0.105) ** 2) {
    return [255, 157, 120, 255];
  }

  return [13, 102, 112, 255];
}

function createDib(size: number): Uint8Array {
  const pixelBytes = size * size * 4;
  const maskRowBytes = Math.ceil(size / 32) * 4;
  const maskBytes = maskRowBytes * size;
  const dib = new Uint8Array(40 + pixelBytes + maskBytes);
  const view = new DataView(dib.buffer);

  view.setUint32(0, 40, true);
  view.setInt32(4, size, true);
  view.setInt32(8, size * 2, true);
  view.setUint16(12, 1, true);
  view.setUint16(14, 32, true);
  view.setUint32(20, pixelBytes + maskBytes, true);

  for (let storedY = 0; storedY < size; storedY += 1) {
    const y = size - storedY - 1;
    for (let x = 0; x < size; x += 1) {
      const [red, green, blue, alpha] = pixelColor(x, y, size);
      const offset = 40 + (storedY * size + x) * 4;
      dib[offset] = blue;
      dib[offset + 1] = green;
      dib[offset + 2] = red;
      dib[offset + 3] = alpha;
    }
  }

  return dib;
}

function createIco(): Uint8Array {
  const images = ICON_SIZES.map(createDib);
  const directoryBytes = 6 + images.length * 16;
  const totalBytes =
    directoryBytes + images.reduce((sum, image) => sum + image.length, 0);
  const ico = new Uint8Array(totalBytes);
  const view = new DataView(ico.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);

  let imageOffset = directoryBytes;
  images.forEach((image, index) => {
    const directoryOffset = 6 + index * 16;
    const size = ICON_SIZES[index]!;
    ico[directoryOffset] = size;
    ico[directoryOffset + 1] = size;
    view.setUint16(directoryOffset + 4, 1, true);
    view.setUint16(directoryOffset + 6, 32, true);
    view.setUint32(directoryOffset + 8, image.length, true);
    view.setUint32(directoryOffset + 12, imageOffset, true);
    ico.set(image, imageOffset);
    imageOffset += image.length;
  });

  return ico;
}

const ICON_BYTES = createIco();

export const GET: APIRoute = () =>
  new Response(ICON_BYTES.buffer as ArrayBuffer, {
    headers: {
      "Cache-Control": "public, max-age=604800",
      "Content-Type": "image/x-icon",
    },
  });
