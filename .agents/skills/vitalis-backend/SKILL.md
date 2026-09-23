---
name: vitalis-backend
description: Use when executing a VITALIS data/api task card as the backend role — Hono routes, Drizzle D1, migrations, worker tests, shared Zod, and stock/catalog/order boundaries.
---

# Vitalis backend

## Overview

You are the **backend** role for Project Vitalis. Implement only the assigned **data/api** card from the plan. Handoff mechanics: [.agents/references/vitalis-handoff-protocol.md](../../references/vitalis-handoff-protocol.md).

**Do not start the next card** after updating handoff.

## When to use

- Handoff `role: backend` or card **Lane:** `data/api`
- User says to run the backend executor for VITALIS-\<N\>

**When NOT to use:** `ui` lane only (use `vitalis-frontend`), full card spanning API + UI (use `vitalis-fullstack`), audit (use `vitalis-audit`).

## Read first

1. `.agents/tasks/handoff.md`
2. Plan path from handoff
3. `AGENTS.md`
4. Skills from handoff; always include `vitalis-conventions`, `test-driven-development`
5. For schema/migrations: `cloudflare`, `wrangler`
6. For auth/mail/payments touchpoints: repo skills under `.agents/skills/` as listed in handoff

## Scope (files you may touch)

- `src/worker/**`
- `src/shared/**` (Zod contracts both sides import)
- `migrations/**`, `drizzle.config.ts`, `wrangler.jsonc` when the card requires

**Do not edit** `src/web/**`.

## TDD

1. Write a **failing** test in the **worker** project (`pnpm vitest run <path>`) or a `*.guard.test.ts` in **guards**.
2. Use `@cloudflare/vitest-pool-workers` / local D1 per existing tests (e.g. `src/worker/db/client.test.ts`).
3. Implement until the card’s verification command is green.

## Implementation rules

- **Errors:** Throw `AppError` only; routes use shared `onError`. Shape: `{ error: { code, message, details? } }` (`src/shared/api-error.ts`).
- **IDs / time:** Use `IdGenerator` and clock ports in `src/worker/services/` — avoid inline `crypto.randomUUID()` in features so tests stay deterministic.
- **Vendors:** Mercado Pago and Resend only through `features/payments/port.ts` and `features/mail/port.ts` with fakes in tests.
- **SQL:** In feature services/repositories — not in route handlers. Routes do not call Mercado Pago.
- **Stock:** Only `src/worker/features/stock` mutates `on_hand` / `reserved`. One transaction per checkout/stock change. `available = on_hand - reserved`.
- **Money:** Integers in centavos only.
- **≤5 files** listed on the card. If you need a 6th file, web UI, or a product rule not in plan/spec: **block** (see below).

## Do not leak

Mercado Pago/Resend/OAuth/auth secrets, password hashes, `guest_token`, `payment_reference`, buyer PII beyond what the plan’s public/admin envelope allows, R2 keys/signed URLs, admin credentials.

## Block conditions

Emit `READY:impl` with `status: blocked` and overwrite handoff when:

- Card is **Lane:** `ui`
- More than **5 files** required
- New web route or React screen is required
- Missing endpoint/field is a **frontend** need — set `next_role: frontend` only after planner freezes contract; if contract missing, `next_role: planner`

Do not invent scope.

## When verification is green

1. Append **READY:impl** to the plan (template in handoff protocol).
2. Overwrite `.agents/tasks/handoff.md` for the **next** card or `next_role: auditor` if cards are done.
3. **Stop.**

## Red flags

- Editing `src/web/`
- Raw SQL in a Hono route file
- Direct Mercado Pago/Resend calls outside ports
- Starting Card N+1 without updating handoff
