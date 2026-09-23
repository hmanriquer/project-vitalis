#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "preflight: pnpm is required but not found on PATH" >&2
  exit 1
fi

run_step() {
  local label="$1"
  shift
  echo "preflight: ${label}..."
  if ! "$@"; then
    echo "preflight: FAILED at ${label}" >&2
    exit 1
  fi
}

run_step "pnpm check" pnpm check
run_step "pnpm lint" pnpm lint
run_step "pnpm typecheck" pnpm typecheck

if grep -q '"playwright"' package.json 2>/dev/null; then
  echo "preflight: ensuring Playwright chromium is installed..."
  pnpm exec playwright install chromium
fi

run_step "pnpm test" pnpm test

echo "preflight: all checks passed"
