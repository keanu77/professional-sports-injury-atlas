/** UI-only orientation registry for all eight governed YouTube facades. */

import { describe, expect, it } from "vitest";
import { resolveVideoOrientation } from "../../src/lib/video/facade";

describe("video facade orientation", () => {
  it.each([
    ["V9mtX4mE8wQ", "landscape"],
    ["YcSOLHMsJYw", "landscape"],
    ["FQAPZASQyX0", "portrait"],
    ["RDDGpqOvSdg", "portrait"],
    ["8TIJGIRP634", "landscape"],
    ["xSUKd03LJwE", "portrait"],
    ["zZdndTqOexc", "portrait"],
    ["azQpbyDBktk", "portrait"],
  ] as const)("maps governed YouTube video %s to %s", (videoId, expected) => {
    expect(
      resolveVideoOrientation(
        "youtube",
        `https://www.youtube.com/watch?v=${videoId}`,
      ),
    ).toBe(expected);
  });

  it("fails unknown and non-YouTube sources safely to landscape", () => {
    expect(
      resolveVideoOrientation(
        "youtube",
        "https://www.youtube.com/watch?v=fIcTiOnAl01",
      ),
    ).toBe("landscape");
    expect(
      resolveVideoOrientation(
        "nba",
        "https://www.nba.com/watch/video/fictional-demo-clip",
      ),
    ).toBe("landscape");
  });
});
