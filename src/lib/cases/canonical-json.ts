/**
 * Canonicalization entry point for case digests. There is exactly one
 * canonicalization algorithm in the codebase; it lives with the shared
 * contract primitives and is re-exported here as the digest-facing surface.
 */

export {
  canonicalJson,
  CanonicalJsonError,
  compareCodePoints,
  parseStrictJson,
  sha256Hex,
} from "../contracts/canonical";
