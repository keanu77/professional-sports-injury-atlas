import { describe, expect, it } from "vitest";
import { GET as getIco } from "../../src/pages/favicon.ico";
import { GET as getSvg } from "../../src/pages/favicon.svg";

function parseIcoEntry(bytes: Buffer, index: number) {
  const directoryOffset = 6 + index * 16;
  const imageOffset = bytes.readUInt32LE(directoryOffset + 12);
  return {
    width: bytes[directoryOffset] || 256,
    height: bytes[directoryOffset + 1] || 256,
    planes: bytes.readUInt16LE(directoryOffset + 4),
    bitCount: bytes.readUInt16LE(directoryOffset + 6),
    byteLength: bytes.readUInt32LE(directoryOffset + 8),
    imageOffset,
    dibWidth: bytes.readInt32LE(imageOffset + 4),
    dibHeight: bytes.readInt32LE(imageOffset + 8) / 2,
  };
}

describe("Decision 39 favicon routes", () => {
  it("serves an auditable multi-size 32-bit ICO directory", async () => {
    const response = await getIco({} as Parameters<typeof getIco>[0]);
    const bytes = Buffer.from(await response.arrayBuffer());

    expect(response.headers.get("Content-Type")).toBe("image/x-icon");
    expect(bytes.readUInt16LE(0)).toBe(0);
    expect(bytes.readUInt16LE(2)).toBe(1);
    expect(bytes.readUInt16LE(4)).toBe(2);

    const entries = [parseIcoEntry(bytes, 0), parseIcoEntry(bytes, 1)];
    expect(entries).toEqual([
      expect.objectContaining({
        width: 16,
        height: 16,
        planes: 1,
        bitCount: 32,
        dibWidth: 16,
        dibHeight: 16,
      }),
      expect.objectContaining({
        width: 32,
        height: 32,
        planes: 1,
        bitCount: 32,
        dibWidth: 32,
        dibHeight: 32,
      }),
    ]);
    for (const entry of entries) {
      expect(entry.byteLength).toBeGreaterThan(40);
      expect(entry.imageOffset + entry.byteLength).toBeLessThanOrEqual(
        bytes.length,
      );
    }
  });

  it("keeps the vector favicon available as SVG", async () => {
    const response = await getSvg({} as Parameters<typeof getSvg>[0]);
    expect(response.headers.get("Content-Type")).toBe(
      "image/svg+xml; charset=utf-8",
    );
    expect(await response.text()).toContain("<svg");
  });
});
