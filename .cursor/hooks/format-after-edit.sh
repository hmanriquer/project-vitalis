#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
input="$(cat)"

file_path=""
if command -v jq >/dev/null 2>&1; then
  file_path="$(echo "$input" | jq -r '.file_path // .path // .filePath // empty' | head -1)"
fi

if [[ -z "$file_path" ]]; then
  exit 0
fi

if [[ "$file_path" != /* ]]; then
  file_path="$ROOT/$file_path"
fi

case "$file_path" in
  "$ROOT"/.agents/skills/*) exit 0 ;;
  "$ROOT"/node_modules/*) exit 0 ;;
esac

if [[ ! -f "$file_path" ]]; then
  exit 0
fi

cd "$ROOT"
pnpm exec biome check --write "$file_path" >/dev/null 2>&1 || true
exit 0
