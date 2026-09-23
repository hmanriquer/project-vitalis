---
name: vitalis-fullstack
description: Use when OpenCode or Codex ran out of quota and a human hands off the same card to another tool — continues backend or frontend work without replanning; not assigned by vitalis-planning.
---

# Vitalis fullstack

## Overview

You are the **fullstack** role. Execute the **single assigned card** in handoff — whether labeled `data/api`, `ui`, or spanning both. You **do not** block merely because the card crosses lanes. Combine rules from `vitalis-backend` and `vitalis-frontend` inline below. Handoff: [.agents/references/vitalis-handoff-protocol.md](../../references/vitalis-handoff-protocol.md).

**Do not start the next card** after updating handoff.

## When to use

- Human sets handoff `role: fullstack` after OpenCode or Codex hits quota mid-issue
- Same card and plan as before; pick up from handoff without splitting lanes again
- User explicitly invokes fullstack executor for VITALIS-\<N\>

**Not for planners:** cards stay `role: backend` or `role: frontend`. Use `vitalis-backend` or `vitalis-frontend` when quota is available.

## Read first

Same as backend: handoff → plan → `AGENTS.md` → handoff skills plus `vitalis-conventions`, `test-driven-development`, `DESIGN.md` when UI is in scope.

## Contract-first order (within one card)

When the card touches both sides:

1. Shared Zod in `src/shared` if the card lists it
2. Failing **worker** test → Hono/service implementation
3. Failing **web** test → screens/queries using frozen envelope
4. Run card verification command, then typecheck/preflight as specified

## Scope

Union of backend and frontend paths, still **≤5 files** on the card. Do not expand file list without blocking.

## Shared rules (abbreviated)

**Worker:** `AppError` envelope, ports for payments/mail/ids/clock, stock single-writer, centavos, no vendor calls in routes, no SQL in routes.

**Web:** DESIGN.md rules, Tabler, es-MX, TanStack Query + Form, ky api-client, no vendor imports in browser.

**Leak list:** Same as handoff protocol.

## Block only when

- Genuinely **>5 files** required (split via planner — `next_role: planner`)
- New dependency not in `package.json` and not approved in plan
- Unresolvable technical blocker with evidence
- Product behavior absent from plan and [store spec](../../../docs/superpowers/specs/2026-09-22-store-architecture-design.md)

**Do not block** only because the card says `lane:ui` or `lane:data/api` if the plan assigns you both sides in one card.

## TDD variants

Pick the failing test type the card implies:

- Worker integration: `pnpm vitest run src/worker/...`
- Web browser: `pnpm vitest run src/web/...`
- Guards: `*.guard.test.ts`

## When verification is green

1. Append **READY:impl** (`role: fullstack`).
2. Overwrite `.agents/tasks/handoff.md`.
3. **Stop.**
