# Vitalis handoff protocol

Shared mechanics for planner, backend, frontend, fullstack, and auditor roles. Executor skills reference this file; discipline rules (lane, ≤5 files, stop) stay in each skill.

## File locations

| Artifact | Path |
| --- | --- |
| Implementation plan | `.agents/plans/plan-VITALIS-<N>.md` |
| Session handoff | `.agents/tasks/handoff.md` |
| Audit report | `.agents/tasks/audit.md` |

## Read order (implementers)

1. `.agents/tasks/handoff.md`
2. The plan path named in the handoff (do not paste the full plan into handoff)
3. `AGENTS.md`
4. Role skill and skills listed under **Skills to load** in the handoff

## Verification ladder

| When | Command |
| --- | --- |
| Per card (typical) | Card’s **Verification command** in the plan, often `pnpm vitest run <file> && pnpm typecheck` |
| Before PR / audit gate | `pnpm preflight` (check → lint → typecheck → test) |

Vitest projects: `worker` (`src/worker/**`, `src/shared/**`), `web` (browser, `src/web/**`), `guards` (`*.guard.test.ts`).

## READY:impl block

When the card’s verification command is green, append to the plan (after the card section or in a **Implementation log** section):

```markdown
### READY:impl — Card <N> · <title>
- role: backend | frontend | fullstack
- tool: <cursor | opencode | codex | …>
- status: done | blocked
- files_changed: <path — what changed>
- command: `<exact command run>`
- result: pass | fail — <summary if fail>
- deviations_from_plan: none | <list>
- next_role: backend | frontend | fullstack | auditor | planner
```

If `status: blocked`, still append the block, set `result` to the blocker, and overwrite handoff with `next_role` pointing at the role that can unblock (usually `planner` or `backend`).

## Handoff template (implementer)

Overwrite `.agents/tasks/handoff.md`:

```markdown
# Handoff — VITALIS-<N>: <short title>

## Goal
Implement Card <M> of [.agents/plans/plan-VITALIS-<N>.md](.agents/plans/plan-VITALIS-<N>.md): <one line>.

## State of play
- Done: <prior cards or issues>
- In flight: Card <M> (<lane>)
- Blocked: None | <reason>

## Open decisions
None. | <only if planner left none>

## Role and tool
- role: backend | frontend | fullstack | auditor
- tool: <optional concrete AI tool name>

## Skills to load
- `vitalis-<role>` — executor contract for this lane
- `vitalis-conventions` — modules, centavos, stock, layout
- <2–3 more with one-line why>

## Artifacts
- `.agents/plans/plan-VITALIS-<N>.md`
- `ARCHITECTURE.md` / spec paths as needed
```

Rules: no pasted plan body; redact secrets; stop after handoff update — do not start the next card in the same session unless the human asks.

## Audit template

Write `.agents/tasks/audit.md`:

```markdown
# Audit — VITALIS-<N>

**Issue:** VITALIS-<N>  
**Plan:** `.agents/plans/plan-VITALIS-<N>.md`  
**Scope reviewed:** <cards or diff summary>

## Axes

### 1. Correctness vs acceptance
<findings>

### 2. Boundaries and lane
<findings — files_allowed, ≤5 files, routes/SQL, stock single-writer, components/ui>

### 3. Security and data exposure
<findings — leak list, envelope shape>

### 4. Tests
<findings — acceptance coverage, vitest project, TDD evidence>

### 5. Simplicity and performance
<findings>

## Domain invariants
<centavos, stock, snapshots, es-MX, Tabler, DESIGN.md>

## Preflight
- command: `pnpm preflight`
- result: pass | fail — <summary>

## Verdict
**verdict:** merge | reject  
**reject_owner:** backend | frontend | fullstack | planner | none  
**notes:** <short rationale>
```

Then overwrite `handoff.md` with verdict, `next_role`, and stop. Auditors do not patch `src/`.

## API error envelope (frozen contract)

Success and error JSON use `src/shared/api-error.ts`: `{ error: { code, message, details? } }` with snake_case `code` and Spanish `message` via `AppError` in `src/worker/lib/errors.ts`. Do not introduce alternate error shapes in new routes without a planned migration.

## Sensitive fields (never leak in public JSON/logs)

Mercado Pago tokens and webhook secrets, Resend keys, OAuth client secrets, auth secret, password hashes, `guest_token`, `payment_reference`, buyer email/phone/address in contexts wider than the plan allows, R2 object keys and signed URLs, admin credentials.
