#!/usr/bin/env bash
set -euo pipefail

target_dir="src/assets/players/decision-13"
mkdir -p "$target_dir"

download() {
  local url="$1"
  local path="$2"
  local expected_sha256="$3"
  local temp_path

  temp_path="$(mktemp "${path}.download.XXXXXX")"
  if curl --fail --location --silent --show-error --retry 3 --output "$temp_path" "$url" &&
    printf '%s  %s\n' "$expected_sha256" "$temp_path" | shasum -a 256 --check --status; then
    mv "$temp_path" "$path"
  else
    rm -f "$temp_path"
    return 1
  fi
}

download \
  "https://upload.wikimedia.org/wikipedia/commons/7/73/2025_C.J._McCollum_%28cropped%29.jpg" \
  "$target_dir/cj-mccollum.jpg" \
  "5688298371c4ec218dae6f5131685f4ab511fab6d0797685146953235c8c7e45"

download \
  "https://upload.wikimedia.org/wikipedia/commons/2/23/Kevin_Durant_and_Frances_Tiafoe_%282023_DC_Open%29_01_%28cropped%29.jpg" \
  "$target_dir/kevin-durant.jpg" \
  "6f18766d49193c6858d607ae26551ba6c4422eebefb535ca2805ccd8b54e956d"

download \
  "https://upload.wikimedia.org/wikipedia/commons/6/6b/Kyrie_Irving_during_the_2016_NBA_Champions_victory_parade.jpg" \
  "$target_dir/kyrie-irving.jpg" \
  "4f631559835221f8276ef7b1ee09b4435a5003ad9a50614bb0c72673dec745b6"

download \
  "https://upload.wikimedia.org/wikipedia/commons/8/80/Lebron_James_NYC_2010_Shankbone.jpg" \
  "$target_dir/lebron-james.jpg" \
  "8f5550b3acc78302a465a84b9e78f62d466e484fbfec1e3c1054e9123457680c"

download \
  "https://upload.wikimedia.org/wikipedia/commons/8/8b/2023-08-09_Deutschland_gegen_Kanada_%28Basketball-L%C3%A4nderspiel%29_by_Sandro_Halank%E2%80%93021.jpg" \
  "$target_dir/dwight-powell.jpg" \
  "d1cab51c99f25b380d05d14bd5fe4f826b51042d4c007a7d105a7240265cd211"

echo "Decision 13 accepted photo originals verified and adopted: 5/5"
