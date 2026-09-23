---
name: shipping-a-change
description: Preflight and pull-request discipline for Project Vitalis. Use before creating a PR, pushing, or claiming work is ready. Runs Biome check/lint and blocks PR creation via hooks if quality gates fail.
---

# Shipping a change

## Before a PR

From the repository root:

```bash
pnpm preflight
```

This runs, in order:

1. `pnpm check` — Biome format + safe fixes
2. `pnpm lint` — Biome CI (must pass)
3. `pnpm typecheck` — when TypeScript exists
4. `pnpm test` — when tests exist

Fix every failure before opening a PR. Cursor hooks block `gh pr create` and GitHub MCP `create_pull_request` until preflight passes.

## Git hook backstop

After clone, run once:

```bash
pnpm setup
```

That sets `core.hooksPath` to `.githooks/`. `pre-push` runs the same preflight.

## PR expectations

- Scope matches the task; no unrelated refactors.
- Behavior matches [ARCHITECTURE.md](../../../ARCHITECTURE.md) and the store design spec.
- Use `finishing-a-development-branch` when choosing merge vs PR cleanup.
- Use `requesting-code-review` when you want a structured review pass.

## If the hook blocks you

Read the preflight output, fix lint/format issues, re-run `pnpm preflight`, then retry the PR command. Do not bypass hooks with `--no-verify` unless a human explicitly asks.
