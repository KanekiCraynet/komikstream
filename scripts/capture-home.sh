#!/usr/bin/env bash
set -euo pipefail

url="${1:-http://127.0.0.1:5173/}"
out="${2:-/tmp/komikstream-home.png}"
chrome="${CHROME_BIN:-}"

if [[ -z "$chrome" ]] && command -v google-chrome >/dev/null 2>&1; then
  chrome="$(command -v google-chrome)"
fi
if [[ -z "$chrome" && -x "$HOME/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome" ]]; then
  chrome="$HOME/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome"
fi
if [[ -z "$chrome" || ! -x "$chrome" ]]; then
  printf 'Chrome/Chromium not found. Set CHROME_BIN.\n' >&2
  exit 1
fi

"$chrome" \
  --headless=new \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
  --disable-features=NetworkService \
  --hide-scrollbars \
  --window-size=1440,1000 \
  --screenshot="$out" \
  "$url" >/dev/null

file "$out"
stat -c '%s bytes' "$out"
printf 'Screenshot: %s\n' "$out"
