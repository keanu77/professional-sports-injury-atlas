import { afterEach, describe, expect, it, vi } from "vitest";
import { BODY_PARTS } from "../../src/lib/videos/body-parts";
import { SPORTS } from "../../src/lib/videos/sports";
import { SITUATIONS } from "../../src/lib/videos/discovery";
import { CONTENT_TYPES } from "../../src/lib/videos/content-types";
import {
  CATALOG_RETURN_KEY,
  CATALOG_RETURN_PATHS,
  readCatalogReturn,
  rememberCatalogReturn,
  validateCatalogReturn,
} from "../../src/lib/ui/catalog-return";

afterEach(() => vi.unstubAllGlobals());

describe("bounded catalog return context", () => {
  it("keeps its small client route allowlist in sync with catalog taxonomies", () => {
    expect(CATALOG_RETURN_PATHS).toEqual(
      new Set([
        "/",
        ...BODY_PARTS.map((part) => `/body-parts/${part.code}/`),
        ...SPORTS.map((sport) => `/sports/${sport.code}/`),
        ...SITUATIONS.map((situation) => `/situations/${situation.code}/`),
        ...CONTENT_TYPES.map((type) => `/video-types/${type.id}/`),
      ]),
    );
  });

  it("preserves filters but replaces anchors with the catalog heading", () => {
    expect(
      validateCatalogReturn("/sports/baseball/?q=Ohtani&view=popular#footer"),
    ).toBe("/sports/baseball/?q=Ohtani&view=popular#videos-heading");
    expect(validateCatalogReturn("/?q=%E8%86%9D")).toBe(
      "/?q=%E8%86%9D#videos-heading",
    );
  });

  it.each([
    "https://example.com/",
    "//example.com/",
    "/\\example.com/",
    "javascript:alert(1)",
    "/sports/unknown/",
    "/cases/some-case/",
    "/sports/baseball/../../",
    "/sports/%62aseball/",
    "/sports/baseball/%2f..",
    "/\n",
    null,
    { href: "/" },
    "/?q=" + "x".repeat(4096),
  ])("rejects unsafe or unknown stored URLs: %s", (value) => {
    expect(validateCatalogReturn(value)).toBeNull();
  });

  it("ties stored filters to their detail destination and tolerates blocked storage", () => {
    const data = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        setItem: (key: string, value: string) => data.set(key, value),
        getItem: (key: string) => data.get(key) ?? null,
      },
    });
    const detail = "/videos/ronald-acuna-miami-2021/";
    rememberCatalogReturn(
      new URL("https://injury.sportsmedicine.tw/?q=Acuna"),
      detail,
    );
    expect(readCatalogReturn(detail)).toBe("/?q=Acuna#videos-heading");
    expect(readCatalogReturn("/videos/another-video/")).toBeNull();
    data.set(
      CATALOG_RETURN_KEY,
      JSON.stringify({ detailPath: detail, href: "//example.com/" }),
    );
    expect(readCatalogReturn(detail)).toBeNull();
    data.set(CATALOG_RETURN_KEY, "invalid JSON");
    expect(readCatalogReturn(detail)).toBeNull();
    vi.stubGlobal("window", {
      get sessionStorage() {
        throw new Error("blocked");
      },
    });
    expect(() =>
      rememberCatalogReturn(
        new URL("https://injury.sportsmedicine.tw/"),
        detail,
      ),
    ).not.toThrow();
    expect(readCatalogReturn(detail)).toBeNull();
  });
});
