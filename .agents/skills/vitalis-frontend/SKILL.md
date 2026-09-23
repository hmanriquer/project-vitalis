---
name: vitalis-frontend
description: Use when executing a VITALIS ui task card as the frontend role — TanStack Router, React features, shadcn ui, DESIGN.md tokens, Tabler icons, ky client, and browser Vitest.
---

# Vitalis frontend

## Overview

You are the **frontend** role for Project Vitalis. Implement only the assigned **ui** card. Consume the **frozen** API contract in `src/shared`. Handoff: [.agents/references/vitalis-handoff-protocol.md](../../references/vitalis-handoff-protocol.md).

**Do not start the next card** after updating handoff.

## When to use

- Handoff `role: frontend` or card **Lane:** `ui`
- User invokes the frontend executor for VITALIS-\<N\>

**When NOT to use:** `data/api` only (`vitalis-backend`), both lanes on one card (`vitalis-fullstack`), audit (`vitalis-audit`).

## Read first

1. `.agents/tasks/handoff.md`
2. Plan path from handoff
3. `AGENTS.md`, [DESIGN.md](../../../DESIGN.md)
4. Handoff skills; always `vitalis-conventions`, `test-driven-development`, `frontend-design` or `shadcn` as needed
5. `webapp-testing` for browser tests

## Scope

- **May edit:** `src/web/**`
- **Read-only:** `src/shared/**` (do not change envelopes without a backend card)
- **Do not edit:** `src/worker/**`, `migrations/**`

## TDD

1. **Failing** test in the **web** project: `pnpm vitest run src/web/...` (Playwright provider / vitest browser).
2. Keep guard tests green: `no-vendor-imports.guard.test.ts`, `components/ui/boundary.guard.test.ts`.

## UI rules ([DESIGN.md](../../../DESIGN.md))

- **One Palette Rule** — colors only from DESIGN frontmatter tokens mapped to Tailwind/shadcn CSS variables.
- **Fired-Clay Restraint** — `primary` on roughly ≤10% of a screen.
- **Flat-By-Default** — borders and surface steps before drop shadows.
- **Specimen Label Rule** — table/metadata headers use label-sm uppercase where specified.
- **Icons:** `@tabler/icons-react` only in shipped UI; replace Lucide from shadcn templates.
- **Copy:** Spanish (es-MX); prices displayed as MXN with two decimals from centavos.
- No new ad hoc hex, GSAP, bounce animations, or extra glass beyond documented `nav-frosted`.

## Client stack

- **Server data:** TanStack Query — not Zustand.
- **Zustand:** cart until checkout and short UI flows only.
- **Forms:** TanStack Form + shadcn `Field` / `Input` / `Button`; Zod from `src/shared`.
- **HTTP:** `src/web/lib/api-client.ts` (ky) — never call Mercado Pago, Resend, or OAuth from the browser.
- **Routes:** TanStack Router; never hand-edit `routeTree.gen.ts`.
- **Primitives:** shadcn only under `src/web/components/ui`; feature UI lives in `src/web/features/*`.

## Block conditions

`READY:impl` + handoff with `status: blocked`, `next_role: backend` or `planner` when:

- New Hono endpoint, D1 column, or shared Zod field is required
- New npm dependency (e.g. MSW — not in repo; stub via ky/tests instead or block)
- More than **5 files** on the card
- Card is **Lane:** `data/api`

## When verification is green

1. Append **READY:impl** to the plan.
2. Overwrite `.agents/tasks/handoff.md` for next card or auditor.
3. **Stop.**

## Red flags

- Changing Drizzle schema or worker routes for UI convenience
- Lucide in production components
- English customer-facing strings
- Bare `fetch` bypassing api-client
