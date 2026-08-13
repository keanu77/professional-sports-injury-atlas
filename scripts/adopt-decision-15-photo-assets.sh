#!/bin/bash

# Adopt the fourteen Decision 15 frozen Commons originals. Five inputs are
# exact historical originals already tracked at src/assets/players/*.jpg; the
# other nine are downloaded from their frozen Commons original-file URLs.
# Every candidate is validated before an absent destination is populated.
# Existing destinations are never overwritten and must already match exactly.

set -euo pipefail

export PATH="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin:$PATH"

readonly EXPECTED_NODE="/Users/ethanai/.local/share/mise/installs/node/24.14.0/bin/node"
readonly EXPECTED_NODE_VERSION="v24.14.0"
readonly COMMONS_USER_AGENT="AtlasPrivateReview/1.0 (medical education private review; contact ethanai2596@gmail.com)"
readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
readonly REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
readonly TARGET_DIR="$REPO_ROOT/src/assets/players/decision-15"
DOWNLOADS_STARTED=0

fail() {
  printf 'decision15 asset adoption FAILED — %s\n' "$*" >&2
  exit 1
}

[[ "$(command -v node)" == "$EXPECTED_NODE" ]] ||
  fail "node does not resolve to the pinned mise binary"
[[ "$(node --version)" == "$EXPECTED_NODE_VERSION" ]] ||
  fail "Node runtime is not $EXPECTED_NODE_VERSION"

umask 022
mkdir -p "$TARGET_DIR"
[[ -d "$TARGET_DIR" && ! -L "$TARGET_DIR" ]] ||
  fail "Decision 15 target must be a real directory"

readonly TEMP_DIR="$(mktemp -d "$TARGET_DIR/.adopt-decision15.XXXXXX")"
cleanup() {
  local prior_status="$?"
  trap - EXIT
  case "$TEMP_DIR" in
    "$TARGET_DIR"/.adopt-decision15.*)
      if [[ -d "$TEMP_DIR" ]]; then
        /usr/bin/find "$TEMP_DIR" -depth -delete ||
          printf 'decision15 asset adoption cleanup warning: could not remove %s\n' "$TEMP_DIR" >&2
      fi
      ;;
    *)
      printf 'decision15 asset adoption cleanup warning: refused unsafe path %s\n' "$TEMP_DIR" >&2
      ;;
  esac
  exit "$prior_status"
}
trap cleanup EXIT
trap 'exit 130' HUP INT TERM

jpeg_property() {
  local property="$1"
  local path="$2"
  /usr/bin/sips -g "$property" "$path" 2>/dev/null |
    /usr/bin/sed -n "s/.*$property: //p"
}

validate_jpeg() {
  local slug="$1"
  local path="$2"
  local expected_sha1="$3"
  local expected_sha256="$4"
  local expected_bytes="$5"
  local expected_width="$6"
  local expected_height="$7"
  local expected_orientation="$8"

  [[ -f "$path" && ! -L "$path" ]] ||
    fail "$slug is not a regular non-symlink file: $path"

  local actual_mime
  local actual_magic_start
  local actual_magic_end
  local actual_sha1
  local actual_sha256
  local actual_bytes
  local actual_width
  local actual_height
  local actual_format
  local actual_orientation

  actual_mime="$(/usr/bin/file -b --mime-type "$path")"
  actual_magic_start="$(/usr/bin/xxd -p -l 2 "$path")"
  actual_magic_end="$(/usr/bin/tail -c 2 "$path" | /usr/bin/xxd -p)"
  actual_sha1="$(/usr/bin/shasum "$path" | /usr/bin/cut -d ' ' -f 1)"
  actual_sha256="$(/usr/bin/shasum -a 256 "$path" | /usr/bin/cut -d ' ' -f 1)"
  actual_bytes="$(/usr/bin/stat -f '%z' "$path")"
  actual_width="$(jpeg_property pixelWidth "$path")"
  actual_height="$(jpeg_property pixelHeight "$path")"
  actual_format="$(jpeg_property format "$path")"
  actual_orientation="$(jpeg_property orientation "$path")"

  [[ "$actual_mime" == "image/jpeg" ]] ||
    fail "$slug MIME drift: expected image/jpeg, got $actual_mime"
  [[ "$actual_magic_start" == "ffd8" && "$actual_magic_end" == "ffd9" ]] ||
    fail "$slug is not a complete JPEG byte stream"
  [[ "$actual_sha1" == "$expected_sha1" ]] ||
    fail "$slug SHA-1 drift: expected $expected_sha1, got $actual_sha1"
  [[ "$actual_sha256" == "$expected_sha256" ]] ||
    fail "$slug SHA-256 drift: expected $expected_sha256, got $actual_sha256"
  [[ "$actual_bytes" == "$expected_bytes" ]] ||
    fail "$slug byte-length drift: expected $expected_bytes, got $actual_bytes"
  [[ "$actual_width" == "$expected_width" ]] ||
    fail "$slug width drift: expected $expected_width, got $actual_width"
  [[ "$actual_height" == "$expected_height" ]] ||
    fail "$slug height drift: expected $expected_height, got $actual_height"
  [[ "$actual_format" == "jpeg" ]] ||
    fail "$slug decoded format drift: expected jpeg, got $actual_format"
  [[ "$actual_orientation" == "$expected_orientation" ]] ||
    fail "$slug orientation drift: expected $expected_orientation, got $actual_orientation"

  printf '%s\t%s\t%s\t%s\t%sx%s\t%s\n' \
    "$slug" \
    "$actual_sha1" \
    "$actual_sha256" \
    "$actual_bytes" \
    "$actual_width" \
    "$actual_height" \
    "$actual_orientation"
}

install_candidate() {
  local slug="$1"
  local candidate="$2"
  local expected_sha1="$3"
  local expected_sha256="$4"
  local expected_bytes="$5"
  local expected_width="$6"
  local expected_height="$7"
  local expected_orientation="$8"
  local destination="$TARGET_DIR/$slug.jpg"

  validate_jpeg \
    "$slug" \
    "$candidate" \
    "$expected_sha1" \
    "$expected_sha256" \
    "$expected_bytes" \
    "$expected_width" \
    "$expected_height" \
    "$expected_orientation"

  if [[ -e "$destination" || -L "$destination" ]]; then
    validate_jpeg \
      "$slug" \
      "$destination" \
      "$expected_sha1" \
      "$expected_sha256" \
      "$expected_bytes" \
      "$expected_width" \
      "$expected_height" \
      "$expected_orientation" >/dev/null
    /usr/bin/cmp -s "$candidate" "$destination" ||
      fail "$slug existing destination differs from the validated source"
    return
  fi

  /bin/chmod 0644 "$candidate"
  /bin/mv "$candidate" "$destination"
}

adopt_local() {
  local slug="$1"
  local source_relative="$2"
  local expected_sha1="$3"
  local expected_sha256="$4"
  local expected_bytes="$5"
  local expected_width="$6"
  local expected_height="$7"
  local expected_orientation="$8"
  local source="$REPO_ROOT/$source_relative"
  local candidate="$TEMP_DIR/$slug.jpg"
  local destination="$TARGET_DIR/$slug.jpg"

  [[ "$source_relative" == "src/assets/players/$slug.jpg" ]] ||
    fail "$slug historical source identity is not the exact expected path"
  [[ -f "$source" && ! -L "$source" ]] ||
    fail "$slug historical source is missing or is a symlink"

  validate_jpeg \
    "$slug" \
    "$source" \
    "$expected_sha1" \
    "$expected_sha256" \
    "$expected_bytes" \
    "$expected_width" \
    "$expected_height" \
    "$expected_orientation" >/dev/null

  if [[ -e "$destination" || -L "$destination" ]]; then
    validate_jpeg \
      "$slug" \
      "$destination" \
      "$expected_sha1" \
      "$expected_sha256" \
      "$expected_bytes" \
      "$expected_width" \
      "$expected_height" \
      "$expected_orientation"
    return
  fi

  /bin/cp "$source" "$candidate"
  install_candidate \
    "$slug" \
    "$candidate" \
    "$expected_sha1" \
    "$expected_sha256" \
    "$expected_bytes" \
    "$expected_width" \
    "$expected_height" \
    "$expected_orientation"
}

adopt_commons() {
  local slug="$1"
  local source_url="$2"
  local expected_basename="$3"
  local expected_sha1="$4"
  local expected_sha256="$5"
  local expected_bytes="$6"
  local expected_width="$7"
  local expected_height="$8"
  local expected_orientation="$9"
  local candidate="$TEMP_DIR/$slug.jpg"
  local partial="$TEMP_DIR/$slug.part"
  local curl_error="$TEMP_DIR/$slug.curl-error"
  local destination="$TARGET_DIR/$slug.jpg"
  local response
  local curl_status
  local http_code
  local effective_url
  local attempt=1
  local max_retries=5
  local retry_delay

  case "$source_url" in
    https://upload.wikimedia.org/wikipedia/commons/*) ;;
    *) fail "$slug source is not an exact HTTPS Commons original URL" ;;
  esac

  if [[ -e "$destination" || -L "$destination" ]]; then
    validate_jpeg \
      "$slug" \
      "$destination" \
      "$expected_sha1" \
      "$expected_sha256" \
      "$expected_bytes" \
      "$expected_width" \
      "$expected_height" \
      "$expected_orientation"
    return
  fi

  if (( DOWNLOADS_STARTED > 0 )); then
    /bin/sleep 5
  fi
  DOWNLOADS_STARTED=$((DOWNLOADS_STARTED + 1))

  while :; do
    : >"$curl_error"
    if response="$(
      /usr/bin/curl \
        --silent \
        --show-error \
        --user-agent "$COMMONS_USER_AGENT" \
        --location \
        --proto '=https' \
        --proto-redir '=https' \
        --connect-timeout 30 \
        --max-time 600 \
        --output "$partial" \
        --write-out $'%{http_code}\t%{url_effective}' \
        "$source_url" 2>"$curl_error"
    )"; then
      curl_status=0
    else
      curl_status=$?
    fi

    if (( curl_status != 0 )); then
      fail "$slug download failed safely (curl exit $curl_status)"
    fi

    [[ "$response" == *$'\t'* ]] ||
      fail "$slug download returned an unreadable HTTP status"
    http_code="${response%%$'\t'*}"
    effective_url="${response#*$'\t'}"

    if [[ "$http_code" == "200" ]]; then
      /bin/mv "$partial" "$candidate"
      break
    fi

    if [[ "$http_code" != "429" ]]; then
      fail "$slug download failed safely with HTTP $http_code"
    fi

    if (( attempt > max_retries )); then
      fail "$slug remained HTTP 429 after $max_retries retries"
    fi

    case "$attempt" in
      1) retry_delay=60 ;;
      2) retry_delay=120 ;;
      *) retry_delay=240 ;;
    esac
    printf '%s HTTP 429 — retry %s/%s after %ss\n' \
      "$slug" "$attempt" "$max_retries" "$retry_delay" >&2
    /bin/sleep "$retry_delay"
    attempt=$((attempt + 1))
  done

  [[ "$effective_url" == "$source_url" ]] ||
    fail "$slug redirected away from its frozen original URL: $effective_url"
  [[ "$(/usr/bin/basename "$effective_url")" == "$expected_basename" ]] ||
    fail "$slug URL basename/asset identity drifted"
  [[ "$effective_url" != *"/thumb/"* ]] ||
    fail "$slug resolved to a Commons thumbnail"

  install_candidate \
    "$slug" \
    "$candidate" \
    "$expected_sha1" \
    "$expected_sha256" \
    "$expected_bytes" \
    "$expected_width" \
    "$expected_height" \
    "$expected_orientation"
}

printf 'slug\tsha1\tsha256\tbytes\tdimensions\torientation\n'

adopt_local \
  "anfernee-simons" \
  "src/assets/players/anfernee-simons.jpg" \
  "ebad62aead18a3f41498c2760e7100303605e5c3" \
  "2c651d636a979b4e838c28817e56ce56917d7b216fc6e59603075654a067fd7e" \
  "1365032" "2563" "3070" "<nil>"

adopt_commons \
  "anthony-edwards" \
  "https://upload.wikimedia.org/wikipedia/commons/2/21/Anthony_Edwards_Argentina_v_Egypt_7_July_2026-069.jpg" \
  "Anthony_Edwards_Argentina_v_Egypt_7_July_2026-069.jpg" \
  "51b1d4498043862a969fad316724115ee834b918" \
  "bc9cabfae1125da0d4520397260c72909473e536b0e027aa447c78576ea82455" \
  "4531034" "3333" "5000" "<nil>"

adopt_commons \
  "brandon-clarke" \
  "https://upload.wikimedia.org/wikipedia/commons/5/58/Brandon_Clarke_%2851814063744%29_%28cropped%29.jpg" \
  "Brandon_Clarke_%2851814063744%29_%28cropped%29.jpg" \
  "c5c5429b5f70bae7a354622a7cdd32a253775556" \
  "b864f9073782b2556d93a593d44bd36498234a68f692fe6b5fcfb3bbffab1c3f" \
  "3872559" "1892" "3000" "<nil>"

adopt_commons \
  "danny-green" \
  "https://upload.wikimedia.org/wikipedia/commons/a/a6/Danny_Green_dance_Senior_Day.jpg" \
  "Danny_Green_dance_Senior_Day.jpg" \
  "d1286f2fa1a02eb229f5a095f364a450e6d2cb7b" \
  "c9752a7cd9604e24126076812b3ba67883ac694857a196c3f6c893ced735f112" \
  "74488" "640" "480" "<nil>"

adopt_commons \
  "dejounte-murray" \
  "https://upload.wikimedia.org/wikipedia/commons/7/79/Dejounte_Murray_Tours_the_METC_%285148235%29.jpg" \
  "Dejounte_Murray_Tours_the_METC_%285148235%29.jpg" \
  "1c0d39ee222223567aeb4e19a80bf8150210be19" \
  "01cd99a39fad8138a6eae8084b4c91f2e01cc82c8f677d1d71bd8afdb78da798" \
  "1583907" "2602" "1870" "<nil>"

adopt_commons \
  "ja-morant" \
  "https://upload.wikimedia.org/wikipedia/commons/7/71/Ja_Morant.jpg" \
  "Ja_Morant.jpg" \
  "2295ea14f7883f33de3fefc9a425052e194cb21c" \
  "29f451b2c9b61ed00ac3cbf5208b61438108faab6a626e749b82c0a622671b56" \
  "1842653" "4796" "3197" "<nil>"

adopt_local \
  "joe-ingles" \
  "src/assets/players/joe-ingles.jpg" \
  "ea5ad8bffa1b0fba6805d7725ae90c4688966864" \
  "9cf8ccdc7221deede6df154ecb1201534165c86f35a49a4330afa0e4f034b44a" \
  "1090689" "1453" "2334" "<nil>"

adopt_local \
  "lamelo-ball" \
  "src/assets/players/lamelo-ball.jpg" \
  "c46d8d44ae566670b012801f4874d81520e4e81c" \
  "611c8be59bbb4c671753ccc7a33ccf8de57c3d28d26f1bf8f58aab454541fc7f" \
  "7261079" "2415" "3242" "<nil>"

adopt_local \
  "markelle-fultz" \
  "src/assets/players/markelle-fultz.jpg" \
  "0d1c39b3e7a0f60dcac7afecef7c8eea19888bac" \
  "a159eaad7777cd6825ec2db2ac959dcdf526aa241d71c58d2c62a2ff78a3a73f" \
  "5387248" "2600" "3899" "<nil>"

adopt_local \
  "moritz-wagner" \
  "src/assets/players/moritz-wagner.jpg" \
  "707f1a01f2ea6a642f8fc97d49d7092de16c487d" \
  "bcfe61a1b69129db077900592b8113ef282a12a0558707ba92e38d5e6dc58373" \
  "494333" "1071" "1145" "<nil>"

adopt_commons \
  "ricky-rubio" \
  "https://upload.wikimedia.org/wikipedia/commons/1/1f/Ricky_Rubio_at_Lynx_game.jpg" \
  "Ricky_Rubio_at_Lynx_game.jpg" \
  "e9bd49908fe9e5945d0aa16f9dd2d816340a75fd" \
  "5e1245b16c4ba4e8d95100c40eeb360e6318a6716106bef1f62bf9667a101709" \
  "2144172" "3072" "4608" "<nil>"

adopt_commons \
  "thomas-bryant" \
  "https://upload.wikimedia.org/wikipedia/commons/5/54/20150329_MCDAAG_closed_practice_Thomas_Bryant_%281%29.JPG" \
  "20150329_MCDAAG_closed_practice_Thomas_Bryant_%281%29.JPG" \
  "d2f87cf6324edfc9039ccc1e6e4994577bacc7f7" \
  "b651bb59f1caa3dfe67ff81ab524610002b8c677f710206111d58b5d6c9d589b" \
  "1345351" "2612" "3919" "<nil>"

adopt_commons \
  "trae-young" \
  "https://upload.wikimedia.org/wikipedia/commons/4/42/Trae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg" \
  "Trae_Young_%282022_All-Star_Weekend%29_%28cropped%29.jpg" \
  "193bb8a75e73f878359d136f0769205a4a8693ba" \
  "b489695d343b4e072708b242d6cdbbe4a22df84133e0aef5397f4a3bad46b1b0" \
  "39619306" "6351" "5504" "<nil>"

adopt_commons \
  "tyrese-haliburton" \
  "https://upload.wikimedia.org/wikipedia/commons/1/16/1_tyrese_haliburton_2025_%28cropped_2%29.jpg" \
  "1_tyrese_haliburton_2025_%28cropped_2%29.jpg" \
  "45d283ff520c757dc5eeb4993aa24b3ca91a7b13" \
  "8a307fe26217d5c951d8647367207cb6c383a83ea96b1c6361e969ab1c914270" \
  "6113037" "2063" "3169" "<nil>"

shopt -s nullglob
target_files=("$TARGET_DIR"/*.jpg)
actual_count="${#target_files[@]}"
[[ "$actual_count" == "14" ]] ||
  fail "expected exactly 14 Decision 15 JPEGs, found $actual_count"

printf 'decision15 asset adoption OK — 14 exact originals under Node %s\n' \
  "$EXPECTED_NODE_VERSION"
