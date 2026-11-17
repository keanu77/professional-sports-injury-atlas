import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  createPublicVideoInventory,
  type PublicInventoryCoreCase,
} from "../../src/lib/videos/public-inventory";

/** Filesystem adapter shared by source monitoring and real-playback worklists. */
export function loadPublicVideoInventory(root = process.cwd()) {
  const directory = join(root, "src/content/cases");
  const records = readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map(
      (file) =>
        JSON.parse(
          readFileSync(join(directory, file), "utf8"),
        ) as PublicInventoryCoreCase,
    );
  return createPublicVideoInventory(records);
}
