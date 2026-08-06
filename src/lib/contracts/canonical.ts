/**
 * Shared canonical-JSON, hashing, and validation-issue primitives for the
 * content contracts. `src/lib` never imports from `scripts/**`; this module
 * intentionally re-implements the canonical serializer so the library stays
 * self-contained.
 */

import { createHash } from "node:crypto";

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
}

export const issue = (
  code: string,
  path: string,
  message: string,
): ValidationIssue => ({ code, path, message });

export class CanonicalJsonError extends Error {}

export const SHA256_RE = /^[0-9a-f]{64}$/;
export const UTC_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function sha256Hex(input: string | Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

export function compareCodePoints(a: string, b: string): number {
  const aPoints = [...a];
  const bPoints = [...b];
  const length = Math.min(aPoints.length, bPoints.length);
  for (let i = 0; i < length; i += 1) {
    const diff =
      (aPoints[i] as string).codePointAt(0)! -
      (bPoints[i] as string).codePointAt(0)!;
    if (diff !== 0) return diff;
  }
  return aPoints.length - bPoints.length;
}

function serializeCanonical(value: unknown, seen: WeakSet<object>): string {
  if (value === null) return "null";
  const kind = typeof value;
  if (kind === "string") {
    return JSON.stringify((value as string).normalize("NFC"));
  }
  if (kind === "boolean") return value ? "true" : "false";
  if (kind === "number") {
    if (!Number.isFinite(value)) {
      throw new CanonicalJsonError(
        "canonical JSON supports finite numbers only",
      );
    }
    return JSON.stringify(value);
  }
  if (kind === "undefined" || kind === "function" || kind === "symbol") {
    throw new CanonicalJsonError(`canonical JSON cannot serialize a ${kind}`);
  }
  if (kind === "bigint") {
    throw new CanonicalJsonError("canonical JSON cannot serialize a bigint");
  }
  if (value instanceof Date || value instanceof Map || value instanceof Set) {
    throw new CanonicalJsonError(
      "canonical JSON rejects Date, Map, and Set values",
    );
  }
  const objectValue = value as object;
  if (seen.has(objectValue)) {
    throw new CanonicalJsonError("canonical JSON rejects cyclic structures");
  }
  seen.add(objectValue);
  try {
    if (Array.isArray(value)) {
      return `[${value.map((item) => serializeCanonical(item, seen)).join(",")}]`;
    }
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).map((key) => key.normalize("NFC"));
    if (new Set(keys).size !== keys.length) {
      throw new CanonicalJsonError(
        "canonical JSON object has NFC-colliding keys",
      );
    }
    keys.sort(compareCodePoints);
    const members = keys.map(
      (key) =>
        `${JSON.stringify(key)}:${serializeCanonical(record[key], seen)}`,
    );
    return `{${members.join(",")}}`;
  } finally {
    seen.delete(objectValue);
  }
}

/**
 * One canonicalization algorithm: NFC strings, array order preserved, object
 * keys sorted by Unicode code point, no insignificant whitespace. Rejects
 * undefined, functions, symbols, non-finite numbers, Dates, Maps, Sets, and
 * cyclic structures.
 */
export function canonicalJson(value: unknown): string {
  return serializeCanonical(value, new WeakSet());
}

/** Strict JSON parser that rejects duplicate object keys and trailing content. */
export function parseStrictJson(text: string): unknown {
  let index = 0;

  const error = (message: string): never => {
    throw new CanonicalJsonError(
      `strict JSON parse error at offset ${index}: ${message}`,
    );
  };

  const skipWhitespace = (): void => {
    while (index < text.length) {
      const ch = text[index];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") index += 1;
      else break;
    }
  };

  const parseLiteral = <T>(literal: string, value: T): T => {
    if (text.startsWith(literal, index)) {
      index += literal.length;
      return value;
    }
    return error(`invalid literal, expected ${literal}`);
  };

  const parseNumber = (): number => {
    const numberRe = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
    numberRe.lastIndex = index;
    const match = numberRe.exec(text);
    if (!match || match[0].length === 0) return error("invalid number");
    index += match[0].length;
    return Number(match[0]);
  };

  const parseString = (): string => {
    if (text[index] !== '"') return error("expected string");
    index += 1;
    let result = "";
    for (;;) {
      if (index >= text.length) return error("unterminated string");
      const ch = text[index] as string;
      const code = ch.charCodeAt(0);
      if (ch === '"') {
        index += 1;
        return result;
      }
      if (ch === "\\") {
        index += 1;
        const escape = text[index];
        if (escape === undefined) return error("unterminated escape");
        index += 1;
        switch (escape) {
          case '"':
            result += '"';
            break;
          case "\\":
            result += "\\";
            break;
          case "/":
            result += "/";
            break;
          case "b":
            result += "\b";
            break;
          case "f":
            result += "\f";
            break;
          case "n":
            result += "\n";
            break;
          case "r":
            result += "\r";
            break;
          case "t":
            result += "\t";
            break;
          case "u": {
            const hexDigits = text.slice(index, index + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hexDigits)) {
              return error("invalid unicode escape");
            }
            index += 4;
            result += String.fromCharCode(Number.parseInt(hexDigits, 16));
            break;
          }
          default:
            return error(`invalid escape \\${escape}`);
        }
        continue;
      }
      if (code < 0x20) return error("unescaped control character in string");
      result += ch;
      index += 1;
    }
  };

  const parseArray = (): unknown[] => {
    index += 1;
    const result: unknown[] = [];
    skipWhitespace();
    if (text[index] === "]") {
      index += 1;
      return result;
    }
    for (;;) {
      result.push(parseValue());
      skipWhitespace();
      if (text[index] === ",") {
        index += 1;
        continue;
      }
      if (text[index] === "]") {
        index += 1;
        return result;
      }
      return error('expected "," or "]" in array');
    }
  };

  const parseObject = (): Record<string, unknown> => {
    index += 1;
    const result: Record<string, unknown> = {};
    const seenKeys = new Set<string>();
    skipWhitespace();
    if (text[index] === "}") {
      index += 1;
      return result;
    }
    for (;;) {
      skipWhitespace();
      const key = parseString();
      if (seenKeys.has(key)) {
        return error(`duplicate object key ${JSON.stringify(key)}`);
      }
      seenKeys.add(key);
      skipWhitespace();
      if (text[index] !== ":") return error('expected ":" after object key');
      index += 1;
      result[key] = parseValue();
      skipWhitespace();
      if (text[index] === ",") {
        index += 1;
        continue;
      }
      if (text[index] === "}") {
        index += 1;
        return result;
      }
      return error('expected "," or "}" in object');
    }
  };

  const parseValue = (): unknown => {
    skipWhitespace();
    const ch = text[index];
    if (ch === undefined) return error("unexpected end of input");
    if (ch === "{") return parseObject();
    if (ch === "[") return parseArray();
    if (ch === '"') return parseString();
    if (ch === "t") return parseLiteral("true", true);
    if (ch === "f") return parseLiteral("false", false);
    if (ch === "n") return parseLiteral("null", null);
    if (ch === "-" || (ch >= "0" && ch <= "9")) return parseNumber();
    return error(`unexpected character ${JSON.stringify(ch)}`);
  };

  const value = parseValue();
  skipWhitespace();
  if (index !== text.length) error("trailing content after JSON value");
  return value;
}

export function isValidUtcTimestamp(value: string): boolean {
  if (!UTC_TIMESTAMP_RE.test(value)) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString() === value.replace("Z", ".000Z");
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === value;
}
