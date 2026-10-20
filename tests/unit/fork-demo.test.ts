import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { verifyDemo } from "../../examples/fork-demo/verify.mjs";

const directories: string[] = [];
const html =
  '<!doctype html><html><head><meta name="robots" content="noindex, nofollow"></head><body><h1>Fictional demo · No clinical approval</h1></body></html>';
function artifact(markup = html) {
  const directory = mkdtempSync(join(tmpdir(), "atlas-demo-"));
  directories.push(directory);
  writeFileSync(join(directory, "index.html"), markup);
  writeFileSync(join(directory, "robots.txt"), "User-agent: *\nDisallow: /\n");
  writeFileSync(
    join(directory, "_headers"),
    "/*\n  X-Robots-Tag: noindex, nofollow\n  Content-Security-Policy: default-src 'none'\n",
  );
  return directory;
}
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true });
});
describe("isolated fork demo artifact", () => {
  it("accepts a minimal inert fictional catalog", () => {
    expect(verifyDemo(artifact())).toEqual({
      files: 3,
      externalResources: 0,
      clinicalApproval: false,
    });
  });
  it("rejects a copied upstream asset", () => {
    const directory = artifact();
    writeFileSync(join(directory, "athlete.jpg"), "unexpected asset");
    expect(() => verifyDemo(directory)).toThrow();
  });
  it.each([
    '<iframe src="https://example.com/video"></iframe>',
    '<script src="https://example.com/telemetry.js"></script>',
    "<style>body { background: url(https://example.com/photo.jpg); }</style>",
    "<div onclick=\"fetch('/api/play')\">Record</div>",
    '<template><img src="https://example.com/photo.jpg"></template>',
  ])("rejects active or externally loaded content: %s", (injected) => {
    expect(() =>
      verifyDemo(artifact(html.replace("</body>", `${injected}</body>`))),
    ).toThrow();
  });
  it("rejects an indexable demo", () => {
    expect(() =>
      verifyDemo(artifact(html.replace("noindex, nofollow", "index, follow"))),
    ).toThrow();
  });
});
