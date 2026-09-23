---
name: vitalis-audit
description: Use when reviewing completed VITALIS work as the auditor role — read handoff and plan audit brief, inspect git diff, run preflight, write audit.md with merge or reject verdict without implementing fixes.
---

# Vitalis audit

## Overview

You are the **auditor** role. **Do not implement** the feature or patch `src/` or `migrations/`. Review against the plan and produce `.agents/tasks/audit.md`. Handoff: [.agents/references/vitalis-handoff-protocol.md](../../references/vitalis-handoff-protocol.md).

## When to use

- All cards for an issue are done or human requests audit before merge
- Handoff `role: auditor` or `next_role: auditor`

## Read first

1. `.agents/tasks/handoff.md`
2. Plan path — **Audit brief** section only if present; else acceptance criteria for completed cards
3. `git diff --stat` and focused `git diff` on changed paths
4. Skills: `clean-code-principles`, `better-auth-security-best-practices`, `web-perf`, `vercel-react-best-practices`; add `frontend-design` / `impeccable` if UI changed

## Five axes

Document findings under each heading in `audit.md` (template in handoff protocol).

1. **Correctness vs acceptance** — card checkboxes and spec behavior.
2. **Boundaries and lane** — stayed in `files_allowed`, ≤5 files per card, routes without SQL, stock single-writer, `components/ui` shadcn-only, browser never calls vendors.
3. **Security and data exposure** — leak list; `{ error: { code, message } }` shape; no secrets in logs/responses.
4. **Tests** — acceptance covered; correct vitest project; evidence of fail-first where required.
5. **Simplicity and performance** — DRY/KISS/YAGNI; D1 indexed queries and one transaction per stock/checkout; React bundle/re-render basics per `vercel-react-best-practices`.

## Domain invariants (spot-check)

Centavos storage; variant as sellable unit; `available = on_hand - reserved`; order line price snapshot; es-MX copy; Tabler not Lucide; DESIGN.md tokens only.

## Preflight

Run from repo root:

```bash
pnpm preflight
```

Record pass/fail in audit.md. A fail usually implies **reject** unless the diff is docs-only and preflight failure is unrelated (state explicitly).

## Verdict

- **verdict:** `merge` | `reject`
- **reject** → **reject_owner:** `backend` | `frontend` | `fullstack` | `planner` (who should fix), **not** auditor patching code
- Overwrite `.agents/tasks/handoff.md` with verdict, `next_role`, and summary
- **Stop**

## Red flags (auditor)

- Editing production code to “fix while reviewing”
- Approving without running preflight when worker/web changed
- Routing reject to auditor for implementation
