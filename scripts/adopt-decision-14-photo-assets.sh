#!/usr/bin/env bash
set -euo pipefail

target_dir="src/assets/players/decision-14"
mkdir -p "$target_dir"

curl_resolve_args=()
if [[ -n "${ATLAS_WIKIMEDIA_UPLOAD_IP:-}" ]]; then
  curl_resolve_args=(
    --resolve "upload.wikimedia.org:443:${ATLAS_WIKIMEDIA_UPLOAD_IP}"
  )
fi

verify_jpeg_metadata() {
  local path="$1"
  local expected_width="$2"
  local expected_height="$3"
  local expected_orientation="$4"

  node - "$path" "$expected_width" "$expected_height" "$expected_orientation" <<'NODE'
const sharp = require("sharp");

const [path, expectedWidthText, expectedHeightText, expectedOrientationText] =
  process.argv.slice(2);
const expectedWidth = Number(expectedWidthText);
const expectedHeight = Number(expectedHeightText);
const expectedOrientation = Number(expectedOrientationText);

sharp(path, { failOn: "error" })
  .metadata()
  .then((metadata) => {
    const actual = {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      orientation: metadata.orientation ?? 1,
    };
    const expected = {
      format: "jpeg",
      width: expectedWidth,
      height: expectedHeight,
      orientation: expectedOrientation,
    };

    if (
      actual.format !== expected.format ||
      actual.width !== expected.width ||
      actual.height !== expected.height ||
      actual.orientation !== expected.orientation
    ) {
      throw new Error(
        `JPEG metadata mismatch for ${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
      );
    }
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
NODE
}

download() {
  local url="$1"
  local path="$2"
  local expected_sha256="$3"
  local expected_bytes="$4"
  local expected_width="$5"
  local expected_height="$6"
  local expected_orientation="$7"
  local temp_path
  local actual_sha256
  local actual_bytes

  temp_path="$(mktemp "${path}.download.XXXXXX")"

  if ! curl \
    --fail \
    --location \
    --silent \
    --show-error \
    --retry 3 \
    --retry-all-errors \
    --proto '=https' \
    --proto-redir '=https' \
    "${curl_resolve_args[@]}" \
    --output "$temp_path" \
    "$url"; then
    rm -f "$temp_path"
    return 1
  fi

  actual_sha256="$(shasum -a 256 "$temp_path" | awk '{print $1}')"
  if [[ "$actual_sha256" != "$expected_sha256" ]]; then
    echo "SHA-256 mismatch for $path: expected $expected_sha256, got $actual_sha256" >&2
    rm -f "$temp_path"
    return 1
  fi

  actual_bytes="$(wc -c < "$temp_path" | tr -d '[:space:]')"
  if [[ "$actual_bytes" != "$expected_bytes" ]]; then
    echo "Byte-length mismatch for $path: expected $expected_bytes, got $actual_bytes" >&2
    rm -f "$temp_path"
    return 1
  fi

  if ! verify_jpeg_metadata \
    "$temp_path" \
    "$expected_width" \
    "$expected_height" \
    "$expected_orientation"; then
    rm -f "$temp_path"
    return 1
  fi

  mv "$temp_path" "$path"
  echo "Verified and adopted $path"
}

download \
  "https://upload.wikimedia.org/wikipedia/commons/c/c3/20140814_World_Basketball_Festival_Damian_Lillard_and_Kyle_Korver.JPG" \
  "$target_dir/damian-lillard.jpg" \
  "ba8a0f23d721519e4796c89513f21a9e3c1d4fafe39f84a0192244162bb3abcf" \
  "5414375" \
  "5184" \
  "3456" \
  "8"

download \
  "https://upload.wikimedia.org/wikipedia/commons/5/58/2018_NBA_All-Star_Weekend_-_Jayson_Tatum.jpg" \
  "$target_dir/jayson-tatum.jpg" \
  "0adddc2e2918f307434e18e79c96ed7bf2e852122bea0adc0c38203584d7cb78" \
  "447666" \
  "2188" \
  "1680" \
  "1"

echo "Decision 14 accepted photo originals verified and adopted: 2/2"
