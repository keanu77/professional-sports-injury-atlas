import assert from "node:assert/strict";
import { readFileSync, readdirSync, lstatSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "parse5";

// An intentionally narrow artifact contract. Extending this teaching demo needs
// an explicit review of the new assets/services, not a switch to public mode.
export function verifyDemo(directory) {
  assert.deepEqual(readdirSync(directory).sort(), [
    "_headers",
    "index.html",
    "robots.txt",
  ]);
  for (const name of readdirSync(directory)) {
    assert(
      lstatSync(join(directory, name)).isFile(),
      "Only regular demo files",
    );
  }
  const html = readFileSync(join(directory, "index.html"), "utf8");
  let noindex = false;
  function visit(node) {
    const attrs = Object.fromEntries(
      (node.attrs ?? []).map(({ name, value }) => [name, value]),
    );
    assert(
      ![
        "script",
        "iframe",
        "img",
        "video",
        "audio",
        "object",
        "embed",
        "form",
        "link",
        "a",
      ].includes(node.tagName),
      `Unexpected external-capable element: ${node.tagName}`,
    );
    for (const name of Object.keys(attrs)) {
      assert(!/^on/i.test(name), "No inline event handlers");
      assert(
        !["src", "srcset", "href", "action", "style"].includes(name),
        "No resource attributes",
      );
    }
    if (node.tagName === "meta" && attrs.name === "robots") {
      noindex = attrs.content === "noindex, nofollow";
    }
    assert(!("http-equiv" in attrs), "No meta redirects");
    if (node.tagName === "style") {
      const css = (node.childNodes ?? [])
        .map((child) => child.value ?? "")
        .join("");
      assert(!/url\s*\(|@import|\\/i.test(css), "No CSS resources");
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  }
  visit(parse(html));
  assert(noindex, "Demo must remain noindex");
  assert(html.includes("Fictional demo · No clinical approval"));
  assert.equal(
    readFileSync(join(directory, "robots.txt"), "utf8"),
    "User-agent: *\nDisallow: /\n",
  );
  const headers = readFileSync(join(directory, "_headers"), "utf8");
  assert(headers.includes("X-Robots-Tag: noindex, nofollow"));
  assert(headers.includes("default-src 'none'"));
  return { files: 3, externalResources: 0, clinicalApproval: false };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  console.log(
    JSON.stringify(
      verifyDemo(fileURLToPath(new URL("./dist/", import.meta.url))),
      null,
      2,
    ),
  );
}
